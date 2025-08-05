/**
 * Interface for Reading entity (from readings table)
 */
export interface Reading {
    readonly id: number;
    readonly date: string | null;
    readonly chapter: string | null;
    readonly verse_count: number | null;
    readonly is_read: boolean | null;
    readonly plan_name: string | null;
}

/**
 * DTO for creating a new Reading
 */
export interface CreateReadingDto {
    readonly date?: string;
    readonly chapter?: string;
    readonly verse_count?: number;
    readonly is_read?: boolean;
    readonly plan_name?: string;
}

/**
 * DTO for updating an existing Reading
 */
export interface UpdateReadingDto {
    readonly id: number;
    readonly date?: string;
    readonly chapter?: string;
    readonly verse_count?: number;
    readonly is_read?: boolean;
    readonly plan_name?: string;
}
