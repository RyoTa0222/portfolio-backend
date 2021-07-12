import {Request, Response, NextFunction} from "express";
import createClient from "../plugins/contentful";
import {PortfolioWork} from "../types/interface";
import {PORTFOLIO_TYPE_WORK} from "../consts/config";
import r from "../utils/response";

const client = createClient();

/**
  * ポートフォリオの製作物一覧の取得
  * @param {Request} req
  * @param {Response} res
  * @param {NextFunction} next
  */
const getPortfolioWorks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {offset, limit} = req.query;
  // パラメータのチェック
  if (typeof offset !== "string" || typeof limit !== "string") {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  try {
    // contentfulからデータ取得
    const entries = await client.getEntries({
      content_type: "portfolio",
      order: "-fields.created_year",
      limit,
      skip: offset,
      links_to_entry: PORTFOLIO_TYPE_WORK,
    });
    const items = entries.items;
    const data = items.map((item) => {
      const fields = item.fields as PortfolioWork;
      const imageSysId = fields.image.sys.id;
      const imageObj = entries.includes.Asset.find((_asset: any) => _asset.sys.id === imageSysId);
      return {
        image: imageObj?.fields?.file?.url ?? null,
        title: fields.title,
        description: fields.description,
        link: fields.link ?? null,
        github: fields.github ?? null,
        year: fields.created_year,
      };
    });
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getPortfolioWorks"}));
    r.error500(res, err.message);
  }
};

/**
  * ポートフォリオの商品一覧の取得
  * @param {Request} req
  * @param {Response} res
  * @param {NextFunction} next
  */
const getPortfolioShops = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {offset, limit, shopType} = req.query;
  // パラメータのチェック
  if (typeof offset !== "string" || typeof limit !== "string" || typeof shopType !== "string") {
    r.error400(res, "パラメータが不足しています");
    return;
  }
  try {
    // contentfulからデータ取得
    const entries = await client.getEntries({
      content_type: "portfolio",
      order: "-fields.created_year",
      limit,
      skip: offset,
      links_to_entry: PORTFOLIO_TYPE_WORK,
    });
    const items = entries.items;
    const data = items.map((item) => {
      const fields = item.fields as PortfolioWork;
      const imageSysId = fields.image.sys.id;
      const imageObj = entries.includes.Asset.find((_asset: any) => _asset.sys.id === imageSysId);
      return {
        image: imageObj?.fields?.file?.url ?? null,
        title: fields.title,
        description: fields.description,
        link: fields.link ?? null,
      };
    });
    r.success(res, data);
  } catch (err) {
    next(Object.assign(err, {function: "getPortfolioShops"}));
    r.error500(res, err.message);
  }
};

export default {getPortfolioWorks, getPortfolioShops};
