import { WebClient } from "@slack/web-api";
import { LangflowSettings } from "./events";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export const displayModal = async (
  langflowSettings: LangflowSettings,
  trigger_id: string
) => {
  const modal = await slack.views.open({
    trigger_id,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Langflow Configuration",
        emoji: true,
      },
      submit: {
        type: "plain_text",
        text: "Submit",
        emoji: true,
      },
      close: {
        type: "plain_text",
        text: "Cancel",
        emoji: true,
      },
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Langflow Configuration",
            emoji: true,
          },
        },
        {
          type: "divider",
        },
        {
          type: "input",
          block_id: "inputEndpoint",
          element: {
            type: "plain_text_input",
            action_id: "plain_text_input_action",
          },
          label: {
            type: "plain_text",
            text: "Langflow Endpoint:",
            emoji: true,
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "inputToken",
          element: {
            type: "plain_text_input",
            action_id: "plain_text_input_action",
          },
          label: {
            type: "plain_text",
            text: "Langflow Token:",
            emoji: true,
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "inputLangflowId",
          element: {
            type: "plain_text_input",
            action_id: "plain_text_input_action",
          },
          label: {
            type: "plain_text",
            text: "Langflow ID",
            emoji: true,
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "inputFlowId",
          element: {
            type: "plain_text_input",
            action_id: "plain_text_input_action",
          },
          label: {
            type: "plain_text",
            text: "Flow ID",
            emoji: true,
          },
          optional: true,
        },
      ],
    },
  });
};
