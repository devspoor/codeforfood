/**
 * Lightweight request logging utility
 * Logs API requests with timing, status, and optional metadata
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface RequestLogData {
  method: string;
  path: string;
  status?: number;
  duration?: number;
  userId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

// Log level filtering - set via environment variable
const LOG_LEVEL = (process.env.LOG_LEVEL || (isDev ? "debug" : "info")) as LogLevel;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, data } = entry;
  const levelStr = level.toUpperCase().padEnd(5);

  if (isDev) {
    // Pretty print in development
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : "";
    return `[${timestamp}] ${levelStr} ${message}${dataStr}`;
  }

  // JSON format for production (better for log aggregation)
  return JSON.stringify({ timestamp, level, message, ...data });
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };

  const formatted = formatLogEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log("debug", message, data),
  info: (message: string, data?: Record<string, unknown>) => log("info", message, data),
  warn: (message: string, data?: Record<string, unknown>) => log("warn", message, data),
  error: (message: string, data?: Record<string, unknown>) => log("error", message, data),
};

/**
 * Log an API request with timing
 */
export function logRequest(data: RequestLogData): void {
  const { method, path, status, duration, userId, error, metadata } = data;

  const level: LogLevel = error ? "error" : status && status >= 400 ? "warn" : "info";
  const message = `${method} ${path} ${status || "---"} ${duration ? `${duration}ms` : ""}`;

  log(level, message, {
    method,
    path,
    status,
    duration,
    userId,
    error,
    ...metadata,
  });
}

/**
 * Create a request timer for measuring duration
 */
export function createRequestTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Wrapper to log API route handler execution
 */
export function withRequestLogging<T>(
  method: string,
  path: string,
  handler: () => Promise<T>,
  options: { userId?: string; metadata?: Record<string, unknown> } = {}
): Promise<T> {
  const timer = createRequestTimer();

  return handler()
    .then((result) => {
      // Extract status from Response if applicable
      const status = result instanceof Response ? result.status : 200;
      logRequest({
        method,
        path,
        status,
        duration: timer(),
        userId: options.userId,
        metadata: options.metadata,
      });
      return result;
    })
    .catch((err) => {
      logRequest({
        method,
        path,
        status: 500,
        duration: timer(),
        userId: options.userId,
        error: err instanceof Error ? err.message : String(err),
        metadata: options.metadata,
      });
      throw err;
    });
}
