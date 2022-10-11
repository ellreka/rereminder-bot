import { Manifest, SlackManifestType } from "deno-slack-sdk/mod.ts";
import { MessageDatastore, ThreadDatastore } from "./src/datastore.ts";
import Workflow from "./src/workflows/workflow.ts";

const definition: SlackManifestType = {
  runOnSlack: false,
  name: "rereminder-bot",
  description: "A template for building Slack apps with Deno",
  icon: "assets/icon.png",
  workflows: [Workflow],
  outgoingDomains: [],
  datastores: [MessageDatastore, ThreadDatastore],
  features: {
    appHome: {
      messagesTabEnabled: true,
      messagesTabReadOnlyEnabled: true,
    },
  },
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
  userScopes: [
    "search:read",
  ],
};
export default Manifest(definition);
