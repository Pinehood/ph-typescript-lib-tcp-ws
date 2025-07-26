import { LoggerService, LogLevel } from "../../common";

export class Logger implements LoggerService {
  info(message: string, ...optionalParams: Array<unknown>): void {
    this.message(message, "info", ...optionalParams);
  }

  warn(message: string, ...optionalParams: Array<unknown>): void {
    this.message(message, "warn", ...optionalParams);
  }

  error(message: string, ...optionalParams: Array<unknown>): void {
    this.message(message, "error", ...optionalParams);
  }

  debug(message: string, ...optionalParams: Array<unknown>): void {
    this.message(message, "debug", ...optionalParams);
  }

  private message(
    message: string,
    level: LogLevel,
    ...optionalParams: Array<unknown>
  ): void {
    const caller = this.caller();
    const msg = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${caller} ${message}`;
    if (level === "warn") {
      console.warn(msg, ...optionalParams);
    } else if (level === "error") {
      console.error(msg, ...optionalParams);
    } else if (level == "info") {
      console.log(msg, ...optionalParams);
    } else if (level == "debug") {
      console.debug(msg, ...optionalParams);
    }
  }

  private caller(): string {
    const error = new Error();
    const stack = error.stack?.split("\n") || [];
    const callerLine = stack[4] || "";
    const match = callerLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/);
    if (match) {
      const [, methodName] = match;
      const method = methodName.includes(".")
        ? methodName.split(".")
        : methodName;
      return Array.isArray(method)
        ? `[${method[0]}] [${method[1]}]`
        : `[${method}]`;
    }
    return "[unknown]";
  }
}
