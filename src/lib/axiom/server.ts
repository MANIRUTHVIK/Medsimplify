/**
 * Server-side Axiom Logger with structured console fallback.
 * Provides info, error, warn, and debug methods.
 */

type LogMeta = Record<string, unknown> | unknown;

export interface LoggerInterface {
  info: (message: string, meta?: LogMeta) => void;
  error: (message: string, error?: unknown, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  debug: (message: string, meta?: LogMeta) => void;
  flush?: () => Promise<void>;
}

const formatMessage = (level: string, message: string) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger: LoggerInterface = {
  info: (message: string, meta?: LogMeta) => {
    if (meta !== undefined) {
      console.log(formatMessage("info", message), meta);
    } else {
      console.log(formatMessage("info", message));
    }
  },
  error: (message: string, error?: unknown, meta?: LogMeta) => {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack, ...((meta as object) || {}) }
        : error !== undefined
        ? { error, ...((meta as object) || {}) }
        : meta;

    if (errorDetails !== undefined) {
      console.error(formatMessage("error", message), errorDetails);
    } else {
      console.error(formatMessage("error", message));
    }
  },
  warn: (message: string, meta?: LogMeta) => {
    if (meta !== undefined) {
      console.warn(formatMessage("warn", message), meta);
    } else {
      console.warn(formatMessage("warn", message));
    }
  },
  debug: (message: string, meta?: LogMeta) => {
    if (process.env.NODE_ENV !== "production") {
      if (meta !== undefined) {
        console.debug(formatMessage("debug", message), meta);
      } else {
        console.debug(formatMessage("debug", message));
      }
    }
  },
  flush: async () => {},
};

// eslint-disable-next-line import/no-default-export
export default logger;
