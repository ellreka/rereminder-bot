import { Hono } from "hono";
import { validator } from "hono/validator";
import { sendMissedMessages } from "./functions";

const app = new Hono();

app.post(
  "*",
  // validator(
  //   (v, c) => () => {
  //     return {
  //       token: v.body("token").isEqual(c.env.SLACK_TOKEN),
  //       text: v.body("text").isRequired(),
  //     };
  //   },
  //   {
  //     done: (result, c) => {
  //       if (result.hasError) {
  //         console.log(result.messages);
  //       }
  //     },
  //   }
  // ),
  async (c) => {
    // const res = c.req.valid()
    // console.log(res);
    console.log(c);
    // const result = parse(res.text)
    // await sendMissedMessages({
    //   userId: "UK6UWRVNZ",
    //   userToken: c.env.SLACK_USER_TOKEN,
    //   botToken: c.env.SLACK_BOT_TOKEN,
    //   channel: c.env.SLACK_CHANNEL_ID,
    // })
    // return c.text("Hello! Hono!");
    return c.text("");
  }
);

const parse = (text: string) => {
  const regex = /^([0-9a-zA-Z]+)(\+\+|\-\-)/;
  const result = text.trim().match(regex);
  if (!result) return null;
  const name = result[1];
  const operation = result[2];
  return { name, operation };
};

export default app;
