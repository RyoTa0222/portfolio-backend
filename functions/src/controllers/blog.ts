import {Request, Response, NextFunction} from "express";
import createClient from "../plugins/contentful";
import {LGTM, LGTM_ACTION} from "../consts/config";
import {getBlogLgtm, putBlogLgtm, getMonthlyArchives, getTagArchives} from "../models/blog";
import {BlogCategory, BlogContent} from "../types/interface";
import {DateTime} from "luxon";
import r from "../utils/response";

const client = createClient();

/**
  * ブログのLGTMの取得
  * @param {Request} req
  * @param {Response} res
  * @param {NextFunction} next
  */
const getBlogContentsLgtm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    r.error500(res, err.message);
  }
};

/**
  * ブログのLGTMの保存
  * @param {Request} req
  * @param {Response} res
  * @param {NextFunction} next
  */
const postBlogContentsLgtm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {type, id, action} = req.body;
  // パラメータのチェック
  if (typeof id !== "string" || !LGTM.includes(type) || !LGTM_ACTION.includes(action)) {
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
    r.error500(res, err.message);
  }
};

/**
  * ブログの設定の保存
  * @param {Request} req
  * @param {Response} res
  * @param {NextFunction} next
  */
const getBlog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    r.error500(res, err.message);
  }
};

/**
  * ブログの設定の保存
  * @param {Request} req
  * @param {Response} res
  * @param {NextFunction} next
  */
const getBlogContents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const range_end = DateTime.fromISO(time as string).plus({months: 1}).toISO();
      params["sys.createdAt[gte]"] = range_start;
      params["sys.createdAt[lt]"] = range_end;
    }
    const entries = await client.getEntries(params);
    let contents: unknown[] = [];
    if (entries && entries.items) {
      contents = entries.items.map((item) => {
        const fields = item.fields as BlogContent;
        // 作成日
        const created_at = DateTime.fromISO(item.sys.createdAt).toFormat("yyyy-MM-dd");
        // 画像
        const thumbnailId = fields.thumbnail.sys.id;
        const imageObj = entries.includes.Asset.find((_asset: any) => _asset.sys.id === thumbnailId);
        // タグ
        const tagId = fields.category.sys.id;
        const tagObj = entries.includes.Entry.find((_entry: any) => _entry.sys.id === tagId);
        const tagFields = tagObj.fields as BlogCategory;
        return {
          title: fields.title,
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
    next(Object.assign(err, {function: "getBlog"}));
    r.error500(res, err.message);
  }
};


export default {postBlogContentsLgtm, getBlogContentsLgtm, getBlog, getBlogContents};
