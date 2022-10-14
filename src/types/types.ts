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

export type SlackApiConversationsRepliesResponse = {
  "ok": boolean;
  "messages"?: Array<{
    "client_msg_id": string;
    "type": string;
    "text": string;
    "user": string;
    "ts": string;
    "team": string;
    "blocks": Array<{
      "type": string;
      "block_id": string;
      "elements": [];
    }>;
    "thread_ts": string;
    "parent_user_id": string;
    "reply_count"?: number;
    "reply_users_count"?: number;
    "reactions": Array<{
      "name": string;
      "users": string[];
      "count": number;
    }>;
  }>;
};
