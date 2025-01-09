import { sendGPTResponse } from "./_chat";
import { isValidSlackRequest } from "./_validate-request";
import { displayHome } from "./_home";
import { initLogger, logger } from "./_logger";
import { getConfig } from "./_configure";

export type LangflowSettings = {
  token: string;
  endpoint: string;
  flowId: string;
  langflowId: string;
};

export let langflowSettings: LangflowSettings = {
  token: process.env.LANGFLOW_APPLICATION_TOKEN || "",
  endpoint: process.env.LANGFLOW_BASE_URL || "",
  flowId: process.env.FLOW_ID || "",
  langflowId: process.env.LANGFLOW_ID || "",
};

export async function POST(request: Request) {
  await initLogger();

  // logger.info("Request header: ");
  // request.headers.forEach((value, name) => {
  //   logger.info(`${name}: ${value}`);
  // });
  // logger.info("Request method: " + request.method);
  // logger.info("Request url: " + request.url);

  const retryNum = request.headers.get("x-slack-retry-num");
  if (retryNum && parseInt(retryNum) >= 1) {
    return new Response("No retry", { status: 429 });
  }

  const rawBody = await request.text();
  const payload = JSON.parse(rawBody);
  const requestType = payload.type;

  logger.info("Request payload: " + JSON.stringify(payload));

  // See https://api.slack.com/events/url_verification
  if (requestType === "url_verification") {
    logger.info("URL Verification");
    return new Response(payload.challenge, { status: 200 });
  }

  if (await isValidSlackRequest({ request, rawBody })) {
    const userId = payload.event.user;
    logger.info("User ID: " + userId);
    await getConfig(userId).then((config) => {
      if (config) {
        langflowSettings.token = config.token || "";
        langflowSettings.endpoint = config.endpoint || "";
        langflowSettings.flowId = config.flowId || "";
        langflowSettings.langflowId = config.langflowId || "";
      }
    });

    logger.info("API key value:" + langflowSettings.token);
    logger.info("Base URL value:" + langflowSettings.endpoint);
    logger.info("Flow ID value:" + langflowSettings.flowId);
    logger.info("Langflow ID value:" + langflowSettings.langflowId);

    if (requestType === "event_callback") {
      const eventType = payload.event.type;
      if (eventType === "app_mention") {
        logger.info("App Mention");
        try {
          await sendGPTResponse(payload.event, langflowSettings);
          return new Response("Success!", { status: 200 });
        } catch (error: any) {
          logger.error(`Error sending GPT response: ${error.message}`);
        }
      }

      if (eventType === "app_home_opened") {
        logger.info("App Home Opened");
        try {
          await displayHome(langflowSettings);
          return new Response("Success!", { status: 200 });
        } catch (error: any) {
          logger.error(`Error displaying home: ${error.message}`);
        }
      }
    }
  }

  return new Response("Unauthorized", { status: 401 });
}
