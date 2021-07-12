// import {Request, Response, NextFunction} from "express";
// import createClient from "../plugins/contentful";
// import {PortfolioWork} from "../types/interface";
// import {PORTFOLIO_TYPE_WORK} from "../consts/config";

// const client = createClient();

// /**
//   * ブログの設定の取得
//   * @param {Request} req
//   * @param {Response} res
//   * @param {NextFunction} next
//   */
// const getBlog = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // contentfulからデータ取得
//     const entries = await client.getEntries({

//     });
//   } catch (err) {
//     next(Object.assign(err, {function: "getBlog"}));
//     res.send({success: false, message: err.message});
//   }
// };
