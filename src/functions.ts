import {
  ConversationsRepliesResponse,
  MessageAttachment,
} from "@slack/web-api";
import { fetcher } from "./slack";
import { asyncFilter } from "./utils";

type Message = {
  username: string;
  text: string;
  permalink: string;
  ts: string;
  channelName: string;
};

const repliesCache = new Map<string, ConversationsRepliesResponse>();

const searchMessage = async (
  userId: string,
  token: string,
  resolvedIds: string[]
) => {
  const response = await fetcher("search.messages", {
    query: userId,
    sort: "timestamp",
    sort_dir: "desc",
    count: 20,
    token,
  });

  if (!response.ok) throw response.error;

  const getReplies = async (channel: string, ts: string) => {
    const key = `${channel}-${ts}`;
    if (repliesCache.has(key)) {
      return repliesCache.get(key)?.messages;
    } else {
      const response = await fetcher("conversations.replies", {
        channel,
        ts,
        token,
      });
      repliesCache.set(key, response);
      return response.messages;
    }
  };

  const matches = response.messages?.matches ?? [];

  const filteringMessages = await asyncFilter(matches, async (match) => {
    if (match.channel?.id != null && match.ts != null) {
      if (resolvedIds.includes(match.ts)) return false;
      if (match.text?.includes(userId) === false) return false;
      const replies = await getReplies(match.channel?.id, match.ts);
      // const thread_ts = match.permalink
      //   ? new URL(match.permalink).searchParams.get("thread_ts")
      //   : null;

      // const replies = await getReplies(
      //   match.channel?.id,
      //   thread_ts ?? match.ts
      // );

      if (replies == null) return false;

      const reactions = replies.find(
        (reply) => reply.ts === match.ts
      )?.reactions;

      const isReacted =
        reactions?.some((reaction) =>
          reaction.users?.some((user) => user === userId)
        ) ?? false;

      if (isReacted) return false;

      const targetMessage = replies.find((reply) => reply.ts === match.ts);
      if (targetMessage?.thread_ts == null) {
        const targetIndex = replies.findIndex((reply) => reply.ts === match.ts);
        const isReplied = replies[targetIndex + 1]?.user === userId;
        return !isReplied && !isReacted;
      } else {
        const parentThreadReplies = await getReplies(
          match.channel?.id,
          targetMessage.thread_ts
        );
        if (parentThreadReplies == null) return false;
        const targetIndex = parentThreadReplies.findIndex(
          (reply) => reply.ts === match.ts
        );
        const isReplied = parentThreadReplies[targetIndex + 1]?.user === userId;
        return !isReplied && !isReacted;
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

export const sendMissedMessages = async ({
  userToken,
  botToken,
  userId,
  channel,
  resolvedIds,
}: {
  userToken: string;
  botToken: string;
  userId: string;
  channel: string;
  resolvedIds: string[];
}) => {
  const messages = await searchMessage(userId, userToken, resolvedIds);
  const text = messages.length === 0 ? "No missed messages" : "";
  const attachments = generateAttachmentsMessage(messages);
  const res = await fetcher("chat.postMessage", {
    token: botToken,
    channel,
    attachments,
    text,
  });
  console.log(res);
};

export const resolveMessage = async ({
  botToken,
  payload,
}: {
  botToken: string;
  payload: any;
}) => {
  try {
    const attachments = payload.message.attachments.filter(
      (attachment: any) => {
        return !attachment.blocks.some((block: any) => {
          return block.accessory?.value === payload.actions[0].value;
        });
      }
    );

    const res = await fetcher("chat.update", {
      token: botToken,
      channel: payload.channel.id,
      ts: payload.message.ts,
      attachments: attachments.length > 0 ? attachments : [],
      text:
        attachments.length > 0 ? "" : "All messages have been resolved:tada:",
    });
    console.log(res);
  } catch (e) {
    console.error(e);
  }
};
