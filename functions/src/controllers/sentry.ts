import {NextFunction, Request, Response} from "express";
import {sendObjectToSlack} from "../utils/sendToSlack";
import r from "../utils/response";
import {IncomingWebhookSendArguments} from "@slack/webhook";

export const postNotificationFromSentryToSlack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const url = req.body.url;
  const event = req.body.event;
  console.log(JSON.stringify(req.body));
  const {user, metadata, contexts: {device, browser, os}, level, environment, title} = event;
  // ブラウザ情報
  const browserInfo = `${browser.name} ${browser.type} ${browser.version}`;
  // OS情報
  const osInfo = (os === undefined) ? "unknown" : `${os.name} ${os.type} ${os.version}`;
  // デバイス情報
  const deviceInfo = (device === undefined) ? "unknown" : `${device.family}`;
  // デバイス情報
  const userInfo = (user === undefined) ? "unknown" : `IP:${user.ip_address} address: ${user.geo.region} ${user.geo.city}`;
  // Sentryのissue URL
  const issue = {
    message: title,
    detail: url,
    browser: browserInfo,
    os: osInfo,
    device: deviceInfo,
    user: userInfo,
  };
  const issueProperties = Object.entries(issue).map((entry) => {
    return `${entry[0]}: ${entry[1]}`;
  });

  const payload: IncomingWebhookSendArguments = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*${level}: ${metadata.type}* (*${environment}*) `,
        },
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": issueProperties.join("\n"),
        },
      },
    ],
  };
  try {
    await sendObjectToSlack("SENTRY", payload);
    r.success(res, "success");
  } catch (err) {
    next(Object.assign(err, {function: "ctfWebhookEventRouter"}));
    r.error500(res, "error");
  }
};
