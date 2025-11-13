export class Logger {
    name;
    logLevel;
    constructor(name) {
        this.name = name;
        this.logLevel = process.env.LOG_LEVEL || "info";
    }
    shouldLog(level) {
        const levels = ["debug", "info", "warn", "error"];
        const currentIndex = levels.indexOf(this.logLevel);
        const messageIndex = levels.indexOf(level);
        return messageIndex >= currentIndex;
    }
    formatMessage(level, message, data) {
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
    debug(message, data) {
        if (this.shouldLog("debug")) {
            console.error(this.formatMessage("debug", message, data));
        }
    }
    info(message, data) {
        if (this.shouldLog("info")) {
            console.error(this.formatMessage("info", message, data));
        }
    }
    warn(message, data) {
        if (this.shouldLog("warn")) {
            console.error(this.formatMessage("warn", message, data));
        }
    }
    error(message, data) {
        if (this.shouldLog("error")) {
            console.error(this.formatMessage("error", message, data));
        }
    }
}
