import {
  ConversationsRepliesResponse,
  ConversationsRepliesArguments,
  SearchMessagesArguments,
  SearchMessagesResponse,
  ChatPostMessageArguments,
  ChatPostMessageResponse,
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
  return res.json();
};
