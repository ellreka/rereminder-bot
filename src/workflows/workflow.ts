import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FunctionDefinition } from "../functions/function.ts";
import { SearchFunctionDefinition } from "../functions/search.ts";
import env from "../../env.ts";

const Workflow = DefineWorkflow({
  callback_id: "workflow",
  title: "workflow",
  description: "workflow",
  input_parameters: {
    properties: {
      userId: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["userId"],
  },
});

const search = Workflow.addStep(SearchFunctionDefinition, {
  userId: Workflow.inputs.userId,
  userToken: env.SLACK_USER_TOKEN,
});

Workflow.addStep(FunctionDefinition, {
  userId: Workflow.inputs.userId,
  messages: search.outputs.messages,
});

export default Workflow;
