/**
 * Interface for DailyReadingAssignment entity
 */
export interface DailyReadingAssignment {
    readonly id: number;
    readonly date: string;
    readonly plan_name: string;
    readonly start_verse_id: number;
    readonly end_verse_id: number;
    readonly display_title: string;
    readonly is_completed: boolean;
    readonly completed_at: string | null;
}

/**
 * DTO for creating a new DailyReadingAssignment
 */
export interface CreateDailyReadingAssignmentDto {
    readonly date: string;
    readonly plan_name?: string;
    readonly start_verse_id: number;
    readonly end_verse_id: number;
    readonly display_title: string;
    readonly is_completed?: boolean;
    readonly completed_at?: string;
}

/**
 * DTO for updating an existing DailyReadingAssignment
 */
export interface UpdateDailyReadingAssignmentDto {
    readonly id: number;
    readonly date?: string;
    readonly plan_name?: string;
    readonly start_verse_id?: number;
    readonly end_verse_id?: number;
    readonly display_title?: string;
    readonly is_completed?: boolean;
    readonly completed_at?: string;
}
