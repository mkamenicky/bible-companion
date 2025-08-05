import {Achievement} from "@/models/(models)/entity/achievement.model";

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

/**
 * Enhanced progress hook return type
 */
export interface UseProgressDataReturn {
    // Core data
    stats: ProgressStats | null;
    achievements: Achievement[];
    achievementStats: AchievementStats | null;
    loading: boolean;

    // Achievement unlock events
    recentUnlocks: AchievementUnlockEvent[];
    clearRecentUnlocks: () => void;
    dismissUnlock: (achievementId: string) => void;

    // Actions
    onRefresh: () => Promise<void>;
    markReadingProgress: (
        versesRead: number,
        chaptersRead?: number,
        booksRead?: string[],
        readingPlan?: string,
        notes?: string
    ) => Promise<AchievementUnlockEvent[]>;

    // Achievement queries
    getAchievementsByCategory: (category: string) => Promise<Achievement[]>;
    getAvailableAchievements: () => Promise<Achievement[]>;

    // Computed values
    hasRecentUnlocks: boolean;
    unlockedAchievements: Achievement[];
    inProgressAchievements: Achievement[];
    availableAchievements: Achievement[];
}

/**
 * Achievement Statistics
 */
export interface AchievementStats {
    total: number;
    unlocked: number;
    available: number;
    locked: number;
    completionPercentage: number;
}

/**
 * Achievement Category for UI organization
 */
export interface AchievementCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    achievements: Achievement[];
}

/**
 * Achievement unlock event interface
 */
export interface AchievementUnlockEvent {
    userId: number;
    achievementId: string;
    achievementName: string;
    unlockedAt: string;
    previousProgress: number;
    newProgress: number;
    isFirstTime: boolean;
}

/**
 * Achievement calculation context
 */
export interface AchievementCalculationContext {
    userId: number;
    totalVersesRead: number;
    totalChaptersRead: number;
    booksStarted: number;
    currentStreak: number;
    bestStreak: number;
    totalReadingDays: number;
    weeklyVersesRead: number;
    monthlyVersesRead: number;
}
