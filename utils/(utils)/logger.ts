
/**
 * Logger service for consistent application logging
 * Provides different log levels and structured logging with configurable filtering
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface LoggerConfig {
    level: LogLevel;
    enabled: boolean;
    showTimestamp: boolean;
    showContext: boolean;
    contexts: Record<string, LogLevel>; // Per-context log levels
}

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
};

// Global configuration - modify this to control logging behavior
const DEFAULT_CONFIG: LoggerConfig = {
    level: 'error', // Global log level: 'debug', 'info', 'warn', 'error', 'none'
    enabled: true,
    showTimestamp: true,
    showContext: true,
    contexts: {
        // Per-context overrides (optional)
        // 'TaskService': 'debug',
        // 'ProgressService': 'warn',
        // 'Database': 'error'
    }
};

export class Logger {
    constructor(private readonly context: string, private readonly config: LoggerConfig = DEFAULT_CONFIG) {}

    /**
     * Check if a log level should be output based on configuration
     */
    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false;

        // Check context-specific level first
        const contextLevel = this.config.contexts[this.context];
        const activeLevel = contextLevel || this.config.level;

        return LOG_LEVELS[level] >= LOG_LEVELS[activeLevel];
    }

    /**
     * Get the appropriate console method for the log level
     */
    private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
        switch (level) {
            case 'error':
                return logger.error;
            case 'warn':
                return logger.warn;
            case 'info':
                return console.info;
            case 'debug':
            default:
                return console.log;
        }
    }

    /**
     * Log an informational message
     */
    info(message: string, ...args: any[]): void {
        this.log('info', message, args);
    }

    /**
     * Log a warning message
     */
    warn(message: string, ...args: any[]): void {
        this.log('warn', message, args);
    }

    /**
     * Log an error message
     */
    error(message: string, ...args: any[]): void {
        this.log('error', message, args);
    }

    /**
     * Log a debug message
     */
    debug(message: string, ...args: any[]): void {
        this.log('debug', message, args);
    }

    /**
     * Log a trace message (lowest level, only shown when level is debug)
     */
    trace(message: string, ...args: any[]): void {
        if (this.shouldLog('debug')) {
            this.log('debug', `[TRACE] ${message}`, args);
        }
    }

    /**
     * Internal logging method with level filtering
     */
    private log(level: LogLevel, message: string, ...args: any[]): void {
        if (!this.shouldLog(level)) return;

        let logMessage = '';

        // Add timestamp if enabled
        if (this.config.showTimestamp) {
            logMessage += `[${new Date().toISOString()}] `;
        }

        // Add level
        logMessage += `[${level.toUpperCase()}]`;

        // Add context if enabled
        if (this.config.showContext) {
            logMessage += ` [${this.context}]`;
        }

        logMessage += ` ${message}`;

        // Use appropriate console method and pass all additional arguments
        const consoleMethod = this.getConsoleMethod(level);
        if (args.length > 0) {
            consoleMethod(logMessage, ...args);
        } else {
            consoleMethod(logMessage);
        }
    }


    /**
     * Create a child logger with the same config but different context
     */
    child(context: string): Logger {
        return new Logger(`${this.context}:${context}`, this.config);
    }

    /**
     * Temporarily change log level for this logger instance
     */
    setLevel(level: LogLevel): Logger {
        const newConfig = {
            ...this.config,
            contexts: {
                ...this.config.contexts,
                [this.context]: level
            }
        };
        return new Logger(this.context, newConfig);
    }
}

// Global configuration functions
export const LoggerConfig = {
    /**
     * Set global log level
     */
    setLevel(level: LogLevel): void {
        DEFAULT_CONFIG.level = level;
    },

    /**
     * Set log level for specific context
     */
    setContextLevel(context: string, level: LogLevel): void {
        DEFAULT_CONFIG.contexts[context] = level;
    },

    /**
     * Enable/disable all logging
     */
    setEnabled(enabled: boolean): void {
        DEFAULT_CONFIG.enabled = enabled;
    },

    /**
     * Toggle timestamp display
     */
    setShowTimestamp(show: boolean): void {
        DEFAULT_CONFIG.showTimestamp = show;
    },

    /**
     * Toggle context display
     */
    setShowContext(show: boolean): void {
        DEFAULT_CONFIG.showContext = show;
    },

    /**
     * Reset to default configuration
     */
    reset(): void {
        DEFAULT_CONFIG.level = 'info';
        DEFAULT_CONFIG.enabled = true;
        DEFAULT_CONFIG.showTimestamp = true;
        DEFAULT_CONFIG.showContext = true;
        DEFAULT_CONFIG.contexts = {};
    }
};

// Convenience loggers for common contexts
export const logger = new Logger('TaskService');
