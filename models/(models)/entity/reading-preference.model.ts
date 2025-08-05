/**
 * Interface for ReadingPreferences entity
 */
export interface ReadingPreferences {
    id: number;
    userId?: number;
    preferredReadingTime?: string;
    dailyVerseGoal: number;
    streakGraceHours: number;
    notificationEnabled: boolean;
    notificationTime: string;
    themePreference: string;
    fontSize: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * DTO for creating new ReadingPreferences
 */
export interface CreateReadingPreferencesDto {
    userId?: number;
    preferredReadingTime?: string;
    dailyVerseGoal?: number;
    streakGraceHours?: number;
    notificationEnabled?: boolean;
    notificationTime?: string;
    themePreference?: string;
    fontSize?: string;
}

/**
 * DTO for updating existing ReadingPreferences
 */
export interface UpdateReadingPreferencesDto {
    id: number;
    userId?: number;
    preferredReadingTime?: string;
    dailyVerseGoal?: number;
    streakGraceHours?: number;
    notificationEnabled?: boolean;
    notificationTime?: string;
    themePreference?: string;
    fontSize?: string;
}
