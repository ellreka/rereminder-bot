import {
  ConversationsRepliesResponse,
  ConversationsRepliesArguments,
  SearchMessagesArguments,
  SearchMessagesResponse,
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  OAuthV2AccessArguments,
  OauthV2AccessResponse,
} from "@slack/web-api";

const BASE_URL = "https://slack.com/api/";

type APIS = {
  "search.messages": {
    args: SearchMessagesArguments;
    response: SearchMessagesResponse;
  };
  "conversations.replies": {
    args: ConversationsRepliesArguments;
    response: ConversationsRepliesResponse;
  };
  "chat.postMessage": {
    args: ChatPostMessageArguments;
    response: ChatPostMessageResponse;
  };
  // "oauth.v2.access": {
  //   args: OAuthV2AccessArguments;
  //   response: OauthV2AccessResponse;
  // };
};

const methods: Record<keyof APIS, { method: "GET" | "POST" }> = {
  "search.messages": { method: "GET" },
  "conversations.replies": { method: "GET" },
  "chat.postMessage": { method: "POST" },
};

export const fetcher = async <T extends keyof APIS>(
  type: T,
  args: APIS[T]["args"]
): Promise<APIS[T]["response"]> => {
  const method = methods[type].method;
  const url = new URL(type, BASE_URL);
  const params = new URLSearchParams();
  const headers = new Headers({
    Authorization: `Bearer ${args.token}`,
  });
  if (method === "POST") {
    headers.append("Content-Type", "application/json");
  } else {
    headers.append("Content-Type", "application/x-www-form-urlencoded");
    Object.entries(args).forEach(([key, value]) => {
      if (value != null && key !== "token") {
        params.append(key, value as any);
      }
    });
    url.search = params.toString();
  }
  const res = await fetch(url.toString(), {
    method: methods[type].method,
    headers,
    body: method === "POST" ? JSON.stringify(args) : undefined,
  });
  if(!res.ok) throw new Error(res.statusText);
  return res.json();
};

export const oauth = async (
  args: OAuthV2AccessArguments
): Promise<OauthV2AccessResponse> => {
  if (args.code == null) throw new Error("code is required");
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: args.client_id,
      client_secret: args.client_secret,
      code: args.code,
    }),
  });
  return response.json();
};
