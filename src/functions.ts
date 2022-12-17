import { App } from "@slack/bolt";
import {
  ConversationsRepliesResponse,
  MessageAttachment,
} from "@slack/web-api";
import { env } from "./env";
import { asyncFilter } from "./utils";

type Message = {
  username: string;
  text: string;
  permalink: string;
  ts: string;
  channelName: string;
};

const repliesCache = new Map<string, ConversationsRepliesResponse>();

const searchMessage = async (app: App, userId: string) => {
  const response = await app.client.search.messages({
    query: userId,
    sort: "timestamp",
    sort_dir: "desc",
    count: 20,
    token: env.SLACK_USER_TOKEN,
  });

  if (!response.ok) throw response.error;

  const getReplies = async (channel: string, ts: string) => {
    const key = `${channel}-${ts}`;
    if (repliesCache.has(key)) {
      return repliesCache.get(key)?.messages;
    } else {
      const response = await app.client.conversations.replies({
        channel,
        ts,
        token: env.SLACK_USER_TOKEN,
      });
      repliesCache.set(key, response);
      return response.messages;
    }
  };

  const matches = response.messages?.matches ?? [];

  const filteringMessages = await asyncFilter(matches, async (match) => {
    if (match.channel?.id != null && match.ts != null) {
      const replies = await getReplies(match.channel?.id, match.ts);

      if (replies == null) return false;

      const reactions = replies?.find(
        (reply) => reply.ts === match.ts
      )?.reactions;

      const isReacted =
        reactions?.some((reaction) =>
          reaction.users?.some((user) => user === userId)
        ) ?? false;

      if (isReacted) return false;

      const parentMessage = replies[0];
      const isParentThread = parentMessage.thread_ts === match.ts;

      if (isParentThread) {
        const targetIndex = replies.findIndex((reply) => reply.ts === match.ts);
        const isReplied = replies[targetIndex + 1]?.user === userId;
        return !isReplied;
      } else {
        if (parentMessage.thread_ts == null) return false;
        const parentThreads = await getReplies(
          match.channel?.id,
          parentMessage.thread_ts
        );
        if (parentThreads == null) return false;
        const targetIndex = parentThreads.findIndex(
          (reply) => reply.ts === match.ts
        );
        const isReplied = parentThreads[targetIndex + 1]?.user === userId;
        return !isReplied;
      }
    }
    return false;
  });

  const messages = filteringMessages.map<Message>((message) => {
    return {
      username: message.username ?? "",
      text: message.text ?? "",
      permalink: message.permalink ?? "",
      ts: message.ts ?? "",
      channelName: message.channel?.name ?? "",
    };
  });
  return messages;
};

const generateAttachmentsMessage = (
  messages: Message[]
): MessageAttachment[] => {
  const actionBlocks = messages.map((message) => {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `from:@${message.username} in:#${message.channelName}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Resolve",
          },
          style: "primary",
          action_id: "resolve_message",
          value: `${message.ts}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            text: `${message.text.substring(0, 140)}${
              message.text.length > 140 ? "..." : ""
            }\n<${message.permalink}|:link: message link>`,
            type: "mrkdwn",
          },
        ],
      },
    ];
  });
  const generateRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };
  const attachments = actionBlocks.map((block) => {
    return {
      color: generateRandomColor(),
      blocks: block,
    };
  });
  return attachments;
};

export const sendMissedMessages = async (app: App, userId: string) => {
  const messages = await searchMessage(app, userId);
  const attachments = generateAttachmentsMessage(messages);
  await app.client.chat.postMessage({
    channel: env.SLACK_CHANNEL_ID,
    attachments,
    text: "",
  });
};