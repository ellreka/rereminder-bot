import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import {
  SlackApiConversationsRepliesResponse,
  SlackApiSearchMessagesResponse,
} from "../types/types.ts";
import { BaseResponse } from "https://deno.land/x/deno_slack_api@1.0.1/types.ts";
import { DATASTORE_NAME, MessageDatastore } from "../datastore.ts";
import { MessagesType } from "../types/messages.ts";

export const SearchFunctionDefinition = DefineFunction({
  callback_id: "search_function",
  title: "Search function",
  description: "A search function",
  source_file: "src/functions/search.ts",
  input_parameters: {
    properties: {
      userId: {
        type: Schema.slack.types.user_id,
      },
      userToken: {
        type: Schema.types.string,
      },
    },
    required: ["userId", "userToken"],
  },
  output_parameters: {
    properties: {
      messages: {
        type: MessagesType,
      },
    },
    required: ["messages"],
  },
});

const repliesCache = new Map<
  string,
  SlackApiConversationsRepliesResponse
>();

export default SlackFunction(
  SearchFunctionDefinition,
  async ({ inputs, token }) => {
    const userClient = SlackAPI(inputs.userToken);
    const botClient = SlackAPI(token);

    const messagesResponse: BaseResponse & SlackApiSearchMessagesResponse =
      await userClient.search.messages({
        query: inputs.userId,
        sort: "timestamp",
        sort_dir: "desc",
        count: 20,
      });

    const messageDatastore = await botClient.apps.datastore.get<
      typeof MessageDatastore.definition
    >({
      datastore: DATASTORE_NAME.message,
      id: inputs.userId,
    });

    const resolvedMessageIds = messageDatastore.item.messageIds.split(",");

    const getReplies = async (
      channel: string,
      ts: string,
    ) => {
      const key = `${channel}-${ts}`;
      console.log(repliesCache.has(key));
      if (repliesCache.has(key)) {
        return repliesCache.get(key)?.messages ?? [];
      } else {
        const response: SlackApiConversationsRepliesResponse & BaseResponse =
          await userClient.conversations.replies({
            channel,
            ts,
          });
        if (!response.ok || response?.messages == null) {
          console.log(response);
          return [];
        }
        repliesCache.set(key, response);
        return response?.messages ?? [];
      }
    };

    const asyncFilter = async <T>(
      arr: T[],
      predicate: (item: T) => Promise<boolean>,
    ): Promise<T[]> => {
      const results = await Promise.all(arr.map(predicate));
      return arr.filter((_v, index) => results[index]);
    };

    if (messagesResponse.messages == null) {
      return {
        completed: true,
        outputs: {
          messages: [],
        },
      };
    }

    const filterMessages = await asyncFilter(
      messagesResponse.messages.matches,
      async (match) => {
        // 解決済みのメッセージは除外
        if (resolvedMessageIds.includes(match.ts)) {
          return false;
        } else {
          const replies = await getReplies(match.channel.id, match.ts);

          // リアクション一覧
          const reactions = replies.find((message) => message.ts === match.ts)
            ?.reactions;

          // 自分がリアクションしているかどうか
          const reacted = reactions?.some((reaction) => {
            return reaction.users.some((user) => user === inputs.userId);
          }) ?? false;

          // リアクションしていない かつ 親スレッドの場合
          if (reacted === false && replies.length > 1) {
            // 直後にリプライをしているかどうか
            const targetIndex = replies.findIndex((message) =>
              message.ts === match.ts
            );
            const replied = replies[targetIndex + 1]?.user === inputs.userId;
            return !replied;
          }

          // リアクションしていない かつ 子スレッドの場合
          if (
            reacted === false && replies?.length === 1 &&
            replies[0].thread_ts !== match.ts
          ) {
            // 親スレッドを取得
            const threads = await getReplies(
              match.channel.id,
              replies[0].thread_ts,
            );
            // 直後にリプライをしているかどうか
            const targetIndex = threads.findIndex((message) =>
              message.ts === match.ts
            );
            const replied = threads[targetIndex + 1]?.user === inputs.userId;
            return !replied;
          }
          return !reacted;
        }
      },
    );
    const messages = filterMessages.map((match) => {
      return {
        username: match.username,
        channelName: match.channel.name,
        text: match.text,
        ts: match.ts,
        permalink: match.permalink,
      };
    }) ?? [];

    // 解決済みのメッセージをDBに保存
    const all = messagesResponse.messages?.matches.map((match) => match.ts);
    const unresolved = filterMessages.map((message) => message.ts);
    const resolved = all?.filter((ts) => !unresolved?.includes(ts));

    const _messageDatastore = await botClient.apps.datastore.put<
      typeof MessageDatastore.definition
    >({
      datastore: DATASTORE_NAME.message,
      item: {
        id: inputs.userId,
        messageIds: resolved.join(","),
      },
    });

    return {
      completed: true,
      outputs: {
        messages,
      },
    };
  },
);
