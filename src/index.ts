import { App, SocketModeReceiver } from "@slack/bolt";
import { env } from "./env";
import { sendMissedMessages } from "./functions";

const socketModeReceiver = new SocketModeReceiver({
  appToken: env.SLACK_APP_TOKEN,
});

const app = new App({
  token: env.SLACK_BOT_TOKEN,
  signingSecret: env.SLACK_SIGNING_SECRET,
  receiver: socketModeReceiver,
});

(async () => {
  await app.start();
  console.log("⚡️ Bolt app is running!");
})();

app.command("/rere", async ({ command, ack, respond }) => {
  await ack();
  await sendMissedMessages(app, command.user_id);
  console.log("/rere command");
});
