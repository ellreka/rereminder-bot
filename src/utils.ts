import { SlackAPIClient } from "https://deno.land/x/deno_slack_api@1.0.1/types.ts";

export const insertBetween = (arr: any[], item: any) => {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i]);
    if (i < arr.length - 1) {
      result.push(item);
    }
  }
  return result;
};

export const deleteAllDatastore = async (
  client: SlackAPIClient,
  datastoreName: string,
) => {
  const datastore = await client.apps.datastore.query({
    datastore: datastoreName,
  });
  datastore.items.forEach(async (item) => {
    await client.apps.datastore.delete({
      datastore: datastoreName,
      id: item.id,
    });
  });
};
