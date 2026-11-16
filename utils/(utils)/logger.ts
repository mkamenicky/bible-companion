/**
 * Small leveled logger.
 *
 * Usage: `logger.debug('message', extra)`. Everything below the configured
 * level is dropped, so debug output costs nothing in production builds.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4,
};

const config: { level: LogLevel } = {
    // Verbose while developing, quiet in release builds.
    level: typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn',
};

export class Logger {
    constructor(private readonly context: string) {
    }

    debug(message: string, ...args: unknown[]): void {
        this.log('debug', message, args);
    }

    info(message: string, ...args: unknown[]): void {
        this.log('info', message, args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.log('warn', message, args);
    }

    error(message: string, ...args: unknown[]): void {
        this.log('error', message, args);
    }

    /** Creates a logger whose output is tagged with its own context. */
    child(context: string): Logger {
        return new Logger(context);
    }

    private log(level: Exclude<LogLevel, 'none'>, message: string, args: unknown[]): void {
        if (LOG_LEVELS[level] < LOG_LEVELS[config.level]) return;

        const line = `[${level.toUpperCase()}] [${this.context}] ${message}`;

        // Must write to the console directly. Routing back through the logger
        // (as the previous version did) recurses and throws.
        switch (level) {
            case 'error':
                console.error(line, ...args);
                break;
            case 'warn':
                console.warn(line, ...args);
                break;
            case 'info':
                console.info(line, ...args);
                break;
            default:
                console.log(line, ...args);
        }
    }
}

export const LoggerConfig = {
    setLevel(level: LogLevel): void {
        config.level = level;
    },
    getLevel(): LogLevel {
        return config.level;
    },
};

/** Shared application logger. */
export const logger = new Logger('App');
