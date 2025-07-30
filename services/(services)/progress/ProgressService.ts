import {
    achievementProgressRepository,
    bibleVerseProgressRepository,
    bibleVerseRepository,
    readingPreferencesRepository,
    readingSessionRepository,
    readingStreakRepository,
    tasksRepository
} from '@/repository';

import {DatabaseMessageError} from '@/errors';

import type {
    Achievement,
    CreateReadingSessionDto,
    CreateReadingStreakDto,
    PeriodStats,
    ProgressStats,
    ReadingSessionModel,
    ReadingStats,
    ReadingStreak,
    StreakInfo,
    UpdateReadingStreakDto
} from '@/models';

/**
 * Enhanced service for calculating and persisting reading progress, streaks, and analytics
 */
export class ProgressService {

    /**
     * Initialize user's reading progress tracking
     * Call this when setting up a new user or resetting progress
     */
    async initializeUserProgress(userId: number = 1): Promise<void> {
        try {
            // Initialize reading streak record
            const existingStreak = await readingStreakRepository.findByUserId(userId);
            if (!existingStreak) {
                const streakData: CreateReadingStreakDto = {
                    userId,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastReadingDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    longestStreakStartDate: '',
                    longestStreakEndDate: ''
                };
                await readingStreakRepository.create(streakData);
            }

            // Initialize reading preferences if they don't exist
            const existingPrefs = await readingPreferencesRepository.findByUserId(userId);
            if (!existingPrefs) {
                await readingPreferencesRepository.create({
                    userId,
                    preferredReadingTime: 'morning',
                    dailyVerseGoal: 10,
                    streakGraceHours: 2,
                    notificationEnabled: true,
                    notificationTime: '08:00',
                    themePreference: 'auto',
                    fontSize: 'medium'
                });
            }

            // Initialize default achievements
            await this.initializeAchievements(userId);

        } catch (error: any) {
            throw new DatabaseMessageError('Failed to initialize user progress', error);
        }
    }

    /**
     * Update reading progress after a reading session
     * This is the main method to call when a user completes reading
     */
    async updateReadingProgress(
        userId: number = 1,
        versesRead: number,
        chaptersRead: number = 0,
        booksRead: string[] = [],
        readingPlan?: string,
        notes?: string
    ): Promise<void> {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];

            // Create or update reading session
            await this.recordReadingSession({
                date: today,
                startTime: currentTime,
                endTime: currentTime,
                versesRead,
                chaptersRead,
                booksRead,
                readingPlan,
                notes
            });

            // Update streak information
            await this.updateReadingStreak(userId, today);

            // Update achievement progress
            await this.updateAchievementProgress(userId);

        } catch (error: any) {
            throw new DatabaseMessageError('Failed to update reading progress', error);
        }
    }

    /**
     * Record a reading session
     */
    async recordReadingSession(sessionData: CreateReadingSessionDto): Promise<ReadingSessionModel> {
        try {
            // Check if session already exists for this date/time
            const existingSession = await readingSessionRepository.findByDateAndTime(
                sessionData.date,
                sessionData.startTime
            );

            if (existingSession) {
                // Update existing session
                return await readingSessionRepository.update({
                    id: existingSession.id,
                    ...sessionData
                });
            } else {
                // Create new session
                return await readingSessionRepository.create(sessionData);
            }
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to record reading session', error);
        }
    }

    /**
     * Update reading streak based on new reading activity
     */
    async updateReadingStreak(userId: number = 1, readingDate: string): Promise<ReadingStreak> {
        try {
            let streakRecord = await readingStreakRepository.findByUserId(userId);

            if (!streakRecord) {
                // Initialize streak record if it doesn't exist
                await this.initializeUserProgress(userId);
                streakRecord = await readingStreakRepository.findByUserId(userId);
                if (!streakRecord) throw new Error('Failed to initialize streak record');
            }

            const lastReadingDate = new Date(streakRecord.lastReadingDate);
            const currentReadingDate = new Date(readingDate);
            const dayDifference = this.getDayDifference(lastReadingDate, currentReadingDate);

            let updatedStreak: UpdateReadingStreakDto = {
                id: streakRecord.id,
                lastReadingDate: readingDate
            };

            if (dayDifference === 1) {
                // Consecutive day - increment streak
                updatedStreak.currentStreak = streakRecord.currentStreak + 1;

                // Check if this beats the longest streak
                if (updatedStreak.currentStreak > streakRecord.longestStreak) {
                    updatedStreak.longestStreak = updatedStreak.currentStreak;
                    updatedStreak.longestStreakEndDate = readingDate;

                    // Set start date if this is the beginning of a new longest streak
                    if (updatedStreak.currentStreak === 1) {
                        updatedStreak.longestStreakStartDate = readingDate;
                    }
                }
            } else if (dayDifference > 1) {
                // Streak broken - reset to 1
                updatedStreak.currentStreak = 1;
            } else if (dayDifference === 0) {
                // Same day - no change to streak, just update timestamp
                // This handles multiple reading sessions in the same day
            } else {
                // Reading date is in the past - this shouldn't normally happen
                // but we'll handle it gracefully
                console.warn(`Reading date ${readingDate} is before last reading date ${streakRecord.lastReadingDate}`);
            }

            return await readingStreakRepository.update(updatedStreak);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to update reading streak', error);
        }
    }

    /**
     * Calculate detailed streak information from database
     */
    async calculateDetailedStreak(userId: number = 1): Promise<StreakInfo> {
        try {
            const streakRecord = await readingStreakRepository.findByUserId(userId);

            if (!streakRecord) {
                await this.initializeUserProgress(userId);
                return {
                    currentStreak: 0,
                    longestStreak: 0,
                    streakDates: [],
                    lastReadingDate: null,
                };
            }

            // Get all unique reading dates from various sources
            const readingDates = await this.getAllReadingDates();

            return {
                currentStreak: streakRecord.currentStreak,
                longestStreak: streakRecord.longestStreak,
                streakDates: readingDates,
                lastReadingDate: streakRecord.lastReadingDate,
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to calculate streak information', error);
        }
    }

    /**
     * Calculate comprehensive reading statistics
     */
    async calculateReadingStats(userId: number = 1): Promise<ReadingStats> {
        try {
            // Get verse progress
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);
            const totalVersesRead = readVerses.length;

            // Get reading sessions for more accurate chapter/book counts
            const sessions = await readingSessionRepository.findAll();
            console.log("sessions are:", sessions);
            const totalChaptersRead = sessions.reduce((sum, session) => sum + session.chaptersRead, 0);

            // Get unique books from sessions
            const booksSet = new Set<string>();
            sessions.forEach(session => {
                session.booksRead.forEach(book => booksSet.add(book));
            });
            const booksStarted = booksSet.size;

            // Calculate reading days
            const readingDates = await this.getAllReadingDates();
            const totalReadingDays = readingDates.length;

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

            const endOfToday = new Date(startOfToday);
            endOfToday.setHours(23, 59, 59, 999);

            const today = this.countVersesInPeriod(readVerses, startOfToday, endOfToday);
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
     * Get comprehensive progress statistics
     */
    async getProgressStats(userId: number = 1): Promise<ProgressStats> {
        try {
            const [streakInfo, readingStats, periodStats, bibleProgress] = await Promise.all([
                this.calculateDetailedStreak(userId),
                this.calculateReadingStats(userId),
                this.calculatePeriodStats(),
                this.calculateBibleProgress()
            ]);

            return {
                // Streak data
                currentStreak: streakInfo.currentStreak,
                longestStreak: streakInfo.longestStreak,
                totalReadingDays: readingStats.totalReadingDays,

                // Reading progress
                totalVersesRead: readingStats.totalVersesRead,
                chaptersCompleted: readingStats.totalChaptersRead,
                bibleProgressPercentage: bibleProgress.percentage,

                // Period stats
                weeklyVersesRead: periodStats.thisWeek,
                monthlyVersesRead: periodStats.thisMonth,

                // Legacy compatibility
                weeklyProgress: periodStats.thisWeek,
                monthlyProgress: periodStats.thisMonth,
                completedTasks: await this.getCompletedTasksCount(),
                totalTasks: await this.getTotalTasksCount(),
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get progress statistics', error);
        }
    }

    /**
     * Update achievement progress based on current stats
     */
    async updateAchievementProgress(userId: number = 1): Promise<void> {
        try {
            const [streakInfo, readingStats] = await Promise.all([
                this.calculateDetailedStreak(userId),
                this.calculateReadingStats(userId)
            ]);

            const achievements = [
                {id: 'first_read', target: 1, progress: Math.min(readingStats.totalVersesRead, 1)},
                {
                    id: 'week_warrior',
                    target: 7,
                    progress: Math.min(Math.max(streakInfo.currentStreak, streakInfo.longestStreak), 7)
                },
                {id: 'century_reader', target: 100, progress: Math.min(readingStats.totalVersesRead, 100)},
                {
                    id: 'month_master',
                    target: 30,
                    progress: Math.min(Math.max(streakInfo.currentStreak, streakInfo.longestStreak), 30)
                },
                {id: 'chapter_champion', target: 10, progress: Math.min(readingStats.totalChaptersRead, 10)},
                {id: 'book_explorer', target: 5, progress: Math.min(readingStats.booksStarted, 5)},
                {
                    id: 'dedication',
                    target: 100,
                    progress: Math.min(Math.max(streakInfo.currentStreak, streakInfo.longestStreak), 100)
                },
                {id: 'bible_scholar', target: 1000, progress: Math.min(readingStats.totalVersesRead, 1000)},
            ];

            for (const achievement of achievements) {
                const existingProgress = await achievementProgressRepository.findByUserIdAndAchievementId(userId, achievement.id);
                const isUnlocked = achievement.progress >= achievement.target;

                if (existingProgress) {
                    // Update existing achievement progress
                    if (existingProgress.progress !== achievement.progress || existingProgress.isUnlocked !== isUnlocked) {
                        await achievementProgressRepository.update({
                            id: existingProgress.id,
                            achievementId: existingProgress.achievementId,
                            userId: existingProgress.userId,
                            progress: achievement.progress,
                            isUnlocked,
                            unlockedAt: isUnlocked && !existingProgress.isUnlocked ? new Date().toISOString() : existingProgress.unlockedAt
                        });
                    }
                } else {
                    // Create new achievement progress
                    await achievementProgressRepository.create({
                        achievementId: achievement.id,
                        userId,
                        progress: achievement.progress,
                        isUnlocked,
                        unlockedAt: isUnlocked ? new Date().toISOString() : undefined
                    });
                }
            }
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to update achievement progress', error);
        }
    }

    /**
     * Get achievement status from database
     */
    async getAchievements(userId: number = 1): Promise<Achievement[]> {
        try {
            const achievementDefinitions = [
                {id: 'first_read', name: 'First Steps', description: 'Read your first verse', icon: '📖', target: 1},
                {
                    id: 'week_warrior',
                    name: 'Week Warrior',
                    description: 'Read for 7 consecutive days',
                    icon: '🔥',
                    target: 7
                },
                {id: 'century_reader', name: 'Century Reader', description: 'Read 100 verses', icon: '💯', target: 100},
                {
                    id: 'month_master',
                    name: 'Month Master',
                    description: 'Read for 30 consecutive days',
                    icon: '🏆',
                    target: 30
                },
                {
                    id: 'chapter_champion',
                    name: 'Chapter Champion',
                    description: 'Complete 10 chapters',
                    icon: '⭐',
                    target: 10
                },
                {
                    id: 'book_explorer',
                    name: 'Book Explorer',
                    description: 'Start reading 5 different books',
                    icon: '🗺️',
                    target: 5
                },
                {
                    id: 'dedication',
                    name: 'Dedication',
                    description: 'Read for 100 consecutive days',
                    icon: '🎯',
                    target: 100
                },
                {id: 'bible_scholar', name: 'Bible Scholar', description: 'Read 1000 verses', icon: '🎓', target: 1000},
            ];

            const achievementProgress = await achievementProgressRepository.findByUserId(userId);
            const progressMap = new Map(achievementProgress.map(ap => [ap.achievementId, ap]));

            return achievementDefinitions.map(def => {
                const progress = progressMap.get(def.id);
                return {
                    id: def.id,
                    name: def.name,
                    description: def.description,
                    icon: def.icon,
                    unlocked: progress?.isUnlocked || false,
                    progress: progress?.progress || 0,
                    target: def.target,
                };
            });
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get achievements', error);
        }
    }

    /**
     * Calculate Bible completion percentage
     */
    async calculateBibleProgress(): Promise<{ percentage: number; versesRemaining: number }> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead).length;
            const totalVerses = await bibleVerseRepository.count();

            const percentage = Math.min((readVerses / totalVerses) * 100, 100);
            const versesRemaining = Math.max(totalVerses - readVerses, 0);

            return {
                percentage: Math.round(percentage * 100) / 100,
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
     * Initialize default achievements for a user
     */
    private async initializeAchievements(userId: number): Promise<void> {
        const defaultAchievements = [
            'first_read', 'week_warrior', 'century_reader', 'month_master',
            'chapter_champion', 'book_explorer', 'dedication', 'bible_scholar'
        ];

        for (const achievementId of defaultAchievements) {
            const existing = await achievementProgressRepository.findByUserIdAndAchievementId(userId, achievementId);
            if (!existing) {
                await achievementProgressRepository.create({
                    achievementId,
                    userId,
                    progress: 0,
                    isUnlocked: false
                });
            }
        }
    }

    /**
     * Get all unique reading dates from all sources
     */
    private async getAllReadingDates(): Promise<string[]> {
        const verseProgress = await bibleVerseProgressRepository.findAll();
        const tasks = await tasksRepository.findAll();
        const sessions = await readingSessionRepository.findAll();
        console.log("sessions are:", sessions);

        const readingDates = new Set<string>();

        // Add dates from verse progress
        verseProgress
            .filter(p => p.isRead)
            .forEach(p => readingDates.add(p.dateRead));

        // // Add dates from completed reading tasks
        // tasks
        //     .filter(t => t.is_done && (
        //         t.task_name.includes('Daily Text') ||
        //         t.task_name.includes('Bible Reading') ||
        //         t.task_name.includes('Reading')
        //     ))
        //     .forEach(t => readingDates.add(t.date));

        // Add dates from reading sessions
        sessions.forEach(s => readingDates.add(s.date));

        return Array.from(readingDates).sort();
    }

    /**
     * Calculate the difference in days between two dates
     */
    private getDayDifference(date1: Date, date2: Date): number {
        const timeDiff = date2.getTime() - date1.getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    }

    /**
     * Get start of week (Monday)
     */
    private getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }

    /**
     * Count verses read in a specific period
     */
    private countVersesInPeriod(readVerses: any[], startDate: Date, endDate: Date): number {
        return readVerses.filter(verse => {
            const verseDate = new Date(verse.dateRead + 'T00:00:00.000Z');
            return verseDate >= startDate && verseDate <= endDate;
        }).length;
    }

    /**
     * Get count of completed tasks
     */
    private async getCompletedTasksCount(): Promise<number> {
        const tasks = await tasksRepository.findAll();
        return tasks.filter(t => t.is_done).length;
    }

    /**
     * Get total count of tasks
     */
    private async getTotalTasksCount(): Promise<number> {
        const tasks = await tasksRepository.findAll();
        return tasks.length;
    }
}

/**
 * Singleton instance of ProgressService
 */
export const progressService = new ProgressService();
