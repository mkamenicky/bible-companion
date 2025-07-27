/**
 * Custom error classes for repository operations
 */

/**
 * Error thrown when database operations fail
 */
export class DatabaseMessageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'DatabaseError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseMessageError);
    }
  }
}

export class DatabaseError extends Error {
    public readonly originalError?: Error | null | undefined;

    constructor(message: string, originalError?: Error | null) {
        super(message);
        this.name = 'DatabaseError';
        this.originalError = originalError;

        if (originalError?.stack) {
            this.stack = originalError.stack;
        }
    }
}
