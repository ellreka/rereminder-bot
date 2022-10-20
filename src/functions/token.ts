import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { DATASTORE_NAME, TokenDatastore } from "../datastore.ts";

export const TokenFunctionDefinition = DefineFunction({
  callback_id: "token_function",
  title: "Set token function",
  description: "",
  source_file: "src/functions/token.ts",
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
});

export default SlackFunction(
  TokenFunctionDefinition,
  async ({ inputs, token }) => {
    if (inputs.userId == null || inputs.userToken == null) {
      return {
        outputs: {},
      };
    }
    const client = SlackAPI(token);
    const _putTokenDatastore = await client.apps.datastore.put<
      typeof TokenDatastore.definition
    >({
      datastore: DATASTORE_NAME.token,
      item: {
        id: inputs.userId,
        token: inputs.userToken,
      },
    });
    return {
      outputs: {},
    };
  },
);
