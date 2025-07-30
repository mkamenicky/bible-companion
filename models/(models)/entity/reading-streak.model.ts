/**
 * Database entities for persistent streak tracking
 */
export interface ReadingStreak {
    id: number;
    userId?: number; // For multi-user support
    currentStreak: number;
    longestStreak: number;
    lastReadingDate: string;
    longestStreakStartDate: string;
    longestStreakEndDate: string;
    updatedAt: string;
    createdAt: string;
}

export interface CreateReadingStreakDto {
    userId?: number;
    currentStreak: number;
    longestStreak: number;
    lastReadingDate: string;
    longestStreakStartDate: string;
    longestStreakEndDate: string;
}

export interface UpdateReadingStreakDto {
    id: number;
    userId?: number;
    currentStreak?: number;
    longestStreak?: number;
    lastReadingDate?: string;
    longestStreakStartDate?: string;
    longestStreakEndDate?: string;
}
