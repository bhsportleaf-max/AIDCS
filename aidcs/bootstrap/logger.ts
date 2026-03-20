export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50
};

export function createLogger(level: LogLevel, enabled = true): Logger {
  const threshold = levelOrder[level];
  const shouldLog = (lvl: LogLevel) => enabled && levelOrder[lvl] >= threshold;

  const log = (lvl: LogLevel, message: string, data?: unknown) => {
    if (!shouldLog(lvl)) return;
    const prefix = `[AIDCS:${lvl.toUpperCase()}]`;
    if (lvl === "error") {
      console.error(prefix, message, data ?? "");
    } else if (lvl === "warn") {
      console.warn(prefix, message, data ?? "");
    } else if (lvl === "info") {
      console.info(prefix, message, data ?? "");
    } else {
      console.debug(prefix, message, data ?? "");
    }
  };

  return {
    debug: (m, d) => log("debug", m, d),
    info: (m, d) => log("info", m, d),
    warn: (m, d) => log("warn", m, d),
    error: (m, d) => log("error", m, d)
  };
}
