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
      type: Schema.types.string,
    },
    messageId: {
      type: Schema.types.string,
    },
    userId: {
      type: Schema.types.string,
    },
  },
});

export const ThreadDatastore = DefineDatastore({
  name: DATASTORE_NAME.thread,
  primary_key: "userId",
  attributes: {
    userId: {
      type: Schema.types.string,
    },
    threadId: {
      type: Schema.types.string,
    },
  },
});
