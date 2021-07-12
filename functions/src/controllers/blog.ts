import {Request, Response, NextFunction} from "express";
// import createClient from "../plugins/contentful";
import {LGTM, LGTM_ACTION} from "../consts/config";
import {getBlogLgtm, putBlogLgtm} from "../models/blog";

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
    res.send({success: false, message: "パラメータが不足しています"});
    return;
  }
  try {
    const data = await getBlogLgtm(id);
    // データが取得できなかった場合はエラーで返す
    if (data === null) {
      res.send({success: false, message: "データの取得に失敗しました"});
      return;
    }
    res.send({success: true, data});
  } catch (err) {
    next(Object.assign(err, {function: "getBlog"}));
    res.send({success: false, message: err.message});
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
  if (typeof id !== "string") {
    res.status(400).send({success: false, message: "パラメータが不足しています"});
    return;
  }
  if ( !LGTM.includes(type) ) {
    res.status(400).send({success: false, message: "パラメータが不足しています"});
    return;
  }
  if ( !LGTM_ACTION.includes(action) ) {
    res.status(400).send({success: false, message: "パラメータが不足しています"});
    return;
  }
  try {
    const value = action === "increment" ? 1 : -1;
    const response = await putBlogLgtm(id, type, value);
    if (response === null) {
      res.send({success: false, message: "データの更新に失敗しました"});
      return;
    }
    res.send({success: true});
  } catch (err) {
    next(Object.assign(err, {function: "getBlog"}));
    res.status(400).send({success: false, message: err.message});
  }
};

export default {postBlogContentsLgtm, getBlogContentsLgtm};
