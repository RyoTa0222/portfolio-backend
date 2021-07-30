import {IncomingWebhook, IncomingWebhookSendArguments} from "@slack/webhook";
import {
  SLACK_SERVER_WEBHOOK_URL,
  SLACK_CONTENTFUL_WEBHOOK_URL,
  SLACK_SENTRY_WEBHOOK_URL,
} from "../consts/config";
import {SLACK_NOTIFICATION_TYPE, SlackNotification} from "../types/interface";

/**
  * メッセージをslackに送信
  * @param {SLACK_NOTIFICATION_TYPE} type
  * @param {SLACK_NOTIFICATION} obj
  */
export const sendMessageToSlack = async (type: SLACK_NOTIFICATION_TYPE, obj: SlackNotification): Promise<void> => {
  const url = getSlackWebhookUrl(type);
  // slackにエラーを追加
  const webhook = new IncomingWebhook(url);
  // message作成
  const message: any[] = [
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": `*${obj.name}*`,
        },
      ],
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "plain_text",
          "text": obj.message,
        },
      ],
    },
  ];
  if (obj.function) {
    message.push({
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `Occurred in ${obj.function}`,
        },
      ],
    });
  }
  // 送信
  await webhook.send({
    "attachments": [
      {
        "color": type === "CONTENTFUL" ? "#6FCBFF" : "#FF6D6D",
        "blocks": message,
      },
    ],
  });
};

/**
  * オブジェクトをslackに送信
  * @param {SLACK_NOTIFICATION_TYPE} type
  * @param {IncomingWebhookSendArguments} object
  */
export const sendObjectToSlack = async (type: SLACK_NOTIFICATION_TYPE, object: IncomingWebhookSendArguments): Promise<void> => {
  const url = getSlackWebhookUrl(type);
  const webhook = new IncomingWebhook(url);
  await webhook.send(object);
};


/**
  * slackのwebhookのURLを取得
  * @param {SLACK_NOTIFICATION_TYPE} type
  * @return {string} webhookのURL
  */
export const getSlackWebhookUrl = (type: SLACK_NOTIFICATION_TYPE): string => {
  switch (type) {
    case "CONTENTFUL":
      return SLACK_CONTENTFUL_WEBHOOK_URL;
    case "SERVER":
      return SLACK_SERVER_WEBHOOK_URL;
    case "SENTRY":
      return SLACK_SENTRY_WEBHOOK_URL;
    default:
      return "";
  }
};
