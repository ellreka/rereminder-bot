import {
  BlockActionsRouter,
  DefineFunction,
  Schema,
  SlackFunction,
} from "deno-slack-sdk/mod.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { SlackApiSearchMessagesResponse } from "../types/types.ts";
import { BaseResponse } from "https://deno.land/x/deno_slack_api@1.0.1/types.ts";
import {
  DATASTORE_NAME,
  MessageDatastore,
  ThreadDatastore,
} from "../datastore.ts";
import { insertBetween } from "../utils.ts";
import env from "../../env.ts";

export const FunctionDefinition = DefineFunction({
  callback_id: "function",
  title: "Sample function",
  description: "A sample function",
  source_file: "src/functions/function.ts",
  input_parameters: {
    properties: {
      userId: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["userId"],
  },
});

export default SlackFunction(
  FunctionDefinition,
  async ({ inputs, token }) => {
    const userClient = SlackAPI(
      env.SLACK_USER_TOKEN,
    );
    const botClient = SlackAPI(token);

    const messagesResponse: BaseResponse & SlackApiSearchMessagesResponse =
      await userClient.search.messages({
        query: inputs.userId,
        sort: "timestamp",
        sort_dir: "desc",
        count: 10,
      });

    const messageDatastore = await botClient.apps.datastore.query<
      typeof MessageDatastore.definition
    >({
      datastore: DATASTORE_NAME.message,
      expression: "#userId = :userId",
      expression_attributes: { "#userId": "userId" },
      expression_values: { ":userId": inputs.userId },
    });

    const resolvedMessageIds = messageDatastore.items.map<string>((item) =>
      item.messageId
    );

    if (!messagesResponse.ok) {
      console.log(messagesResponse.error);
    }

    const messages = messagesResponse?.messages?.matches.filter((
      match,
    ) => {
      const resolved = resolvedMessageIds.includes(match.ts);
      const noReactions = match?.no_reactions === true;
      return !(resolved || !noReactions);
    }).map((match) => {
      return {
        ...match,
      };
    });

    if (messages == null || messages.length === 0) {
      const postMsgResponse = await botClient.chat.postMessage({
        channel: inputs.userId,
        text: messages == null
          ? "Error: messages is null"
          : "All messages have been resolved:tada:",
      });
      if (!postMsgResponse.ok) {
        console.log(postMsgResponse.error);
      }
      return {
        completed: true,
        outputs: {},
      };
    }

    const actionBlocks = messages.reverse().map((message) => {
      return [
        {
          type: "actions",
          elements: [
            {
              type: "checkboxes",
              action_id: "check_message",
              options: [
                {
                  text: {
                    type: "mrkdwn",
                    text: `@${message.username} #${message.channel.name}`,
                  },
                  value: message.ts,
                  description: {
                    type: "mrkdwn",
                    text: `${message.text.substring(0, 140)}${
                      message.text.length > 140 ? "..." : ""
                    }`,
                  },
                },
              ],
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${message.permalink}|➡message link>`,
          },
        },
      ];
    });

    const blocks = [
      ...insertBetween(actionBlocks, {
        type: "divider",
      }).flat(),
    ];

    const threadDatastore = await botClient.apps.datastore.get<
      typeof ThreadDatastore.definition
    >({
      datastore: DATASTORE_NAME.thread,
      userId: inputs.userId,
    });

    console.log("threadDatastore", threadDatastore.item.threadId);

    const postMsgResponse = await botClient.chat.postMessage({
      channel: inputs.userId,
      attachments: [
        {
          color: "#3AA3E3",
          blocks,
        },
      ],
    });
    console.log("postMsgResponse", postMsgResponse.ts);

    return {
      completed: false,
    };
  },
);

const ActionsRouter = BlockActionsRouter(FunctionDefinition);
export const blockActions = ActionsRouter.addHandler(
  ["check_message"],
  async ({ action, token, body, inputs }) => {
    console.log(action);
    const client = SlackAPI(token);
    const uuid = crypto.randomUUID();

    const putMsgResponse = await client.apps.datastore.put<
      typeof MessageDatastore.definition
    >({
      datastore: DATASTORE_NAME.message,
      item: {
        id: uuid,
        messageId: action.selected_options[0].value,
        userId: inputs.userId,
      },
    });

    if (!putMsgResponse.ok) {
      console.log("Error calling apps.datastore.put:");
      return {
        error: putMsgResponse.error,
        outputs: {},
      };
    } else {
      console.log("Datastore put successful!");
      console.log(putMsgResponse);
      return {
        outputs: {},
      };
    }
    // await client.functions.completeSuccess({
    //   function_execution_id: body.function_data.execution_id,
    //   outputs: {},
    // });
  },
);
