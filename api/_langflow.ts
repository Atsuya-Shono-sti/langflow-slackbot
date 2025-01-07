import type { ConversationsRepliesResponse } from "@slack/web-api";
import { logger } from "./_logger";

export async function generatePromptFromThread({
  messages,
}: ConversationsRepliesResponse) {
  if (!messages) throw new Error("No messages found in thread");
  const botID = messages[0].reply_users?.[0];

  const result = messages
    .map((message: any) => {
      const isBot = !!message.bot_id && !message.client_msg_id;
      const isNotMentioned = !isBot && !message.text.startsWith(`<@`);
      if (isNotMentioned) return null;

      return {
        role: isBot ? "assistant" : "user",
        content: isBot
          ? message.text
          : message.text.replace(`<@${botID}> `, ""),
      };
    })
    .filter(Boolean);

  return result;
}

export class LangflowClient {
  baseURL: string;
  applicationToken: string;

  constructor(baseURL: string, applicationToken: string) {
    this.baseURL = baseURL;
    this.applicationToken = applicationToken;
  }
  async post(
    endpoint: string,
    body: any,
    headers: Record<string, string> = { "Content-Type": "application/json" }
  ) {
    headers["Authorization"] = `Bearer ${this.applicationToken}`;
    const url = `${this.baseURL}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });

      const responseMessage = await response.json();
      if (!response.ok) {
        throw new Error(
          `${response.status} ${response.statusText} - ${JSON.stringify(
            responseMessage
          )}`
        );
      }
      return responseMessage;
    } catch (error: any) {
      console.error("Request Error:", error.message);
      throw error;
    }
  }

  async initiateSession(
    flowId: string,
    langflowId: string,
    inputValue: string,
    inputType = "chat",
    outputType = "chat",
    stream = false,
    tweaks = {}
  ) {
    const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
    return this.post(endpoint, {
      input_value: inputValue,
      input_type: inputType,
      output_type: outputType,
      tweaks: tweaks,
    });
  }

  handleStream(
    streamUrl: string,
    onUpdate: (data: any) => void,
    onClose: () => void,
    onError: (error: any) => void
  ) {
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event: any) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    eventSource.onerror = (event: any) => {
      console.error("Stream Error:", event);
      onError(event);
      eventSource.close();
    };

    eventSource.addEventListener("close", () => {
      onClose();
      eventSource.close();
    });

    return eventSource;
  }

  async runFlow(
    flowIdOrName: string,
    langflowId: string,
    inputValue: string,
    onUpdate: (data: any) => void,
    onClose: () => void,
    onError: (error: any) => void,
    inputType?: string,
    outputType?: string,
    tweaks?: any,
    stream?: boolean
  ) {
    try {
      const initResponse = await this.initiateSession(
        flowIdOrName,
        langflowId,
        inputValue,
        inputType,
        outputType,
        stream,
        tweaks
      );
      logger.info("Langflow response: " + JSON.stringify(initResponse));
      if (
        stream &&
        initResponse &&
        initResponse.outputs &&
        initResponse.outputs[0].outputs[0].artifacts.stream_url
      ) {
        const streamUrl =
          initResponse.outputs[0].outputs[0].artifacts.stream_url;
        console.log(`Streaming from: ${streamUrl}`);
        this.handleStream(streamUrl, onUpdate, onClose, onError);
      }
      return initResponse;
    } catch (error) {
      console.error("Error running flow:", error);
      onError("Error initiating session");
    }
  }
}
