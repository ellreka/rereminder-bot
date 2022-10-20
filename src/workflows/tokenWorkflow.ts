import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { TokenFunctionDefinition } from "../functions/token.ts";

const TokenWorkflow = DefineWorkflow({
  callback_id: "token_workflow",
  title: "token_workflow",
  description: "token_workflow",
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

TokenWorkflow.addStep(TokenFunctionDefinition, {
  userId: TokenWorkflow.inputs.userId,
  userToken: TokenWorkflow.inputs.userToken,
});

export default TokenWorkflow;
