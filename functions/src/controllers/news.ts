import {Request, Response, NextFunction} from "express";
import createClient from "../plugins/contentful";
import r from "../utils/response";
import {NewsItem} from "../types/interface";

const client = createClient({preview: false});

/**
 * ニュースの取得
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getNews = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  const {offset, limit} = req.query;
  // パラメータのチェック
  if (typeof offset !== "string" || typeof limit !== "string") {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  try {
    // contentfulからデータ取得
    const entries = await client.getEntries<NewsItem>({
      content_type: "news",
      skip: offset,
      limit: limit,
      order: "-sys.createdAt",
    });
    let contents: unknown[] = [];
    if (entries && entries.items) {
      contents = entries.items.map((entry) => {
        return {
          id: entry.sys.id,
          text: entry.fields.text,
          image: entry.fields?.image ?
            {
              url: entry.fields?.image.fields.file.url,
              alt: entry.fields?.image.fields.title,
            } :
            null,
          date: entry.fields.date,
        };
      });
    }
    r.success(res, {
      contents,
    });
  } catch (err) {
    next(Object.assign(err, {function: "getNews"}));
    r.error500(res, (err as Error).message);
  }
};

export default {
  getNews,
};
