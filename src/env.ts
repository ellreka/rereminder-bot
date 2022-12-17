import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN ?? "",
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ?? "",
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET ?? "",
  SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID ?? "",
  SLACK_USER_TOKEN: process.env.SLACK_USER_TOKEN ?? "",
};
