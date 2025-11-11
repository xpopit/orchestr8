/**
 * Logger utility for MCP server
 * IMPORTANT: Must write to stderr to avoid corrupting MCP protocol on stdout
 */

type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private name: string;
  private logLevel: LogLevel;

  constructor(name: string) {
    this.name = name;
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.name}]`;

    if (data !== undefined) {
      if (data instanceof Error) {
        return `${prefix} ${message}: ${data.message}\n${data.stack}`;
      }
      return `${prefix} ${message}: ${JSON.stringify(data, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog("debug")) {
      console.error(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog("info")) {
      console.error(this.formatMessage("info", message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog("warn")) {
      console.error(this.formatMessage("warn", message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, data));
    }
  }
}
