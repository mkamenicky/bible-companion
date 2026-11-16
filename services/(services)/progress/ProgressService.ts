import {achievementProgressRepository, bibleVerseProgressRepository, readingStreakRepository} from '@/repository';
import {bibleService} from '@/services/(services)/bible/BibleService';
import {consistencyService} from '@/services/(services)/consistency/ConsistencyService';
import type {
    Achievement,
    AchievementStats,
    AchievementUnlockEvent,
    BibleChapterInfo,
    BibleProgressSummary,
    BookProgress,
    ChapterProgress,
    ConsistencyOverview,
    HabitId,
    PeriodStats,
    ProgressSource,
    ProgressStats,
    StreakInfo,
    VerseState,
} from '@/models';
import {ValidationError} from '@/errors';
import {diffInDays, getMondayOfWeek, toLocalDateString} from '@/utils/(utils)/date.utils';
import {logger} from '@/utils/(utils)/logger';

/** The app is single-user; the schema merely allows for more. */
const USER_ID = 1;

type ChangeListener = () => void;

export interface StreakCalculation {
    currentStreak: number;
    longestStreak: number;
    longestStreakStartDate: string | null;
    longestStreakEndDate: string | null;
    lastReadingDate: string | null;
    readToday: boolean;
}

/**
 * Derives streaks from the list of days on which something was read.
 *
 * The streak is always computed from the reading days themselves instead of
 * being counted up and down in a table, so it cannot drift out of sync.
 *
 * @param readingDates distinct days (YYYY-MM-DD), sorted ascending
 * @param today        today's date (YYYY-MM-DD)
 */
export function calculateStreak(readingDates: string[], today: string): StreakCalculation {
    let longest = 0;
    let longestStart: string | null = null;
    let longestEnd: string | null = null;
    let run = 0;
    let runStart: string | null = null;

    readingDates.forEach((date, index) => {
        const continuesRun = index > 0 && diffInDays(readingDates[index - 1], date) === 1;
        if (continuesRun) {
            run += 1;
        } else {
            run = 1;
            runStart = date;
        }

        if (run > longest) {
            longest = run;
            longestStart = runStart;
            longestEnd = date;
        }
    });

    const lastReadingDate = readingDates.length > 0 ? readingDates[readingDates.length - 1] : null;
    const daysSinceLastReading = lastReadingDate ? diffInDays(lastReadingDate, today) : Number.POSITIVE_INFINITY;

    return {
        // Still alive if the last reading was today or yesterday (today can
        // still be read); otherwise the streak is broken.
        currentStreak: daysSinceLastReading <= 1 ? run : 0,
        longestStreak: longest,
        longestStreakStartDate: longestStart,
        longestStreakEndDate: longestEnd,
        lastReadingDate,
        readToday: daysSinceLastReading === 0,
    };
}

/**
 * Everything about what has been read: marking verses, Bible progress,
 * streaks, period statistics and achievements.
 *
 * This is the only place that changes the read-state. After every change it
 * refreshes the achievements and notifies listeners (used to keep the
 * reminder notifications in sync with the real progress).
 */
export class ProgressService {
    private readonly listeners = new Set<ChangeListener>();
    private achievementQueue: Promise<unknown> = Promise.resolve();

    /** Subscribes to read-state changes. Returns the unsubscribe function. */
    addChangeListener(listener: ChangeListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    // ========================================
    // CHANGING THE READ-STATE
    // ========================================

    /**
     * Marks a verse range as read.
     *
     * @param source 'plan' records a reading on `date` even for verses read
     *               before; 'manual' and 'backfill' only fill in verses that
     *               are still unread.
     * @param date   day of reading (YYYY-MM-DD), defaults to today
     * @returns achievements unlocked by this change
     */
    async markVersesRead(
        firstVerseId: number,
        lastVerseId: number,
        source: ProgressSource,
        date: string = toLocalDateString()
    ): Promise<AchievementUnlockEvent[]> {
        this.validateRange(firstVerseId, lastVerseId);
        await bibleVerseProgressRepository.markRange(firstVerseId, lastVerseId, date, source, source !== 'plan');
        return this.afterChange();
    }

    /**
     * Removes read marks from a verse range.
     *
     * @param date when given, only the marks of that day are removed (undoing
     *             a daily assignment keeps earlier readings); otherwise the
     *             verses become unread.
     */
    async unmarkVerses(firstVerseId: number, lastVerseId: number, date?: string): Promise<void> {
        this.validateRange(firstVerseId, lastVerseId);
        if (date) {
            await bibleVerseProgressRepository.deleteRangeOnDate(firstVerseId, lastVerseId, date);
        } else {
            await bibleVerseProgressRepository.deleteRange(firstVerseId, lastVerseId);
        }
        await this.afterChange();
    }

    // ========================================
    // BIBLE PROGRESS
    // ========================================

    /** Ids of all verses read at least once (optionally within a range). */
    async getReadVerseIds(firstVerseId?: number, lastVerseId?: number): Promise<Set<number>> {
        return new Set(await bibleVerseProgressRepository.findReadVerseIds(firstVerseId, lastVerseId));
    }

    /** Reading progress of every book, in canonical order. */
    async getBooksProgress(): Promise<BookProgress[]> {
        const [structure, readIds] = await Promise.all([bibleService.getStructure(), this.getReadVerseIds()]);

        return structure.books.map(book => {
            const chapters = structure.chaptersByBook.get(book.id) ?? [];
            let totalVerses = 0;
            let readVerses = 0;
            let completedChapters = 0;

            for (const chapter of chapters) {
                const readInChapter = countReadInChapter(chapter, readIds);
                totalVerses += chapter.verseCount;
                readVerses += readInChapter;
                if (readInChapter === chapter.verseCount) completedChapters += 1;
            }

            return {
                book,
                name: bibleService.getBookName(book),
                totalVerses,
                readVerses,
                totalChapters: chapters.length,
                completedChapters,
            };
        });
    }

    /** Reading progress of every chapter of one book. */
    async getChaptersProgress(bookId: number): Promise<ChapterProgress[]> {
        const structure = await bibleService.getStructure();
        const book = structure.booksById.get(bookId);
        if (!book) return [];

        const readIds = await this.getReadVerseIds(book.firstVerseId, book.lastVerseId);
        return (structure.chaptersByBook.get(bookId) ?? []).map(chapter => ({
            chapter,
            totalVerses: chapter.verseCount,
            readVerses: countReadInChapter(chapter, readIds),
        }));
    }

    /** All verses of a chapter with their number and read-state. */
    async getVerseStates(chapter: BibleChapterInfo): Promise<VerseState[]> {
        const [numbers, readIds] = await Promise.all([
            bibleService.getVerseNumbers(chapter),
            this.getReadVerseIds(chapter.firstVerseId, chapter.lastVerseId),
        ]);

        const verses: VerseState[] = [];
        for (let id = chapter.firstVerseId; id <= chapter.lastVerseId; id++) {
            verses.push({
                id,
                number: numbers.get(id) ?? id - chapter.firstVerseId + 1,
                isRead: readIds.has(id),
            });
        }
        return verses;
    }

    /** Totals over the whole Bible. */
    async getBibleSummary(): Promise<BibleProgressSummary> {
        const books = await this.getBooksProgress();

        return books.reduce<BibleProgressSummary>((summary, book) => ({
            totalVerses: summary.totalVerses + book.totalVerses,
            readVerses: summary.readVerses + book.readVerses,
            totalChapters: summary.totalChapters + book.totalChapters,
            completedChapters: summary.completedChapters + book.completedChapters,
            totalBooks: summary.totalBooks + 1,
            booksStarted: summary.booksStarted + (book.readVerses > 0 ? 1 : 0),
            booksCompleted: summary.booksCompleted + (book.totalVerses > 0 && book.readVerses === book.totalVerses ? 1 : 0),
        }), {
            totalVerses: 0,
            readVerses: 0,
            totalChapters: 0,
            completedChapters: 0,
            totalBooks: 0,
            booksStarted: 0,
            booksCompleted: 0,
        });
    }

    // ========================================
    // STREAK AND STATISTICS
    // ========================================

    async getStreak(): Promise<StreakInfo> {
        const dailyCounts = await bibleVerseProgressRepository.findDailyCounts();
        const calculation = calculateStreak(dailyCounts.map(day => day.date), toLocalDateString());
        const stored = await readingStreakRepository.findByUserId(USER_ID);

        return {
            currentStreak: calculation.currentStreak,
            // The stored record may remember a longer streak than the data
            // still shows (e.g. after verses were unmarked).
            longestStreak: Math.max(calculation.longestStreak, stored?.longestStreak ?? 0),
            lastReadingDate: calculation.lastReadingDate,
            readToday: calculation.readToday,
            totalReadingDays: dailyCounts.length,
        };
    }

    /** Verses read today / this week / this month / this year. */
    async getPeriodStats(): Promise<PeriodStats> {
        const now = new Date();
        const today = toLocalDateString(now);
        const year = today.slice(0, 4);
        const month = today.slice(0, 7);

        const [todayCount, thisWeek, thisMonth, thisYear] = await Promise.all([
            bibleVerseProgressRepository.countReadBetween(today, today),
            bibleVerseProgressRepository.countReadBetween(getMondayOfWeek(now), today),
            bibleVerseProgressRepository.countReadBetween(`${month}-01`, today),
            bibleVerseProgressRepository.countReadBetween(`${year}-01-01`, today),
        ]);

        return {today: todayCount, thisWeek, thisMonth, thisYear};
    }

    async getProgressStats(): Promise<ProgressStats> {
        const [streak, summary, periods] = await Promise.all([
            this.getStreak(),
            this.getBibleSummary(),
            this.getPeriodStats(),
        ]);

        const percentage = summary.totalVerses > 0 ? (summary.readVerses / summary.totalVerses) * 100 : 0;

        return {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            totalReadingDays: streak.totalReadingDays,
            totalVersesRead: summary.readVerses,
            chaptersCompleted: summary.completedChapters,
            bibleProgressPercentage: Math.round(Math.min(percentage, 100) * 100) / 100,
            weeklyVersesRead: periods.thisWeek,
            monthlyVersesRead: periods.thisMonth,
        };
    }

    /** Verses read per day of a year, for the calendar. */
    async getReadingActivity(year: number = new Date().getFullYear()): Promise<Map<string, number>> {
        const days = await bibleVerseProgressRepository.findDailyCounts(`${year}-01-01`, `${year}-12-31`);
        return new Map(days.map(day => [day.date, day.count]));
    }

    // ========================================
    // ACHIEVEMENTS
    // ========================================

    /**
     * Recalculates the progress of all achievements.
     * @returns the achievements that were unlocked by this recalculation
     */
    updateAchievementProgress(): Promise<AchievementUnlockEvent[]> {
        // Runs are queued: two overlapping runs would both see an achievement
        // as "not yet unlocked" and report it twice.
        const run = this.achievementQueue.then(
            () => this.recalculateAchievements(),
            () => this.recalculateAchievements()
        );
        this.achievementQueue = run.catch(() => undefined);
        return run;
    }

    getAchievements(): Promise<Achievement[]> {
        return achievementProgressRepository.getAchievementsWithProgress(USER_ID);
    }

    getAchievementStats(): Promise<AchievementStats> {
        return achievementProgressRepository.getAchievementStats(USER_ID);
    }

    private async recalculateAchievements(): Promise<AchievementUnlockEvent[]> {
        const [achievements, rules, summary, streak, consistency] = await Promise.all([
            achievementProgressRepository.getAchievementsWithProgress(USER_ID),
            achievementProgressRepository.getAllAchievementRules(),
            this.getBibleSummary(),
            this.getStreak(),
            consistencyService.getOverview(),
        ]);

        const unlockedEvents: AchievementUnlockEvent[] = [];
        const now = new Date().toISOString();

        for (const achievement of achievements) {
            let value = 0;
            for (const rule of rules.filter(candidate => candidate.achievement_id === achievement.id)) {
                value = Math.max(value, await this.evaluateRule(rule, summary, streak, consistency));
            }

            // Once unlocked, an achievement stays unlocked, even if verses are
            // unmarked again later.
            const isUnlocked = achievement.unlocked || value >= achievement.targetValue;
            const progress = isUnlocked ? achievement.targetValue : Math.max(0, Math.min(value, achievement.targetValue));
            const newlyUnlocked = isUnlocked && !achievement.unlocked;

            if (progress === achievement.progress && !newlyUnlocked) continue;

            await achievementProgressRepository.saveProgress(
                USER_ID, achievement.id, progress, isUnlocked, newlyUnlocked ? now : null
            );

            if (newlyUnlocked) {
                unlockedEvents.push({
                    userId: USER_ID,
                    achievementId: achievement.id,
                    achievementName: achievement.name,
                    unlockedAt: now,
                    previousProgress: achievement.progress,
                    newProgress: progress,
                    isFirstTime: true,
                });
            }
        }

        return unlockedEvents;
    }

    private async evaluateRule(
        rule: { rule_type: string; calculation_query: string | null },
        summary: BibleProgressSummary,
        streak: StreakInfo,
        consistency: ConsistencyOverview
    ): Promise<number> {
        const habit = (id: HabitId) => consistency.habits.find(entry => entry.id === id);

        switch (rule.rule_type) {
            case 'total_verses':
                return summary.readVerses;
            case 'consecutive_days':
                return Math.max(streak.currentStreak, streak.longestStreak);
            case 'chapters_read':
                return summary.completedChapters;
            case 'books_started':
                return summary.booksStarted;
            case 'books_completed':
                return summary.booksCompleted;
            case 'reading_days_total':
                return streak.totalReadingDays;
            case 'daily_text_streak':
                return habit('dailyText')?.bestStreak ?? 0;
            case 'daily_text_total':
                return habit('dailyText')?.totalCompletions ?? 0;
            case 'family_worship_streak':
                return habit('familyWorship')?.bestStreak ?? 0;
            case 'family_worship_total':
                return habit('familyWorship')?.totalCompletions ?? 0;
            case 'meeting_prep_streak':
                return consistency.meetingPreparation.bestStreak;
            case 'perfect_week_streak':
                return consistency.perfectWeeks.bestStreak;
            case 'perfect_week_total':
                return consistency.perfectWeeks.total;
            case 'custom':
                if (!rule.calculation_query) return 0;
                try {
                    return await achievementProgressRepository.runCustomRuleQuery(rule.calculation_query);
                } catch (error) {
                    logger.warn('Custom achievement rule failed', error);
                    return 0;
                }
            default:
                return 0;
        }
    }

    // ========================================
    // INTERNALS
    // ========================================

    private async afterChange(): Promise<AchievementUnlockEvent[]> {
        let unlockedEvents: AchievementUnlockEvent[] = [];

        // The verses are already saved at this point. Problems in the
        // follow-up bookkeeping must not make the marking itself look failed.
        try {
            await this.storeStreak();
            unlockedEvents = await this.updateAchievementProgress();
        } catch (error) {
            logger.error('Failed to update progress after a change', error);
        }

        this.listeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                logger.error('Progress change listener failed', error);
            }
        });

        return unlockedEvents;
    }

    /** Keeps the reading_streaks table up to date (it remembers the record). */
    private async storeStreak(): Promise<void> {
        const dailyCounts = await bibleVerseProgressRepository.findDailyCounts();
        const calculation = calculateStreak(dailyCounts.map(day => day.date), toLocalDateString());
        const stored = await readingStreakRepository.findByUserId(USER_ID);

        const isNewRecord = calculation.longestStreak >= (stored?.longestStreak ?? 0);
        const values = {
            currentStreak: calculation.currentStreak,
            longestStreak: Math.max(calculation.longestStreak, stored?.longestStreak ?? 0),
            lastReadingDate: calculation.lastReadingDate ?? stored?.lastReadingDate ?? toLocalDateString(),
            longestStreakStartDate: (isNewRecord ? calculation.longestStreakStartDate : stored?.longestStreakStartDate) ?? '',
            longestStreakEndDate: (isNewRecord ? calculation.longestStreakEndDate : stored?.longestStreakEndDate) ?? '',
        };

        if (stored) {
            await readingStreakRepository.update({id: stored.id, ...values});
        } else {
            await readingStreakRepository.create({userId: USER_ID, ...values});
        }
    }

    private validateRange(firstVerseId: number, lastVerseId: number): void {
        const valid = Number.isInteger(firstVerseId) && Number.isInteger(lastVerseId)
            && firstVerseId >= 0 && lastVerseId >= firstVerseId;
        if (!valid) {
            throw new ValidationError(`Invalid verse range: ${firstVerseId}-${lastVerseId}`);
        }
    }
}

function countReadInChapter(chapter: BibleChapterInfo, readIds: Set<number>): number {
    if (readIds.size === 0) return 0;

    let count = 0;
    for (let id = chapter.firstVerseId; id <= chapter.lastVerseId; id++) {
        if (readIds.has(id)) count += 1;
    }
    return count;
}

export const progressService = new ProgressService();
