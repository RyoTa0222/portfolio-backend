import * as functions from "firebase-functions";
import express, {Request, Response} from "express";
import cors from "cors";
import {
  ctfWebhookCreateBlogEvent,
  ctfWebhookUpdateBlogEvent,
  ctfWebhookUpdateBlogSeriesEvent,
  ctfWebhookDeleteBlogSeriesEvent,
} from "./controllers/contentful";
import {sendMessageToSlack} from "./utils/sendToSlack";
import portfolio from "./controllers/portfolio";
import blog from "./controllers/blog";
import roadmap from "./controllers/roadmap";
import news from "./controllers/news";
import r from "./utils/response";
import {postNotificationFromSentryToSlack} from "./controllers/sentry";

// Create Express server
const app: express.Express = express();

app.use(
    express.json({
      limit: "500mb",
      verify: (req: any, res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    })
);
app.use(
    express.urlencoded({
      limit: "500mb",
      extended: true,
    })
);

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  r.success(res, "success");
});

/**
 * v1
 */
// portfolio
app.get("/portfolio/works", portfolio.getPortfolioWorks);
app.get("/portfolio/shops", portfolio.getPortfolioShops);
// blog
app.get("/blog", blog.getBlog);
app.get("/blog/contents", blog.getBlogContents);
app.get("/blog/contents/lgtm", blog.getBlogContentsLgtm);
app.post("/blog/contents/lgtm", blog.postBlogContentsLgtm);
app.get("/blog/contents/:id", blog.getBlogContent);
// roadmap
app.get("/roadmap", roadmap.getRoadmap);

/**
 * v2
 */
// portfolio
app.get("/v2/portfolio/works", portfolio.getPortfolioWorks);
app.get("/v2/portfolio/shops", portfolio.getPortfolioShops);
// blog
app.get("/v2/blog", blog.getBlog);
app.get("/v2/blog/contents", blog.getBlogContentsV2);
app.get("/v2/blog/contents/lgtm", blog.getBlogContentsLgtm);
app.post("/v2/blog/contents/lgtm", blog.postBlogContentsLgtm);
app.get("/v2/blog/contents/:id", blog.getBlogContent);
// roadmap
app.get("/v2/roadmap", roadmap.getRoadmap);
// news
app.get("/v2/news", news.getNews);

// webhook
app.post("/contentful/lgtm", ctfWebhookCreateBlogEvent);
app.put("/contentful/archive", ctfWebhookUpdateBlogEvent);
app.put("/contentful/series", ctfWebhookUpdateBlogSeriesEvent);
app.put("/contentful/series/delete", ctfWebhookDeleteBlogSeriesEvent);
app.post("/sentry", postNotificationFromSentryToSlack);

// ハンドリングしてきたエラー処理
// エラー処理ミドルウェアは、その他の app.use() およびルート呼び出しの後で最後に定義します
// https://expressjs.com/ja/guide/error-handling.html
app.use(async (err: Error) => {
  await sendMessageToSlack("SERVER", err);
});

// 予算アラート通知
export const notifyUsageFeeToSlack = functions.pubsub
    .topic("notifyUsageFeeToSlack")
    .onPublish((message) => {
      const messageBody_JSON = Buffer.from(message.data, "base64").toString();
      const messageBody = JSON.parse(messageBody_JSON);
      const cost = messageBody.costAmount;
      const budget = messageBody.budgetAmount;
      if (cost > 0) {
      // メッセージをslackに送信するかのフラグ
        let flg = false;
        const message_text = `Firebase 今月の利用額：${cost}円\n予算：${budget}円`;
        // コストが指定の閾値
        // 50%以上
        // TODO: 前回の予算を保存しておいてどれくらい上がっているかをみれた方がいい
        if (cost > budget / 2) {
          flg = true;
        }
        if (flg) {
          sendMessageToSlack("SERVER", {
            name: "Firebase 予算アラート",
            message: message_text,
            type: "info",
          });
        }
      }
    });

export const api = functions.region("asia-northeast1").https.onRequest(app);
