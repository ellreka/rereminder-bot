import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import SlackFunction from "./function.ts";

const { createContext } = SlackFunctionTester("slack_function");

Deno.test("Sample function test", async () => {
  const inputs = { userId: "XXXXXXX" };
  const { outputs } = await SlackFunction(createContext({ inputs }));
  assertEquals(
    outputs?.blocks,
    {},
  );
});
