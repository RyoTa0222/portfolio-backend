import * as functions from "firebase-functions";

export const config = functions.config();

export const SLACK_SERVER_WEBHOOK_URL = config.slack.server_webhook_url;
export const SLACK_CONTENTFUL_WEBHOOK_URL = config.slack.contentful_webhook_url;

export const PORTFOLIO_TYPE_SHOP = "3bk7GKH4EWt8ogohnCnrDJ";
export const PORTFOLIO_TYPE_WORK = "4L2MYmx7zKMOc8OIjd4TL8";
