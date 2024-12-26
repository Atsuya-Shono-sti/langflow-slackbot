import { WebClient } from "@slack/web-api";
import { LangflowClient, generatePromptFromThread } from "./_langflow";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const flowId = process.env.FLOW_ID;
const langflowId = process.env.LANGFLOW_ID;
const inputType = process.env.INPUT_TYPE;
const outputType = process.env.OUTPUT_TYPE;
const stream = process.env.STREAM === "true";
const tweaks = process.env.TWEAKS;

type SlackEvent = {
  channel: string;
  ts: string;
  thread_ts?: string;
};

export async function sendGPTResponse({ channel, ts, thread_ts }: SlackEvent) {
  try {
    const thread = await slack.conversations.replies({
      channel,
      ts: thread_ts ?? ts,
      inclusive: true,
    });
    const inputValue = await generatePromptFromThread(thread);

    if (!flowId || !langflowId) {
      throw new Error("FLOW_ID or LANGFLOW_ID is not set");
    }

    if (
      !process.env.LANGFLOW_BASE_URL ||
      !process.env.LANGFLOW_APPLICATION_TOKEN
    ) {
      throw new Error(
        "LANGFLOW_BASE_URL or LANGFLOW_APPLICATION_TOKEN is not set"
      );
    }
    const langflowClient = new LangflowClient(
      process.env.LANGFLOW_BASE_URL,
      process.env.LANGFLOW_APPLICATION_TOKEN
    );

    const response = await langflowClient.runFlow(
      flowId,
      langflowId,
      inputValue.map((item) => item?.content ?? "").join(" "),
      (data) => console.log("Received:", data.chunk), // onUpdate
      () => console.log("Stream Closed"), // onClose
      (error: any) => console.log("Stream Error:", error) // onError
    );

    if (!response || !response.outputs || response.outputs.length === 0) {
      throw new Error("Invalid response from LangflowClient");
    }

    await slack.chat.postMessage({
      channel,
      thread_ts: ts,
      text: `${response.outputs[0].outputs[0].results.message.text}`,
    });
  } catch (error) {
    if (error instanceof Error) {
      // See Vercel Runtime Logs for errors: https://vercel.com/docs/observability/runtime-logs
      throw new Error(`Error sending GPT response: ${error.message}`);
    }
  }
}
