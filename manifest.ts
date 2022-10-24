import { Manifest, SlackManifestType } from "deno-slack-sdk/mod.ts";
import env from "./env.ts";
import { MessageDatastore, TokenDatastore } from "./src/datastore.ts";
import { MessagesType } from "./src/types/messages.ts";
import TokenWorkflow from "./src/workflows/tokenWorkflow.ts";
import Workflow from "./src/workflows/workflow.ts";

const definition: SlackManifestType = {
  runOnSlack: true,
  name: "rereminder-bot",
  description: "",
  icon: "assets/icon.png",
  workflows: [Workflow, TokenWorkflow],
  types: [MessagesType],
  outgoingDomains: [],
  datastores: [MessageDatastore, TokenDatastore],
  features: {
    appHome: {
      messagesTabEnabled: true,
      messagesTabReadOnlyEnabled: true,
    },
  },
  // @ts-ignore
  redirectUrls: [env.REDIRECT_URL],
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
