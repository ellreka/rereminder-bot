import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const DATASTORE_NAME = {
  message: "rereminder-datastore-message",
  token: "rereminder-datastore-token",
};

export const MessageDatastore = DefineDatastore({
  name: DATASTORE_NAME.message,
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.slack.types.user_id,
    },
    messageIds: {
      type: Schema.types.string,
    },
  },
});

export const TokenDatastore = DefineDatastore({
  name: DATASTORE_NAME.token,
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.slack.types.user_id,
    },
    token: {
      type: Schema.types.string,
    },
  },
});
