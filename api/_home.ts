import { WebClient } from "@slack/web-api";
import { LangflowSettings } from "./events";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const user_id = process.env.SLACK_ADMIN_MEMBER_ID;

export const displayHome = async (langflowSettings: LangflowSettings) => {
  if (!user_id) {
    throw new Error("USER_ID is not set");
  }
  const view = await slack.views.publish({
    user_id,
    view: {
      type: "home",
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
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Configuration",
                emoji: true,
              },
              value: "Configuration",
              action_id: "LangflowConfiguration",
            },
          ],
        },
        {
          type: "rich_text",
          elements: [
            {
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: "Setted configuration\n",
                },
              ],
            },
            {
              type: "rich_text_list",
              style: "bullet",
              indent: 0,
              border: 0,
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text:
                        "Langflow Endpoint: " +
                        (langflowSettings.endpoint
                          ? langflowSettings.endpoint
                          : "Not set"),
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text:
                        "Langflow Token: " +
                        (langflowSettings.token ? "*****" : "Not set"),
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text:
                        "Langflow ID: " +
                        (langflowSettings.langflowId
                          ? langflowSettings.langflowId
                          : "Not set"),
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text:
                        "Flow ID: " +
                        (langflowSettings.flowId
                          ? langflowSettings.flowId
                          : "Not set"),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  });
};
