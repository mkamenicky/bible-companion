/**
 * Logger service for consistent application logging
 * Provides different log levels and structured logging
 */
export class Logger {
  constructor(private readonly context: string) {}

  /**
   * Log an informational message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log('INFO', message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log('WARN', message, meta);
  }

  /**
   * Log an error message
   */
  error(message: string, meta?: Record<string, any>): void {
    this.log('ERROR', message, meta);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, meta?: Record<string, any>): void {
    if (__DEV__) {
      this.log('DEBUG', message, meta);
    }
  }

  /**
   * Internal logging method
   */
  private log(level: string, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;

    if (meta) {
      console.log(logMessage, meta);
    } else {
      console.log(logMessage);
    }
  }
}
