import { Manifest, SlackManifestType } from "deno-slack-sdk/mod.ts";
import { MessageDatastore } from "./src/datastore.ts";
import { MessagesType } from "./src/types/messages.ts";
import Workflow from "./src/workflows/workflow.ts";

const definition: SlackManifestType = {
  runOnSlack: false,
  name: "rereminder-bot",
  description: "A template for building Slack apps with Deno",
  icon: "assets/icon.png",
  workflows: [Workflow],
  types: [MessagesType],
  outgoingDomains: [],
  datastores: [MessageDatastore],
  features: {
    appHome: {
      messagesTabEnabled: true,
      messagesTabReadOnlyEnabled: true,
    },
  },
  redirectUrls: ["https://oauth2.slack.com/external/auth/callback"],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
  userScopes: [
    "search:read",
    "reactions:read",
    "channels:history",
    "groups:history",
    "im:history",
    "mpim:history",
  ],
};
export default Manifest(definition);
