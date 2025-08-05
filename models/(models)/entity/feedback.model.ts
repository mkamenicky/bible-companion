/**
 * Interface for Feedback entity
 */
export interface Feedback {
    readonly id: number;
    readonly date: string | null;
    readonly feedback: string | null;
}

/**
 * DTO for creating a new Feedback
 */
export interface CreateFeedbackDto {
    readonly date?: string;
    readonly feedback?: string;
}

/**
 * DTO for updating an existing Feedback
 */
export interface UpdateFeedbackDto {
    readonly id: number;
    readonly date?: string;
    readonly feedback?: string;
}
