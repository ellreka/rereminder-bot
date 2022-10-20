import {
  BlockActionsRouter,
  DefineFunction,
  Schema,
  SlackFunction,
} from "deno-slack-sdk/mod.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { DATASTORE_NAME, MessageDatastore } from "../datastore.ts";
import { MessagesType } from "../types/messages.ts";

export const FunctionDefinition = DefineFunction({
  callback_id: "function",
  title: "Post message function",
  description: "",
  source_file: "src/functions/function.ts",
  input_parameters: {
    properties: {
      userId: {
        type: Schema.slack.types.user_id,
      },
      messages: {
        type: MessagesType,
      },
    },
    required: ["userId", "messages"],
  },
});

export default SlackFunction(
  FunctionDefinition,
  async ({ inputs, token }) => {
    const client = SlackAPI(token);

    if (inputs.messages == null || inputs.messages.length === 0) {
      const postMsgResponse = await client.chat.postMessage({
        channel: inputs.userId,
        text: inputs.messages == null
          ? "Error: messages is null"
          : "All messages have been resolved:tada:",
      });
      if (!postMsgResponse.ok) {
        console.log(postMsgResponse.error);
      }
    }

    const actionBlocks = inputs.messages.map((message) => {
      return [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `from:@${message.username} in:#${message.channelName}`,
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Resolve",
            },
            "style": "primary",
            "action_id": "resolve_message",
            "value": `${message.ts}`,
          },
        },
        {
          "type": "context",
          "elements": [
            {
              "text": `${message.text.substring(0, 140)}${
                message.text.length > 140 ? "..." : ""
              }\n<${message.permalink}|:link: message link>`,
              "type": "mrkdwn",
            },
          ],
        },
      ];
    });

    const generateRandomColor = () => {
      return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    };

    const postMsgResponse = await client.chat.postMessage({
      channel: inputs.userId,
      attachments: [
        ...actionBlocks.map((block) => {
          return {
            color: generateRandomColor(),
            blocks: block,
          };
        }),
      ],
    });

    if (!postMsgResponse.ok) {
      console.log(postMsgResponse);
    }

    return {
      completed: false,
    };
  },
);

const ActionsRouter = BlockActionsRouter(FunctionDefinition);
export const blockActions = ActionsRouter.addHandler(
  ["resolve_message"],
  async ({ action, token, body, inputs }) => {
    const client = SlackAPI(token);

    // deleteAllDatastore(client, DATASTORE_NAME.message);
    const messageDatastore = await client.apps.datastore.get<
      typeof MessageDatastore.definition
    >({
      datastore: DATASTORE_NAME.message,
      id: inputs.userId,
    });

    const resolvedMessageIds = [
      action.value,
      ...messageDatastore.item.messageIds.split(",").splice(0, 19),
    ];

    const putMsgResponse = await client.apps.datastore.put<
      typeof MessageDatastore.definition
    >({
      datastore: DATASTORE_NAME.message,
      item: {
        id: inputs.userId,
        messageIds: resolvedMessageIds.join(","),
      },
    });

    if (!putMsgResponse.ok) {
      console.log(putMsgResponse);
      return {
        outputs: {},
      };
    }

    const attachments = (body?.message as any)?.attachments.filter(
      (attachment: any) => {
        return !attachment.blocks.some((block: any) => {
          return block.accessory?.value === action.value;
        });
      },
    );

    const _updateMsgResponse = await client.chat.update({
      channel: body.container.channel_id,
      ts: body.message?.ts,
      attachments: attachments.length > 0 ? attachments : undefined,
      text: attachments.length > 0
        ? ""
        : "All messages have been resolved:tada:",
    });
    console.log("Datastore put successful!");

    // await client.functions.completeSuccess({
    //   function_execution_id: body.function_data.execution_id,
    //   outputs: {},
    // });
  },
);
