import {
  configure,
  getConsoleSink,
  getFileSink,
  getLogger,
} from "@logtape/logtape";

export async function initLogger() {
  await configure({
    sinks: {
      file: getFileSink("logs/app.log"),
    },
    filters: {},
    loggers: [{ category: "app", lowestLevel: "info", sinks: ["file"] }],
  });
}

export const logger = getLogger(["app"]);
