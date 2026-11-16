/**
 * Error thrown when a database operation fails.
 * The original error is kept as `cause` so the real reason is never lost.
 */
export class DatabaseError extends Error {
    public readonly cause?: Error;

    constructor(message: string, cause?: unknown) {
        const causeError = cause instanceof Error ? cause : cause != null ? new Error(String(cause)) : undefined;
        super(causeError ? `${message}: ${causeError.message}` : message);
        this.name = 'DatabaseError';
        this.cause = causeError;
    }
}
