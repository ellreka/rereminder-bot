import { Hono } from "hono";
import { resolveMessage, sendMissedMessages } from "./functions";
import { oauth } from "./slack";

type Bindings = {
  USER_KV: KVNamespace;
  SLACK_BOT_TOKEN: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_SHAREABLE_URL: string;
};

type USER_KV = {
  token: string;
  resolvedIds: string[];
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/rere", async (c) => {
  const query = await c.req.parseBody<{ user_id: string }>();
  const { user_id } = query;

  const kv = c.env.USER_KV;
  const response = await kv.get<USER_KV>(user_id, "json");
  if (response == null)
    return c.text(`Not authenticated.\n${c.env.SLACK_SHAREABLE_URL}`);
  try {
    await sendMissedMessages({
      userId: user_id,
      userToken: response.token,
      botToken: c.env.SLACK_BOT_TOKEN,
      channel: user_id,
      resolvedIds: response.resolvedIds,
    });
    return c.text("");
  } catch (e) {
    throw e;
  }
});

app.post("/interactivity", async (c) => {
  const body = await c.req.parseBody<{
    payload: string;
  }>();
  const payload = JSON.parse(body.payload);

  if (payload.actions[0].action_id === "resolve_message") {
    await resolveMessage({ botToken: c.env.SLACK_BOT_TOKEN, payload });
    const kv = c.env.USER_KV;
    const response = await kv.get<USER_KV>(payload.user.id, "json");
    if (response != null) {
      const resolvedIds: string[] = [
        payload.actions[0].value,
        ...response.resolvedIds,
      ];
      await kv.put(
        payload.user.id,
        JSON.stringify({
          ...response,
          resolvedIds,
        })
      );
    }
  }
  return c.status(200);
});

app.get("/auth", async (c) => {
  const { code } = c.req.query();
  if (code == null) {
    return c.notFound();
  }
  const response = await oauth({
    client_id: c.env.SLACK_CLIENT_ID,
    client_secret: c.env.SLACK_CLIENT_SECRET,
    code,
  });
  if (!response.ok) return c.notFound();

  const kv = c.env.USER_KV;
  const { authed_user } = response;
  if (authed_user?.id && authed_user.access_token) {
    await kv.put(
      authed_user.id,
      JSON.stringify({
        token: authed_user.access_token,
        resolvedIds: [],
      })
    );
  }
  return c.text("success!");
});

export default app;
