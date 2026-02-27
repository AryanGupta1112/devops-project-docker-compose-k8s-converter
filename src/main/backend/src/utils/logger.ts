import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "compose-k8s-converter-api"
  },
  timestamp: pino.stdTimeFunctions.isoTime
});
