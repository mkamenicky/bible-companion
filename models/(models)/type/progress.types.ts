export interface ProgressStats {
    // Streak data
    currentStreak: number;
    longestStreak: number;
    totalReadingDays: number;

    // Reading progress
    totalVersesRead: number;
    chaptersCompleted: number;
    bibleProgressPercentage: number;

    // Period stats
    weeklyVersesRead: number;
    monthlyVersesRead: number;

    // Legacy compatibility
    weeklyProgress: number;
    monthlyProgress: number;
    completedTasks: number;
    totalTasks: number;
}


/**
 * Core interfaces for progress tracking
 */
export interface StreakInfo {
    currentStreak: number;
    longestStreak: number;
    streakDates: string[];
    lastReadingDate: string | null;
}

export interface ReadingStats {
    totalVersesRead: number;
    totalChaptersRead: number;
    booksStarted: number;
    averageVersesPerDay: number;
    totalReadingDays: number;
}

export interface PeriodStats {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
}

export interface BibleProgress {
    percentage: number;
    versesRemaining: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;
    target?: number;
}

/**
 * Reading activity summary for calendar views
 */
export interface ReadingActivity {
    date: string;
    versesRead: number;
    timeSpent: number; // in minutes
    chaptersCompleted: number;
    streak: number;
}

/**
 * Comprehensive reading statistics
 */
export interface DetailedReadingStats extends ReadingStats {
    averageReadingTime: number; // minutes per day
    mostActiveDay: string;
    favoriteReadingTime: string; // morning, afternoon, evening
    consistencyScore: number; // 0-100
    weeklyProgress: PeriodStats;
    monthlyProgress: PeriodStats;
}

/**
 * Progress calculation options
 */
export interface ProgressCalculationOptions {
    includeSkippedDays?: boolean;
    graceMinutes?: number; // Allow readings within X minutes of day boundary
    timezoneOffset?: number;
    minimumVersesForStreak?: number;
}
