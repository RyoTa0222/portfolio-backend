import {Request, Response, NextFunction} from "express";
import createClient from "../plugins/contentful";
import {LGTM, LGTM_ACTION, BLOG_HEADING_LIST} from "../consts/config";
import {
  getBlogLgtm,
  putBlogLgtm,
  getMonthlyArchives,
  getTagArchives,
  getTagArchive,
} from "../models/blog";
import {
  BlogCategory,
  BlogContent,
  BlogContentHeading,
  Author,
  CtfContent,
} from "../types/interface";
import {DateTime} from "luxon";
import r from "../utils/response";
import {getOgp} from "../utils/getOgp";
import {Entry, EntryCollection} from "contentful";

const client = createClient();

/**
 * ブログのLGTMの取得
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getBlogContentsLgtm = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  const {id} = req.query;
  // パラメータのチェック
  if (typeof id !== "string") {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  try {
    const data = await getBlogLgtm(id);
    // データが取得できなかった場合はエラーで返す
    if (data === null) {
      r.error400(res, "データの取得に失敗しました");
      return;
    }
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getBlogContentsLgtm"}));
    r.error500(res, (err as Error).message);
  }
};

/**
 * ブログのLGTMの保存
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const postBlogContentsLgtm = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  const {type, id, action} = req.body;
  // パラメータのチェック
  if (
    typeof id !== "string" ||
    !LGTM.includes(type) ||
    !LGTM_ACTION.includes(action)
  ) {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  try {
    const value = action === "increment" ? 1 : -1;
    const response = await putBlogLgtm(id, type, value);
    if (response === null) {
      r.error400(res, "データの更新に失敗しました");
      return;
    }
    r.success(res);
  } catch (err) {
    next(Object.assign(err, {function: "postBlogContentsLgtm"}));
    r.error500(res, (err as Error).message);
  }
};

/**
 * ブログ情報の取得
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getBlog = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  try {
    // 月別アーカイブの取得
    const monthly_archives = await getMonthlyArchives();
    // タグ別アーカイブの取得
    const tag_archives = await getTagArchives();
    // タグの取得
    // contentfulからデータ取得
    const entries = await client.getEntries({
      content_type: "blogCategory",
      order: "fields.priority",
    });
    let tags: unknown[] = [];
    if (entries && entries.items) {
      tags = entries.items.map((item) => {
        const fields = item.fields as BlogCategory;
        return {
          label: fields.categoryName,
          color: fields.color,
          tag_id: fields.categoryId,
          id: item.sys.id,
        };
      });
    }
    const data = {monthly_archives, tag_archives, tags};
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getBlog"}));
    r.error500(res, (err as Error).message);
  }
};

/**
 * ブログのコンテンツ一覧の取得
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getBlogContents = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  const {search_word, tag, time, offset, limit} = req.query;
  // パラメータのチェック
  if (typeof offset !== "string" || typeof limit !== "string") {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  try {
    // contentful取得
    const params: Record<string, unknown> = {
      content_type: "blog",
      skip: offset,
      limit: limit,
      order: "-sys.createdAt",
    };
    // 検索する場合
    if (typeof search_word === "string" && search_word.length > 0) {
      params.query = search_word;
    }
    // タグで絞り込み
    if (tag) {
      params["fields.category.sys.id"] = tag;
    }
    // 期間で絞り込み
    if (time) {
      const range_start = DateTime.fromISO(time as string).toISO();
      const range_end = DateTime.fromISO(time as string)
          .plus({months: 1})
          .toISO();
      params["sys.createdAt[gte]"] = range_start;
      params["sys.createdAt[lt]"] = range_end;
    }
    const entries = await client.getEntries(params);
    let contents: unknown[] = [];
    if (entries && entries.items) {
      contents = entries.items.map((item) => {
        const fields = item.fields as BlogContent;
        // 作成日
        const created_at = DateTime.fromISO(item.sys.createdAt).toFormat(
            "yyyy-MM-dd"
        );
        // 画像
        const thumbnailId = fields.thumbnail.sys.id;
        const imageObj = entries.includes.Asset.find(
            (_asset: any) => _asset.sys.id === thumbnailId
        );
        // タグ
        const tagId = fields.category.sys.id;
        const tagObj = entries.includes.Entry.find(
            (_entry: any) => _entry.sys.id === tagId
        );
        const tagFields = tagObj.fields as BlogCategory;
        return {
          title: fields.title,
          id: fields.id,
          created_at: created_at,
          tag: {
            label: tagFields.categoryName,
            color: tagFields.color,
            tag_id: tagFields.categoryId,
            id: tagObj.sys.id,
          },
          image: imageObj.fields.file.url,
        };
      });
    }
    const page = {
      current: Number(offset) / Number(limit) + 1,
      total_count: Math.ceil(entries.total / Number(limit)),
    };
    const data = {contents, page};
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getBlogContents"}));
    r.error500(res, (err as Error).message);
  }
};

/**
 * ブログのコンテンツ一覧の取得（v2）
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getBlogContentsV2 = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  const {search_word, tag, time, offset, limit, series} = req.query;
  // パラメータのチェック
  if (typeof offset !== "string" || typeof limit !== "string") {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  let data;
  try {
    // contentful取得
    const params: Record<string, unknown> = {
      content_type: "blog",
      skip: offset,
      limit: limit,
      order: "-sys.createdAt",
    };
    // 検索する場合
    if (typeof search_word === "string" && search_word.length > 0) {
      params.query = search_word;
    }
    // 期間で絞り込み
    if (time) {
      const range_start = DateTime.fromISO(time as string).toISO();
      const range_end = DateTime.fromISO(time as string)
          .plus({months: 1})
          .toISO();
      params["sys.createdAt[gte]"] = range_start;
      params["sys.createdAt[lt]"] = range_end;
    }
    // シリーズで絞り込みの場合
    if (series) {
      params["fields.series.sys.id"] = series;
    }
    // タグで絞り込みの場合
    if (tag) {
      params["fields.category.sys.id"] = tag;
      const contents: Record<string, unknown> = {};
      // カテゴリ情報の取得
      const ctfTagData = await client.getEntries<any>({
        "content_type": "blogCategory",
        "sys.id": tag,
      });
      console.log(`ctfTagData: ${JSON.stringify(ctfTagData)}`);
      if (ctfTagData.items && ctfTagData.items.length === 0) {
        data = {contents};
        r.success(res, data);
        return;
      }
      const ctfTagItem = ctfTagData.items[0];
      const tagData = await getTagArchive(
        ctfTagItem.fields.categoryId as string
      );
      console.log(`tagData: ${JSON.stringify(tagData)}`);
      // 指定のタグにシリーズ情報がある場合
      if (tagData && (tagData.series as string[]).length > 0) {
        const paramsSlice = {...params};
        (tagData.series as string[]).forEach(async (seriesId) => {
          // シリーズ情報の取得
          const seriesData = await client.getEntries({
            "content_type": "blogSeries",
            "sys.id": seriesId,
          });
          console.log(`seriesData: ${JSON.stringify(seriesData)}`);
          const seriesItem = seriesData.items[0];
          // 記事一覧情報の取得
          paramsSlice["fields.series.sys.id"] = seriesId;
          paramsSlice.limit = 4;
          const entries = await client.getEntries(paramsSlice);
          console.log(`entries: ${JSON.stringify(entries)}`);
          contents[(seriesItem.fields as any).slug] = {
            label: (seriesItem.fields as any).name,
            contents: entries.items.map((item) => {
              return formatBlogContent(item, entries);
            }),
            total: entries.total,
          };
        });
      }
      // シリーズ情報がない場合
      const paramsSlice = {...params};
      paramsSlice["fields.series[exists]"] = false;
      paramsSlice.limit = 4;
      const entries = await client.getEntries(paramsSlice);
      contents["others"] = {
        label: "その他",
        contents: entries.items.map((item) => {
          return formatBlogContent(item, entries);
        }),
        total: entries.total,
      };
      data = {contents};
    } else {
      const entries = await client.getEntries(params);
      let contents: unknown[] = [];
      if (entries && entries.items) {
        contents = entries.items.map((item) => {
          return formatBlogContent(item, entries);
        });
      }
      const page = {
        current: Number(offset) / Number(limit) + 1,
        total_count: Math.ceil(entries.total / Number(limit)),
      };
      data = {contents, page};
    }
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getBlogContents"}));
    r.error500(res, (err as Error).message);
  }
};

/**
 * ブログのコンテンツ詳細の取得
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getBlogContent = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  const {id} = req.params;
  // パラメータのチェック
  if (!id) {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  try {
    // contentfulからデータ取得
    const entries = await client.getEntries({
      "content_type": "blog",
      "fields.id": id,
    });
    if (entries.total < 1) {
      r.error400(res, "記事が見つかりません");
      return;
    }
    const item = entries.items[0];
    const fields = item.fields as BlogContent;
    // 記事データの整形
    // 作成日
    const created_at = DateTime.fromISO(item.sys.createdAt).toFormat(
        "yyyy-MM-dd"
    );
    // 更新日
    const updated_at = DateTime.fromISO(item.sys.updatedAt).toFormat(
        "yyyy-MM-dd"
    );
    // 画像
    const thumbnailId = fields.thumbnail.sys.id;
    const imageObj = entries.includes.Asset.find(
        (_asset: any) => _asset.sys.id === thumbnailId
    );
    // タグ
    const tagId = fields.category.sys.id;
    const tagObj = entries.includes.Entry.find(
        (_entry: any) => _entry.sys.id === tagId
    );
    const tagFields = tagObj.fields as BlogCategory;
    // 著者
    let author = null;
    const authorId = fields.author ? fields.author.sys.id : undefined;
    if (authorId) {
      const authorObj = entries.includes.Entry.find(
          (_entry: any) => _entry.sys.id === authorId
      );
      const authorFields = authorObj.fields as Author;
      const authorImageId = authorFields.image.sys.id;
      const authorImageObj = entries.includes.Asset.find(
          (_asset: any) => _asset.sys.id === authorImageId
      );
      author = {
        name: authorFields.name,
        description: authorFields.description,
        image: authorImageObj.fields.file.url,
        id: authorObj.sys.id,
      };
    }
    // LGTMの取得
    const lgtm = await getBlogLgtm(id);
    const content = await mergeOgp(
        (fields.body as { content: CtfContent[] }).content
    );
    const data = {
      title: fields.title,
      image: imageObj.fields.file.url,
      created_at,
      updated_at,
      content,
      entry: entries.includes ? entries.includes.Entry : null,
      asset: entries.includes ? entries.includes.Asset : null,
      author,
      lgtm,
      index: getShapedBlogIndex((fields.body as { content: any[] }).content),
      tag: {
        label: tagFields.categoryName,
        color: tagFields.color,
        tag_id: tagFields.categoryId,
        id: tagObj.sys.id,
      },
    };
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getBlogContent"}));
    r.error500(res, (err as Error).message);
  }
};

/**
 * hyperlinkにOGP情報を付与する
 * @param {CtfContent[]} arr
 * @return {Promise<CtfContent[]>}
 */
const mergeOgp = async (arr: CtfContent[]) => {
  return await Promise.all(
      arr.map(async (el) => {
        if (el && el.nodeType === "paragraph") {
          if (el.content) {
            await Promise.all(
                el.content.map(async (_el) => {
                  if (_el.nodeType === "hyperlink") {
                    const url = _el.data.uri;
                    const ogp = await getOgp(url);
                    _el["ogp"] = ogp;
                  }
                  return _el;
                })
            );
          }
        }
        return el;
      })
  );
};

/**
 * ブログの目次の生成
 * @param {any[]} document
 * @return {Record<string, string>}
 */
const getShapedBlogIndex = (document: any[]) => {
  const arr: BlogContentHeading[] = document.filter((doc: any) =>
    BLOG_HEADING_LIST.includes(doc.nodeType)
  );
  const res = arr.map((item, index) => ({
    label: item.content[0].value,
    type: item.nodeType.slice(0, 1) + item.nodeType.slice(-1),
    index,
  }));
  return res;
};

/**
 * ブログのフォーマット
 * @param {Entry<unknown>} content
 * @param {Entry<unknown>} entries
 * @return {Record<string, string>}
 */
const formatBlogContent = (
    content: Entry<unknown>,
    entries: EntryCollection<unknown>
) => {
  const fields = content.fields as BlogContent;
  // 作成日
  const created_at = DateTime.fromISO(content.sys.createdAt).toFormat(
      "yyyy-MM-dd"
  );
  // 画像
  const thumbnailId = fields.thumbnail.sys.id;
  const imageObj = entries.includes.Asset.find(
      (_asset: any) => _asset.sys.id === thumbnailId
  );
  // タグ
  const tagId = fields.category.sys.id;
  const tagObj = entries.includes.Entry.find(
      (_entry: any) => _entry.sys.id === tagId
  );
  const tagFields = tagObj.fields as BlogCategory;
  return {
    title: fields.title,
    id: fields.id,
    created_at: created_at,
    tag: {
      label: tagFields.categoryName,
      color: tagFields.color,
      tag_id: tagFields.categoryId,
      id: tagObj.sys.id,
    },
    image: imageObj.fields.file.url,
  };
};

export default {
  postBlogContentsLgtm,
  getBlogContentsLgtm,
  getBlog,
  getBlogContents,
  getBlogContent,
  getBlogContentsV2,
};
