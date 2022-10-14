import { Trigger } from "deno-slack-api/types.ts";
import Workflow from "../workflows/workflow.ts";

const trigger: Trigger<typeof Workflow.definition> = {
  name: "ReReminder Bot",
  type: "shortcut",
  workflow: "#/workflows/workflow",
  inputs: {
    userId: {
      value: "{{data.user_id}}",
    },
  },
};

export default trigger;
