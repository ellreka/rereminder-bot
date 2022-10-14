import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

const MessageType = DefineType({
  name: "message",
  type: Schema.types.object,
  properties: {
    username: {
      type: Schema.types.string,
    },
    channelName: {
      type: Schema.types.string,
    },
    text: {
      type: Schema.types.string,
    },
    ts: {
      type: Schema.types.string,
    },
    permalink: {
      type: Schema.types.string,
    },
  },
  required: ["username", "channelName", "text", "ts", "permalink"],
});

export const MessagesType = DefineType({
  title: "Slack Messages",
  description: "",
  name: "Messages",
  type: Schema.types.array,
  items: {
    type: MessageType,
  },
});
