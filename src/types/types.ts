export type SlackApiSearchMessagesResponse = {
  messages?: {
    matches: Array<{
      "iid": string;
      "team": string;
      "score": number;
      "channel": {
        "id": string;
        "is_channel": true;
        "is_group": boolean;
        "is_im": boolean;
        "name": string;
        "is_shared": boolean;
        "is_org_shared": boolean;
        "is_ext_shared": boolean;
        "is_private": boolean;
        "is_mpim": boolean;
        "pending_shared": [];
        "is_pending_ext_shared": boolean;
      };
      "type": string;
      "user": string;
      "username": string;
      "ts": string;
      "attachments": [];
      "blocks": Array<{
        "type": string;
        "block_id": string;
        "elements": Array<{
          "type": string;
          "elements": Array<{
            "type": string;
            [key: string]: string;
          }>;
        }>;
      }>;
      "text": string;
      no_reactions?: boolean;
      "permalink": string;
    }>;
  };
};
