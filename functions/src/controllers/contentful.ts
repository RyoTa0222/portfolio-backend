import {NextFunction, Request, Response} from "express";
import createClient from "../plugins/contentful";
import {getBlogLgtm, postBlogLgtm, putBlogArchive} from "../models/blog";
import {sendMessageToSlack} from "../utils/sendToSlack";
import {BlogCategory} from "../types/interface";
import {DateTime} from "luxon";
import r from "../utils/response";

const client = createClient();

/**
 * 記事が作成された際に呼ばれる
 * LGTMの値を管理するカラムの作成
 * @param {Request} req webhookで渡ってきたリクエスト
 * @param {Response} res レスポンス
 * @param {NextFunction} next レスポンス
 */
export const ctfWebhookCreateBlogEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {id} = req.body;
    const response = await getBlogLgtm(id["en-US"]);
    if (response === null) {
      await postBlogLgtm(id["en-US"]);
      sendMessageToSlack("CONTENTFUL", {name: "200 Success", message: "Webhookを正常に実行しました\n 関数：ctfWebhookCreateBlogEvent"});
    }
    r.success(res, "success");
  } catch (err) {
    next(Object.assign(err, {function: "ctfWebhookEventRouter"}));
    r.error500(res, "error");
  }
};

/**
 * 記事が作成 / 削除された際に呼ばれる
 * @param {Request} req webhookで渡ってきたリクエスト
 * @param {Response} res レスポンス
 * @param {NextFunction} next レスポンス
 */
export const ctfWebhookUpdateBlogEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {createdAt, tagId} = req.body;
    // タグIDの取得
    const tag_id = tagId["en-US"].sys.id;
    // 作成日の取得
    const created_at = DateTime.fromISO(createdAt).toFormat("yyyy-MM");
    // ブログのカテゴリIDを取得
    const entries = await client.getEntries({
      "content_type": "blogCategory",
      "sys.id": tag_id,
    });
    // カテゴリIDが取得できなかった場合
    if (entries.total < 1) {
      sendMessageToSlack("CONTENTFUL", {name: "400 Error", message: "カテゴリが取得できませんでした"});
      r.error500(res, "error");
      return;
    }
    const tag = (entries.items.find((item) => item.sys.id === tag_id)?.fields as BlogCategory).categoryId;
    // 月別アーカイブ情報の取得
    const monthly_count = await getBlogCountOfMonth(created_at);
    // タグ別アーカイブ情報の取得
    const tag_count = await getBlogCountOfCategory(tag_id);
    const percent = await getBlogPercentageOfCategory(tag_id);
    // アーカイブ情報の更新
    await putBlogArchive(created_at, tag, monthly_count, tag_count, percent );
    sendMessageToSlack("CONTENTFUL", {name: "200 Success", message: "Webhookを正常に実行しました\n 関数：ctfWebhookUpdateBlogEvent"});
    r.success(res, "success");
  } catch (err) {
    next(Object.assign(err, {function: "ctfWebhookEventRouter"}));
    r.error500(res, "error");
  }
};

/**
 * ブログのカテゴリごとのブログの割合（％）を取得
 * @param {string} id
 * @return {number}
 */
const getBlogPercentageOfCategory = async (id: string): Promise<number> => {
  // 全てのブログを取得
  const all_blogs_entries = await client.getEntries({
    "content_type": "blog",
  });
  // 指定のカテゴリのブログを取得
  const blogs_of_category_entries = await client.getEntries({
    "content_type": "blog",
    "fields.category.sys.id": id,
  });
  return Math.floor(blogs_of_category_entries.total / all_blogs_entries.total * 100);
};

/**
 * ブログの指定のカテゴリのブログの数を取得
 * @param {string} id
 * @return {number}
 */
const getBlogCountOfCategory = async (id: string): Promise<number> => {
  // 指定のカテゴリのブログを取得
  const entries = await client.getEntries({
    "content_type": "blog",
    "fields.category.sys.id": id,
  });
  return entries.total;
};

/**
 * ブログの指定の月のブログの数を取得
 * @param {string} created_at
 * @return {number}
 */
const getBlogCountOfMonth = async (created_at: string): Promise<number> => {
  // 作成日の取得
  const range_start = DateTime.fromISO(created_at).toISO();
  const range_end = DateTime.fromISO(created_at).plus({months: 1}).toISO();
  console.log(`range_start: ${range_start}`);
  console.log(`range_end: ${range_end}`);
  // 指定のカテゴリのブログを取得
  const entries = await client.getEntries({
    "content_type": "blog",
    "sys.createdAt[gte]": range_start,
    "sys.createdAt[lt]": range_end,
  });
  return entries.total;
};
