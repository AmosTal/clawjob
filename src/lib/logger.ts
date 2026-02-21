type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

interface LogEntry {
  severity: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  const entry: LogEntry = {
    severity: level,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  // Cloud Run / Cloud Logging parses JSON from stdout/stderr and uses "severity"
  const output = JSON.stringify(entry);
  if (level === "ERROR") {
    process.stderr.write(output + "\n");
  } else {
    process.stdout.write(output + "\n");
  }
}

export const logger = {
  debug(message: string, extra?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      log("DEBUG", message, extra);
    }
  },
  info(message: string, extra?: Record<string, unknown>): void {
    log("INFO", message, extra);
  },
  warn(message: string, extra?: Record<string, unknown>): void {
    log("WARNING", message, extra);
  },
  error(message: string, extra?: Record<string, unknown>): void {
    log("ERROR", message, extra);
  },
};
