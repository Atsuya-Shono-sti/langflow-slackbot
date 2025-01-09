import { Configure, prisma } from "./_configure";
import { isValidSlackRequest } from "./_validate-request";
import { langflowSettings } from "./events";
import { displayModal } from "./_modal";
import { logger } from "./_logger";
import { displayHome } from "./_home";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const decodedBody = decodeURIComponent(rawBody);
  const jsonString = decodedBody.replace(/^payload=/, "");

  // デコードした内容をJSONとして解析
  const payload = JSON.parse(jsonString);
  const requestType = payload.type;

  logger.info("Request payload" + JSON.stringify(payload));

  // See https://api.slack.com/events/url_verification
  if (requestType === "url_verification") {
    return new Response(payload.challenge, { status: 200 });
  }

  if (await isValidSlackRequest({ request, rawBody })) {
    if (requestType === "block_actions") {
      const action = payload.actions[0];
      if (action.action_id === "LangflowConfiguration") {
        await displayModal(langflowSettings, payload.trigger_id);
        return new Response("Success!", { status: 200 });
      }
    }
    if (requestType === "view_submission") {
      const userid = payload.user.id;
      const endpoint =
        payload.view.state.values.inputEndpoint.plain_text_input_action.value;
      const token =
        payload.view.state.values.inputToken.plain_text_input_action.value;
      const langflowId =
        payload.view.state.values.inputLangflowId.plain_text_input_action.value;
      const flowId =
        payload.view.state.values.inputFlowId.plain_text_input_action.value;

      try {
        await Configure(userid, endpoint, token, langflowId, flowId)
          .then(async () => {
            await prisma.$disconnect();
          })
          .catch(async (e) => {
            console.error(e);
            await prisma.$disconnect();
            process.exit(1);
          });

        await displayHome(langflowSettings, userid);
        return new Response(null, { status: 200 });
      } catch (error: any) {
        logger.error(`Error setting config: ${error.message}`);
      }
    }
  }

  return new Response("Unauthorized", { status: 401 });
}
