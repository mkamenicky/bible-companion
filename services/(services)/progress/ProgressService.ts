import { bibleVerseProgressRepository } from '@/repository/(repositories)/bible-verse-progress.repository';
import { tasksRepository } from '@/repository/(repositories)/tasks.repository';
import { DatabaseMessageError, ValidationError } from '@/errors';
import {bibleVerseRepository} from "@/repository/(repositories)/bible-verse.repository";

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

/**
 * Service for calculating reading progress, streaks, and analytics
 */
export class ProgressService {

    /**
     * Calculate detailed streak information
     */
    async calculateDetailedStreak(): Promise<StreakInfo> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const tasks = await tasksRepository.findAll();

            // Get all unique reading dates
            const readingDates = new Set<string>();

            // Add dates from verse progress
            verseProgress
                .filter(p => p.isRead)
                .forEach(p => readingDates.add(p.dateRead));

            // Add dates from completed reading tasks
            tasks
                .filter(t => t.is_done && (
                    t.task_name.includes('Daily Text') ||
                    t.task_name.includes('Bible Reading') ||
                    t.task_name.includes('Reading')
                ))
                .forEach(t => readingDates.add(t.date));

            const sortedDates = Array.from(readingDates).sort();

            if (sortedDates.length === 0) {
                return {
                    currentStreak: 0,
                    longestStreak: 0,
                    streakDates: [],
                    lastReadingDate: null,
                };
            }

            const lastReadingDate = sortedDates[sortedDates.length - 1];
            const currentStreak = this.calculateCurrentStreak(sortedDates);
            const longestStreak = this.calculateLongestStreak(sortedDates);

            return {
                currentStreak,
                longestStreak,
                streakDates: sortedDates,
                lastReadingDate,
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to calculate streak information', error);
        }
    }

    /**
     * Calculate current reading streak
     */
    private calculateCurrentStreak(sortedDates: string[]): number {
        if (sortedDates.length === 0) return 0;

        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if user has read today or yesterday (to account for different time zones)
        const lastReadingDate = sortedDates[sortedDates.length - 1];

        if (lastReadingDate !== todayStr && lastReadingDate !== yesterdayStr) {
            return 0; // Streak is broken
        }

        let streak = 0;
        let currentDate = new Date();

        // Start from today and work backwards
        for (let i = 0; i < sortedDates.length; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];

            if (sortedDates.includes(dateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (i === 0 && dateStr === todayStr) {
                // If today is not included, check yesterday
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Calculate longest streak from sorted dates
     */
    private calculateLongestStreak(sortedDates: string[]): number {
        if (sortedDates.length === 0) return 0;
        if (sortedDates.length === 1) return 1;

        let longestStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffTime = currDate.getTime() - prevDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }

        return Math.max(longestStreak, currentStreak);
    }

    /**
     * Calculate comprehensive reading statistics
     */
    async calculateReadingStats(): Promise<ReadingStats> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);

            const totalVersesRead = readVerses.length;

            // Estimate chapters (average 25 verses per chapter)
            const totalChaptersRead = Math.floor(totalVersesRead / 25);

            // Estimate books started (average 800 verses per book)
            const booksStarted = Math.floor(totalVersesRead / 800);

            // Calculate reading days
            const readingDates = new Set(readVerses.map(v => v.dateRead));
            const totalReadingDays = readingDates.size;

            // Calculate average verses per day
            const averageVersesPerDay = totalReadingDays > 0
                ? Math.round(totalVersesRead / totalReadingDays)
                : 0;

            return {
                totalVersesRead,
                totalChaptersRead,
                booksStarted,
                averageVersesPerDay,
                totalReadingDays,
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to calculate reading statistics', error);
        }
    }

    /**
     * Calculate period-based reading statistics
     */
    async calculatePeriodStats(): Promise<PeriodStats> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = this.getStartOfWeek(now);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfYear = new Date(now.getFullYear(), 0, 1);

            const today = this.countVersesInPeriod(readVerses, startOfToday, now);
            const thisWeek = this.countVersesInPeriod(readVerses, startOfWeek, now);
            const thisMonth = this.countVersesInPeriod(readVerses, startOfMonth, now);
            const thisYear = this.countVersesInPeriod(readVerses, startOfYear, now);

            return {
                today,
                thisWeek,
                thisMonth,
                thisYear,
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to calculate period statistics', error);
        }
    }

    /**
     * Get start of week (Monday)
     */
    private getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    /**
     * Count verses read in a specific period
     */
    private countVersesInPeriod(readVerses: any[], startDate: Date, endDate: Date): number {
        return readVerses.filter(verse => {
            const verseDate = new Date(verse.dateRead);
            return verseDate >= startDate && verseDate <= endDate;
        }).length;
    }

    /**
     * Calculate Bible completion percentage
     */
    async calculateBibleProgress(): Promise<{ percentage: number; versesRemaining: number }> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead).length;

            // Total verses in the Bible (approximate)
            const TOTAL_BIBLE_VERSES = await bibleVerseRepository.count();

            const percentage = Math.min((readVerses / TOTAL_BIBLE_VERSES) * 100, 100);
            const versesRemaining = Math.max(TOTAL_BIBLE_VERSES - readVerses, 0);

            return {
                percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
                versesRemaining,
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to calculate Bible progress', error);
        }
    }

    /**
     * Get reading activity for calendar visualization
     */
    async getReadingActivity(year?: number): Promise<Map<string, number>> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const currentYear = year || new Date().getFullYear();

            const activity = new Map<string, number>();

            verseProgress
                .filter(p => p.isRead)
                .forEach(verse => {
                    const date = new Date(verse.dateRead);
                    if (date.getFullYear() === currentYear) {
                        const dateStr = verse.dateRead;
                        const currentCount = activity.get(dateStr) || 0;
                        activity.set(dateStr, currentCount + 1);
                    }
                });

            return activity;
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get reading activity', error);
        }
    }

    /**
     * Get achievement status
     */
    async getAchievements(): Promise<Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        unlocked: boolean;
        progress?: number;
        target?: number;
    }>> {
        try {
            const streakInfo = await this.calculateDetailedStreak();
            const readingStats = await this.calculateReadingStats();
            const bibleProgress = await this.calculateBibleProgress();

            return [
                {
                    id: 'first_read',
                    name: 'First Steps',
                    description: 'Read your first verse',
                    icon: '📖',
                    unlocked: readingStats.totalVersesRead >= 1,
                    progress: Math.min(readingStats.totalVersesRead, 1),
                    target: 1,
                },
                {
                    id: 'week_warrior',
                    name: 'Week Warrior',
                    description: 'Read for 7 consecutive days',
                    icon: '🔥',
                    unlocked: streakInfo.currentStreak >= 7 || streakInfo.longestStreak >= 7,
                    progress: Math.min(streakInfo.currentStreak, 7),
                    target: 7,
                },
                {
                    id: 'century_reader',
                    name: 'Century Reader',
                    description: 'Read 100 verses',
                    icon: '💯',
                    unlocked: readingStats.totalVersesRead >= 100,
                    progress: Math.min(readingStats.totalVersesRead, 100),
                    target: 100,
                },
                {
                    id: 'month_master',
                    name: 'Month Master',
                    description: 'Read for 30 consecutive days',
                    icon: '🏆',
                    unlocked: streakInfo.currentStreak >= 30 || streakInfo.longestStreak >= 30,
                    progress: Math.min(streakInfo.currentStreak, 30),
                    target: 30,
                },
                {
                    id: 'chapter_champion',
                    name: 'Chapter Champion',
                    description: 'Complete 10 chapters',
                    icon: '⭐',
                    unlocked: readingStats.totalChaptersRead >= 10,
                    progress: Math.min(readingStats.totalChaptersRead, 10),
                    target: 10,
                },
                {
                    id: 'book_explorer',
                    name: 'Book Explorer',
                    description: 'Start reading 5 different books',
                    icon: '🗺️',
                    unlocked: readingStats.booksStarted >= 5,
                    progress: Math.min(readingStats.booksStarted, 5),
                    target: 5,
                },
                {
                    id: 'dedication',
                    name: 'Dedication',
                    description: 'Read for 100 consecutive days',
                    icon: '🎯',
                    unlocked: streakInfo.currentStreak >= 100 || streakInfo.longestStreak >= 100,
                    progress: Math.min(streakInfo.currentStreak, 100),
                    target: 100,
                },
                {
                    id: 'bible_scholar',
                    name: 'Bible Scholar',
                    description: 'Read 1000 verses',
                    icon: '🎓',
                    unlocked: readingStats.totalVersesRead >= 1000,
                    progress: Math.min(readingStats.totalVersesRead, 1000),
                    target: 1000,
                },
            ];
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get achievements', error);
        }
    }

    /**
     * Validate date input
     */
    private validateDate(date: any, fieldName: string): void {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new ValidationError(`${fieldName} must be a valid Date`);
        }
    }

    /**
     * Format date to ISO string
     */
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}

/**
 * Singleton instance of ProgressService
 */
export const progressService = new ProgressService();
