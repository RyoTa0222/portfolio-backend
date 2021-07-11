import {NextFunction, Request, Response} from "express";
import {postBlogLgtm} from "../models/contentful";
import {sendMessageToSlack} from "../utils/sendToSlack";

/**
 * リクエストのタイプによって呼び出す関数を指定する
 * @param {Request} req webhookで渡ってきたリクエスト
 * @param {Response} res レスポンス
 * @param {NextFunction} next レスポンス
 */
export const ctfWebhookEventRouter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {id} = req.body;
    await postBlogLgtm(id["en-US"]);
    sendMessageToSlack("CONTENTFUL", {name: "200 Success", message: "Webhookを正常に実行しました"});
    res.status(200).send("success");
  } catch (err) {
    next(Object.assign(err, {function: "ctfWebhookEventRouter"}));
    res.status(500).send("error");
  }
};
