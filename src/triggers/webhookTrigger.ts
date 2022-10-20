import { Trigger } from "deno-slack-api/types.ts";
import TokenWorkflow from "../workflows/tokenWorkflow.ts";

const webhookTrigger: Trigger<typeof TokenWorkflow.definition> = {
  name: "ReReminder Bot Webhook Trigger",
  type: "webhook",
  workflow: "#/workflows/token_workflow",
  inputs: {
    userId: {
      value: "{{data.user_id}}",
    },
    userToken: {
      value: "{{data.user_token}}",
    },
  },
};

export default webhookTrigger;
