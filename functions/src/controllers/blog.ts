import {Request, Response, NextFunction} from "express";
import createClient from "../plugins/contentful";
import {LGTM, LGTM_ACTION} from "../consts/config";
import {getBlogLgtm, putBlogLgtm, getMonthlyArchives, getTagArchives} from "../models/blog";
import {BlogCategory} from "../types/interface";
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
          id: fields.categoryId,
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

export default {postBlogContentsLgtm, getBlogContentsLgtm, getBlog};
