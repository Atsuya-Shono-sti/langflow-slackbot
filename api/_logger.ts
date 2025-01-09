import {
  configure,
  getConsoleSink,
  getFileSink,
  getLogger,
} from "@logtape/logtape";

export async function initLogger() {
  await configure({
    sinks: {
      console: getConsoleSink(),
    },
    filters: {},
    loggers: [{ category: "app", lowestLevel: "info", sinks: ["console"] }],
  });
}

export const logger = getLogger(["app"]);
