import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const DATASTORE_NAME = {
  message: "rereminder-datastore-message",
  thread: "rereminder-datastore-thread",
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
