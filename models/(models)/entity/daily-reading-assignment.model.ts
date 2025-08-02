/**
 * Interface for DailyReadingAssignment entity
 */
export interface DailyReadingAssignment {
    readonly id: number;
    readonly date: string;
    readonly plan_name: string;
    readonly chapter_id: number;
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
    readonly chapter_id: number;
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
    readonly chapter_id: number;
    readonly start_verse_id?: number;
    readonly end_verse_id?: number;
    readonly display_title?: string;
    readonly is_completed?: boolean;
    readonly completed_at?: string;
}


// Enhanced Daily Reading Assignment (if you want to extend the existing one)
export interface EnhancedDailyReadingAssignment extends DailyReadingAssignment {
    localized_title?: string; // Add this field for the localized title
    verses_in_range?: number;
    estimated_reading_time?: number;
    difficulty_level?: 'easy' | 'medium' | 'hard';
    book_name?: string;
    chapter_number?: number;
    testament?: 'Old' | 'New';
}

