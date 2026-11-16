/** Numbers shown on the progress screen. */
export interface ProgressStats {
    currentStreak: number;
    longestStreak: number;
    totalReadingDays: number;

    totalVersesRead: number;
    chaptersCompleted: number;
    /** 0-100, two decimals. */
    bibleProgressPercentage: number;

    weeklyVersesRead: number;
    monthlyVersesRead: number;
}

export interface StreakInfo {
    /** Consecutive reading days up to today (or yesterday, if today is still open). */
    currentStreak: number;
    longestStreak: number;
    /** YYYY-MM-DD of the most recent reading day, or null. */
    lastReadingDate: string | null;
    readToday: boolean;
    totalReadingDays: number;
}

/** Verses read per period (backfilled verses are not included). */
export interface PeriodStats {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
}

export interface AchievementStats {
    total: number;
    unlocked: number;
    available: number;
    locked: number;
    completionPercentage: number;
}

export interface AchievementUnlockEvent {
    userId: number;
    achievementId: string;
    achievementName: string;
    unlockedAt: string;
    previousProgress: number;
    newProgress: number;
    isFirstTime: boolean;
}
