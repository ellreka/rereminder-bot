import { Hono } from "hono";
import { sendMissedMessages } from "./functions";
import { oauth } from "./slack";

type Bindings = {
  TOKEN_KV: KVNamespace;
  SLACK_BOT_TOKEN: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_SHAREABLE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/rere", async (c) => {
  const query = await c.req.parseBody<{ user_id: string }>();
  const { user_id } = query;

  const kv = c.env.TOKEN_KV;
  const token = await kv.get(user_id);
  if (token == null) return c.text(`Not authenticated.\n${c.env.SLACK_SHAREABLE_URL}`);
  try {
    await sendMissedMessages({
      userId: user_id,
      userToken: token,
      botToken: c.env.SLACK_BOT_TOKEN,
      channel: user_id,
    });
    return c.text("");
  } catch (e) {
    throw e;
  }
});

app.get("/auth", async (c) => {
  const { code } = c.req.query();
  console.log({ code });
  if (code == null) {
    return c.notFound();
  }
  const response = await oauth({
    client_id: c.env.SLACK_CLIENT_ID,
    client_secret: c.env.SLACK_CLIENT_SECRET,
    code,
  });
  if (!response.ok) return c.notFound();

  const kv = c.env.TOKEN_KV;
  const { authed_user } = response;
  if (authed_user?.id && authed_user.access_token) {
    await kv.put(authed_user.id, authed_user.access_token);
  }
  return c.text("success!");
});

export default app;
