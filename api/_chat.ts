import { WebClient } from "@slack/web-api";
import { LangflowClient, generatePromptFromThread } from "./_langflow";
import { logger } from "./_logger";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

type SlackEvent = {
  channel: string;
  ts: string;
  thread_ts?: string;
};

type LangflowSettings = {
  token: string;
  endpoint: string;
  flowId: string;
  langflowId: string;
};

export async function sendGPTResponse(
  { channel, ts, thread_ts }: SlackEvent,
  { token, endpoint, flowId, langflowId }: LangflowSettings
) {
  try {
    const thread = await slack.conversations.replies({
      channel,
      ts: thread_ts ?? ts,
      inclusive: true,
    });
    const inputValue = await generatePromptFromThread(thread);

    if (!endpoint || !token || !flowId || !langflowId) {
      throw new Error("Langflow config is not set all");
    }

    const langflowClient = new LangflowClient(endpoint, token);

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

    logger.info("Langflow response: " + JSON.stringify(response));

    await slack.chat
      .postMessage({
        channel,
        thread_ts: ts,
        text: `${response.outputs[0].outputs[0].results.message.text}`,
      })
      .then((response) => {
        logger.info("Message sent: " + JSON.stringify(response));
      });
  } catch (error) {
    if (error instanceof Error) {
      // See Vercel Runtime Logs for errors: https://vercel.com/docs/observability/runtime-logs
      throw new Error(`Error sending GPT response: ${error.message}`);
    }
  }
}
