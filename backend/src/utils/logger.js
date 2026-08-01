/**
 * Shared structured logger. Pretty-printed to the console in development,
 * raw JSON in production (so it can be piped into a log aggregator later
 * without any code changes here). Level is configurable via LOG_LEVEL
 * (default "info"); use "debug" locally to also see the operational-error
 * traces logged by the global error handler in app.js.
 */
const pino = require("pino");

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
      },
});

module.exports = logger;
