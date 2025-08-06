import {
    achievementProgressRepository, bibleBookRepository, bibleChapterRepository,
    bibleVerseProgressRepository,
    bibleVerseRepository,
    readingPreferencesRepository,
    readingSessionRepository,
    readingStreakRepository,
    tasksRepository
} from '@/repository';

import {DatabaseMessageError} from '@/errors';

import type {
    Achievement, BibleBook, BibleChapter,
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
import { logger } from "@/utils/(utils)/logger";

// Define achievement unlock event interface
export interface AchievementUnlockEvent {
    userId: number;
    achievementId: string;
    achievementName: string;
    unlockedAt: string;
    previousProgress: number;
    newProgress: number;
    isFirstTime: boolean;
}

// Achievement calculation context
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

/**
 * Enhanced service for calculating and persisting reading progress, streaks, and analytics
 * Now fully integrated with database-driven achievement system using repository pattern
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

            // Initialize achievement progress for all existing achievements in database
            await this.initializeAchievementProgressForUser(userId);

        } catch (error: any) {
            throw new DatabaseMessageError('Failed to initialize user progress', error);
        }
    }

    /**
     * Enhanced update reading progress that automatically calculates chapters and books
     */
    async updateReadingProgress(
        userId: number = 1,
        versesRead: number,
        chaptersRead: number = 0,
        booksRead: string[] = [],
        readingPlan?: string,
        notes?: string
    ): Promise<AchievementUnlockEvent[]> {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];

            // Calculate actual chapters completed and books started from verse data
            const [actualChaptersCompleted, actualBooksStarted] = await Promise.all([
                this.getCompletedChaptersCount(userId),
                this.getBooksStartedCount(userId)
            ]);

            // Use calculated values if not provided explicitly
            const finalChaptersRead = chaptersRead > 0 ? chaptersRead : actualChaptersCompleted;
            const finalBooksRead = booksRead.length > 0 ? booksRead : await this.getStartedBookNames();

            // Create or update reading session with calculated data
            await this.recordReadingSession({
                date: today,
                startTime: currentTime,
                endTime: currentTime,
                versesRead,
                chaptersRead: finalChaptersRead,
                booksRead: finalBooksRead,
                readingPlan,
                notes
            });

            // Update streak information
            await this.updateReadingStreak(userId, today);

            // Update achievement progress and get any newly unlocked achievements
            return await this.updateAchievementProgressFromDatabase(userId);

        } catch (error: any) {
            throw new DatabaseMessageError('Failed to update reading progress', error);
        }
    }

    /**
     * Helper method to get names of books that have been started
     */
    private async getStartedBookNames(): Promise<string[]> {
        try {
            const bookProgress = await this.getBookProgress();
            return bookProgress.bookDetails
                .filter(book => book.isStarted)
                .map(book => book.bookName);
        } catch (error: any) {
            logger.error('Error getting started book names:', error);
            return [];
        }
    }

    /**
     * Check if a specific chapter is completed
     */
    async isChapterCompleted(chapterId: number): Promise<boolean> {
        try {
            const chapter = await bibleChapterRepository.findById(chapterId);
            if (!chapter || !chapter.FirstVerseId || !chapter.LastVerseId) {
                return false;
            }

            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerseIds = new Set(verseProgress.filter(p => p.isRead).map(v => v.bibleVerseId));

            for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                if (!readVerseIds.has(verseId)) {
                    return false;
                }
            }

            return true;
        } catch (error: any) {
            logger.error('Error checking chapter completion:', error);
            return false;
        }
    }

    /**
     * Check if a specific book is completed
     */
    async isBookCompleted(bookNumber: number): Promise<boolean> {
        try {
            const [allChapters, verseProgress] = await Promise.all([
                bibleChapterRepository.findByBookNumber(bookNumber),
                bibleVerseProgressRepository.findAll()
            ]);

            if (allChapters.length === 0) {
                return false;
            }

            const readVerseIds = new Set(verseProgress.filter(p => p.isRead).map(v => v.bibleVerseId));

            for (const chapter of allChapters) {
                if (chapter.FirstVerseId && chapter.LastVerseId) {
                    for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                        if (!readVerseIds.has(verseId)) {
                            return false;
                        }
                    }
                }
            }

            return true;
        } catch (error: any) {
            logger.error('Error checking book completion:', error);
            return false;
        }
    }

    /**
     * Get chapter completion percentage for a specific chapter
     */
    async getChapterCompletionPercentage(chapterId: number): Promise<number> {
        try {
            const chapter = await bibleChapterRepository.findById(chapterId);
            if (!chapter || !chapter.FirstVerseId || !chapter.LastVerseId) {
                return 0;
            }

            const totalVerses = chapter.LastVerseId - chapter.FirstVerseId + 1;
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerseIds = new Set(verseProgress.filter(p => p.isRead).map(v => v.bibleVerseId));

            let readVerses = 0;
            for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                if (readVerseIds.has(verseId)) {
                    readVerses++;
                }
            }

            return totalVerses > 0 ? Math.round((readVerses / totalVerses) * 100) : 0;
        } catch (error: any) {
            logger.error('Error calculating chapter completion percentage:', error);
            return 0;
        }
    }

    /**
     * Get book completion percentage for a specific book
     */
    async getBookCompletionPercentage(bookNumber: number): Promise<number> {
        try {
            const [allChapters, verseProgress] = await Promise.all([
                bibleChapterRepository.findByBookNumber(bookNumber),
                bibleVerseProgressRepository.findAll()
            ]);

            if (allChapters.length === 0) {
                return 0;
            }

            const readVerseIds = new Set(verseProgress.filter(p => p.isRead).map(v => v.bibleVerseId));
            let totalVerses = 0;
            let readVerses = 0;

            for (const chapter of allChapters) {
                if (chapter.FirstVerseId && chapter.LastVerseId) {
                    for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                        totalVerses++;
                        if (readVerseIds.has(verseId)) {
                            readVerses++;
                        }
                    }
                }
            }

            return totalVerses > 0 ? Math.round((readVerses / totalVerses) * 100) : 0;
        } catch (error: any) {
            logger.error('Error calculating book completion percentage:', error);
            return 0;
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
                logger.warn(`Reading date ${readingDate} is before last reading date ${streakRecord.lastReadingDate}`);
            }

            return await readingStreakRepository.update(updatedStreak);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to update reading streak', error);
        }
    }

    /**
     * Fix streak record when current streak is higher than longest
     */
    async fixStreakRecord(userId: number = 1, currentStreak: number, currentDate: string): Promise<void> {
        try {
            const streakRecord = await readingStreakRepository.findByUserId(userId);
            if (streakRecord && currentStreak > streakRecord.longestStreak) {
                await readingStreakRepository.update({
                    id: streakRecord.id,
                    longestStreak: currentStreak,
                    longestStreakEndDate: currentDate,
                    longestStreakStartDate: streakRecord.longestStreakStartDate || currentDate
                });
                logger.debug('Fixed streak record:', { currentStreak, newLongestStreak: currentStreak });
            }
        } catch (error) {
            logger.error('Error fixing streak record:', error);
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
     * Calculate comprehensive reading statistics with proper chapter and book mapping
     */
    async calculateReadingStats(userId: number = 1): Promise<ReadingStats> {
        try {
            // Get verse progress
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);
            const totalVersesRead = readVerses.length;

            // Get all chapters and books for mapping
            const [allChapters, allBooks] = await Promise.all([
                bibleChapterRepository.findAll(),
                bibleBookRepository.findAll()
            ]);

            // Calculate completed chapters
            const completedChapters = await this.calculateCompletedChapters(readVerses, allChapters);

            // Calculate books started (any verse read from the book)
            const booksStarted = await this.calculateBooksStarted(readVerses, allChapters, allBooks);

            // Calculate reading days
            const readingDates = await this.getAllReadingDates();
            const totalReadingDays = readingDates.length;

            // Calculate average verses per day
            const averageVersesPerDay = totalReadingDays > 0
                ? Math.round(totalVersesRead / totalReadingDays)
                : 0;

            return {
                totalVersesRead,
                totalChaptersRead: completedChapters,
                booksStarted,
                averageVersesPerDay,
                totalReadingDays,
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to calculate reading statistics', error);
        }
    }

    /**
     * Calculate how many chapters have been completely read
     */
    private async calculateCompletedChapters(
        readVerses: Array<{bibleVerseId: number, isRead: boolean, dateRead: string}>,
        allChapters: BibleChapter[]
    ): Promise<number> {
        const readVerseIds = new Set(readVerses.map(v => v.bibleVerseId));
        let completedChapters = 0;

        for (const chapter of allChapters) {
            if (chapter.FirstVerseId && chapter.LastVerseId) {
                // Check if all verses in this chapter are read
                let allVersesRead = true;

                for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                    if (!readVerseIds.has(verseId)) {
                        allVersesRead = false;
                        break;
                    }
                }

                if (allVersesRead) {
                    completedChapters++;
                }
            }
        }

        return completedChapters;
    }

    /**
     * Calculate how many books have been started (at least one verse read)
     */
    private async calculateBooksStarted(
        readVerses: Array<{bibleVerseId: number, isRead: boolean, dateRead: string}>,
        allChapters: BibleChapter[],
        allBooks: BibleBook[]
    ): Promise<number> {
        const readVerseIds = new Set(readVerses.map(v => v.bibleVerseId));
        const booksWithReadVerses = new Set<number>();

        // Create a map of book numbers for quick lookup
        const bookMap = new Map(allBooks.map(book => [book.BibleBookId, book]));

        for (const chapter of allChapters) {
            if (chapter.BookNumber && chapter.FirstVerseId && chapter.LastVerseId) {
                // Check if any verse in this chapter has been read
                for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                    if (readVerseIds.has(verseId)) {
                        booksWithReadVerses.add(chapter.BookNumber);
                        break; // Found at least one read verse in this chapter
                    }
                }
            }
        }

        return booksWithReadVerses.size;
    }

    /**
     * Enhanced method to calculate completed chapters for achievement tracking
     */
    async getCompletedChaptersCount(userId: number = 1): Promise<number> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);
            const allChapters = await bibleChapterRepository.findAll();

            return await this.calculateCompletedChapters(readVerses, allChapters);
        } catch (error: any) {
            logger.error('Error calculating completed chapters:', error);
            return 0;
        }
    }

    /**
     * Enhanced method to calculate books started for achievement tracking
     */
    async getBooksStartedCount(userId: number = 1): Promise<number> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);
            const [allChapters, allBooks] = await Promise.all([
                bibleChapterRepository.findAll(),
                bibleBookRepository.findAll()
            ]);

            return await this.calculateBooksStarted(readVerses, allChapters, allBooks);
        } catch (error: any) {
            logger.error('Error calculating books started:', error);
            return 0;
        }
    }

    /**
     * Get detailed chapter progress information
     */
    async getChapterProgress(userId: number = 1): Promise<{
        totalChapters: number;
        completedChapters: number;
        progressPercentage: number;
        chapterDetails: Array<{
            chapterId: number;
            bookNumber: number;
            chapterNumber: number;
            totalVerses: number;
            readVerses: number;
            isCompleted: boolean;
        }>;
    }> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);
            const readVerseIds = new Set(readVerses.map(v => v.bibleVerseId));
            const allChapters = await bibleChapterRepository.findAll();

            const chapterDetails = [];
            let completedChapters = 0;

            for (const chapter of allChapters) {
                if (chapter.FirstVerseId && chapter.LastVerseId) {
                    const totalVerses = chapter.LastVerseId - chapter.FirstVerseId + 1;
                    let readVersesInChapter = 0;

                    for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                        if (readVerseIds.has(verseId)) {
                            readVersesInChapter++;
                        }
                    }

                    const isCompleted = readVersesInChapter === totalVerses;
                    if (isCompleted) {
                        completedChapters++;
                    }

                    chapterDetails.push({
                        chapterId: chapter.BibleChapterId,
                        bookNumber: chapter.BookNumber || 0,
                        chapterNumber: chapter.ChapterNumber || 0,
                        totalVerses,
                        readVerses: readVersesInChapter,
                        isCompleted
                    });
                }
            }

            const totalChapters = allChapters.length;
            const progressPercentage = totalChapters > 0
                ? Math.round((completedChapters / totalChapters) * 100)
                : 0;

            return {
                totalChapters,
                completedChapters,
                progressPercentage,
                chapterDetails
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get chapter progress', error);
        }
    }

    /**
     * Get detailed book progress information
     */
    async getBookProgress(userId: number = 1): Promise<{
        totalBooks: number;
        booksStarted: number;
        booksCompleted: number;
        progressPercentage: number;
        bookDetails: Array<{
            bookId: number;
            bookName: string;
            totalVerses: number;
            readVerses: number;
            totalChapters: number;
            completedChapters: number;
            isStarted: boolean;
            isCompleted: boolean;
        }>;
    }> {
        try {
            const verseProgress = await bibleVerseProgressRepository.findAll();
            const readVerses = verseProgress.filter(p => p.isRead);
            const readVerseIds = new Set(readVerses.map(v => v.bibleVerseId));

            const [allBooks, allChapters] = await Promise.all([
                bibleBookRepository.findAll(),
                bibleChapterRepository.findAll()
            ]);

            const bookDetails = [];
            let booksStarted = 0;
            let booksCompleted = 0;

            for (const book of allBooks) {
                const bookChapters = allChapters.filter(c => c.BookNumber === book.BibleBookId);
                let totalVerses = 0;
                let readVersesInBook = 0;
                let completedChapters = 0;

                for (const chapter of bookChapters) {
                    if (chapter.FirstVerseId && chapter.LastVerseId) {
                        const chapterVerseCount = chapter.LastVerseId - chapter.FirstVerseId + 1;
                        totalVerses += chapterVerseCount;

                        let readVersesInChapter = 0;
                        for (let verseId = chapter.FirstVerseId; verseId <= chapter.LastVerseId; verseId++) {
                            if (readVerseIds.has(verseId)) {
                                readVersesInChapter++;
                                readVersesInBook++;
                            }
                        }

                        if (readVersesInChapter === chapterVerseCount) {
                            completedChapters++;
                        }
                    }
                }

                const isStarted = readVersesInBook > 0;
                const isCompleted = readVersesInBook === totalVerses && totalVerses > 0;

                if (isStarted) booksStarted++;
                if (isCompleted) booksCompleted++;

                bookDetails.push({
                    bookId: book.BibleBookId,
                    bookName: book.ChapterDisplayTitle || `Book ${book.BibleBookId}`,
                    totalVerses,
                    readVerses: readVersesInBook,
                    totalChapters: bookChapters.length,
                    completedChapters,
                    isStarted,
                    isCompleted
                });
            }

            const totalBooks = allBooks.length;
            const progressPercentage = totalBooks > 0
                ? Math.round((booksStarted / totalBooks) * 100)
                : 0;

            return {
                totalBooks,
                booksStarted,
                booksCompleted,
                progressPercentage,
                bookDetails
            };
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get book progress', error);
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
     * Update achievement progress using database-driven rules and calculations
     * This replaces the old hardcoded approach - now uses repository methods
     */
    async updateAchievementProgressFromDatabase(userId: number = 1): Promise<AchievementUnlockEvent[]> {
        try {
            const unlockedAchievements: AchievementUnlockEvent[] = [];

            // Get current calculation context
            const context = await this.getAchievementCalculationContext(userId);

            // Get all achievements from database with their current progress using repository
            const achievements = await achievementProgressRepository.getAchievementsWithProgress(userId);

            for (const achievement of achievements) {
                // Calculate new progress based on achievement rules from database
                let newProgress = await this.calculateProgressForAchievement(achievement.id, context);

                // Cap progress at target value
                newProgress = Math.min(newProgress, achievement.targetValue);

                const wasUnlocked = achievement.unlocked;
                const isNowUnlocked = newProgress >= achievement.targetValue;
                const progressChanged = newProgress !== achievement.progress;

                // Update progress if changed
                if (progressChanged || (isNowUnlocked && !wasUnlocked)) {
                    const existingProgress = await achievementProgressRepository.findByUserIdAndAchievementId(userId, achievement.id);

                    if (existingProgress) {
                        await achievementProgressRepository.update({
                            id: existingProgress.id,
                            achievementId: achievement.id,
                            userId,
                            progress: newProgress,
                            isUnlocked: isNowUnlocked,
                            unlockedAt: isNowUnlocked && !wasUnlocked ? new Date().toISOString() : existingProgress.unlockedAt
                        });
                    } else {
                        await achievementProgressRepository.create({
                            achievementId: achievement.id,
                            userId,
                            progress: newProgress,
                            isUnlocked: isNowUnlocked,
                            unlockedAt: isNowUnlocked ? new Date().toISOString() : undefined
                        });
                    }

                    // Track newly unlocked achievements
                    if (isNowUnlocked && !wasUnlocked) {
                        unlockedAchievements.push({
                            userId,
                            achievementId: achievement.id,
                            achievementName: achievement.name,
                            unlockedAt: new Date().toISOString(),
                            previousProgress: achievement.progress,
                            newProgress,
                            isFirstTime: true
                        });
                    }
                }
            }

            return unlockedAchievements;

        } catch (error: any) {
            throw new DatabaseMessageError('Failed to update achievement progress from database', error);
        }
    }

    /**
     * Legacy method for backward compatibility - now calls the database version
     */
    async updateAchievementProgress(userId: number = 1): Promise<void> {
        await this.updateAchievementProgressFromDatabase(userId);
    }

    /**
     * Get achievement status from database using repository
     */
    async getAchievements(userId: number = 1): Promise<Achievement[]> {
        try {
            return await achievementProgressRepository.getAchievementsWithProgress(userId);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get achievements from database', error);
        }
    }

    /**
     * Get available achievements (prerequisites met) using repository
     */
    async getAvailableAchievements(userId: number = 1): Promise<Achievement[]> {
        try {
            return await achievementProgressRepository.getAvailableAchievements(userId);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get available achievements', error);
        }
    }

    /**
     * Get achievements by category using repository
     */
    async getAchievementsByCategory(category: string, userId: number = 1): Promise<Achievement[]> {
        try {
            return await achievementProgressRepository.getAchievementsByCategory(category, userId);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get achievements by category', error);
        }
    }

    /**
     * Get achievement statistics using repository
     */
    async getAchievementStats(userId: number = 1): Promise<{
        total: number;
        unlocked: number;
        available: number;
        locked: number;
        completionPercentage: number;
    }> {
        try {
            return await achievementProgressRepository.getAchievementStats(userId);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get achievement statistics', error);
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
     * Get calculation context for achievement progress
     */
    private async getAchievementCalculationContext(userId: number): Promise<AchievementCalculationContext> {
        const [streakInfo, readingStats, periodStats] = await Promise.all([
            this.calculateDetailedStreak(userId),
            this.calculateReadingStats(userId),
            this.calculatePeriodStats()
        ]);

        return {
            userId,
            totalVersesRead: readingStats.totalVersesRead,
            totalChaptersRead: readingStats.totalChaptersRead,
            booksStarted: readingStats.booksStarted,
            currentStreak: streakInfo.currentStreak,
            bestStreak: streakInfo.longestStreak,
            totalReadingDays: readingStats.totalReadingDays,
            weeklyVersesRead: periodStats.thisWeek,
            monthlyVersesRead: periodStats.thisMonth
        };
    }

    /**
     * Calculate progress for a specific achievement using database rules via repository
     */
    private async calculateProgressForAchievement(achievementId: string, context: AchievementCalculationContext): Promise<number> {
        try {
            // Get rules from database for this achievement using repository
            const rules = await achievementProgressRepository.getAchievementRules(achievementId);

            let maxProgress = 0;

            for (const rule of rules) {
                let progress = 0;

                switch (rule.rule_type) {
                    case 'total_verses':
                        progress = context.totalVersesRead;
                        break;
                    case 'consecutive_days':
                        progress = Math.max(context.currentStreak, context.bestStreak);
                        break;
                    case 'chapters_read':
                        progress = context.totalChaptersRead;
                        break;
                    case 'books_started':
                        progress = context.booksStarted;
                        break;
                    case 'custom':
                        if (rule.calculation_query) {
                            // Execute custom SQL query for complex calculations using repository
                            try {
                                const customResult = await achievementProgressRepository.executeQuery(rule.calculation_query, []);
                                progress = customResult[0] ? Object.values(customResult[0])[0] as number : 0;
                            } catch (error) {
                                logger.warn(`Failed to execute custom calculation for achievement ${achievementId}:`, error);
                                progress = 0;
                            }
                        }
                        break;
                    default:
                        progress = 0;
                }

                maxProgress = Math.max(maxProgress, progress);
            }

            // If no rules found, fall back to legacy calculation
            if (rules.length === 0) {
                maxProgress = this.calculateLegacyProgress(achievementId, context);
            }

            return maxProgress;

        } catch (error: any) {
            logger.warn(`Failed to calculate progress for achievement ${achievementId}, using legacy method:`, error);
            return this.calculateLegacyProgress(achievementId, context);
        }
    }

    /**
     * Legacy progress calculation for backward compatibility
     */
    private calculateLegacyProgress(achievementId: string, context: AchievementCalculationContext): number {
        switch (achievementId) {
            case 'first_read':
                return Math.min(context.totalVersesRead, 1);
            case 'week_warrior':
                return Math.min(Math.max(context.currentStreak, context.bestStreak), 7);
            case 'century_reader':
                return Math.min(context.totalVersesRead, 100);
            case 'month_master':
                return Math.min(Math.max(context.currentStreak, context.bestStreak), 30);
            case 'chapter_champion':
                return Math.min(context.totalChaptersRead, 10);
            case 'book_explorer':
                return Math.min(context.booksStarted, 5);
            case 'dedication':
                return Math.min(Math.max(context.currentStreak, context.bestStreak), 100);
            case 'bible_scholar':
                return Math.min(context.totalVersesRead, 1000);
            case 'daily_habit':
                return Math.min(Math.max(context.currentStreak, context.bestStreak), 3);
            case 'verse_collector':
                return Math.min(context.totalVersesRead, 50);
            case 'chapter_starter':
                return Math.min(context.totalChaptersRead, 1);
            case 'book_beginner':
                return Math.min(context.booksStarted, 1);
            case 'consistent_reader':
                return Math.min(Math.max(context.currentStreak, context.bestStreak), 14);
            case 'verse_master':
                return Math.min(context.totalVersesRead, 500);
            case 'testament_explorer':
                return Math.min(context.booksStarted, 10);
            default:
                return 0;
        }
    }

    /**
     * Initialize achievement progress for a specific user using database achievements via repository
     */
    private async initializeAchievementProgressForUser(userId: number): Promise<void> {
        try {
            // Get all active achievement IDs from database using repository
            const achievementIds = await achievementProgressRepository.getActiveAchievementIds();

            for (const achievementId of achievementIds) {
                const existingProgress = await achievementProgressRepository.findByUserIdAndAchievementId(userId, achievementId);

                if (!existingProgress) {
                    await achievementProgressRepository.create({
                        achievementId,
                        userId,
                        progress: 0,
                        isUnlocked: false
                    });
                }
            }
        } catch (error: any) {
            logger.warn('Failed to initialize achievements from database, using legacy method:', error);
            // Fallback to legacy initialization
            await this.initializeAchievements(userId);
        }
    }

    /**
     * Legacy achievement initialization for backward compatibility
     */
    private async initializeAchievements(userId: number): Promise<void> {
        const defaultAchievements = [
            'first_read', 'week_warrior', 'century_reader', 'month_master',
            'chapter_champion', 'book_explorer', 'dedication', 'bible_scholar',
            'daily_habit', 'verse_collector', 'chapter_starter', 'book_beginner',
            'consistent_reader', 'verse_master', 'testament_explorer'
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

        const readingDates = new Set<string>();

        // Add dates from verse progress
        verseProgress
            .filter(p => p.isRead)
            .forEach(p => readingDates.add(p.dateRead));

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
