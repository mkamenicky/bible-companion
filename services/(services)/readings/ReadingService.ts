import {
    bibleBookTopicsRepository,
    dailyReadingAssignmentsRepository,
    readingPlanConfigRepository,
    readingPreferencesRepository,
    readingTopicsRepository
} from '@/repository';
import type {
    AchievementUnlockEvent,
    BibleChapterInfo,
    DailyReadingAssignment,
    EnhancedDailyReadingAssignment,
    ReadingPlanConfig,
} from '@/models';
import {DatabaseError} from '@/errors';
import {BibleStructure, bibleService} from '@/services/(services)/bible/BibleService';
import {progressService} from '@/services/(services)/progress/ProgressService';
import {toLocalDateString} from '@/utils/(utils)/date.utils';
import {logger} from '@/utils/(utils)/logger';

const USER_ID = 1;
const DEFAULT_DAILY_VERSE_GOAL = 10;
/** Upper bound of separate passages created for a single day's goal. */
const MAX_RANGES_PER_REQUEST = 10;
/** Rough reading speed used for the "x min" hint. */
const MINUTES_PER_VERSE = 0.5;

/** A passage inside one chapter (verse ids, both inclusive). */
export interface VerseRange {
    chapterId: number;
    startVerseId: number;
    endVerseId: number;
}

/** What today's reading is taken from. */
interface PlanScope {
    /** Card title, also stored with the assignment. */
    title: string;
    /** Books to read through, in reading order. */
    bookIds: number[];
}

/**
 * Picks the next passages to read.
 *
 * Walks through the chapters in order and collects stretches of verses that
 * are still free (not read and not already assigned today) until `verseGoal`
 * verses are found. A passage never crosses a chapter boundary.
 *
 * @param chapters   chapters to read through, in reading order
 * @param isTaken    true for verses to skip
 * @param verseGoal  number of verses wanted
 */
export function planNextRanges(
    chapters: BibleChapterInfo[],
    isTaken: (verseId: number) => boolean,
    verseGoal: number
): VerseRange[] {
    const ranges: VerseRange[] = [];
    let remaining = verseGoal;

    for (const chapter of chapters) {
        let rangeStart: number | null = null;

        const closeRange = (endVerseId: number) => {
            if (rangeStart === null) return;
            ranges.push({chapterId: chapter.id, startVerseId: rangeStart, endVerseId});
            rangeStart = null;
        };

        for (let verseId = chapter.firstVerseId; verseId <= chapter.lastVerseId; verseId++) {
            if (isTaken(verseId)) {
                closeRange(verseId - 1);
                continue;
            }

            if (rangeStart === null) {
                if (ranges.length >= MAX_RANGES_PER_REQUEST) return ranges;
                rangeStart = verseId;
            }

            remaining -= 1;
            if (remaining <= 0) {
                closeRange(verseId);
                return ranges;
            }
        }

        closeRange(chapter.lastVerseId);
    }

    return ranges;
}

/**
 * The daily reading plan: decides what to read on a day and records when an
 * assignment is checked off.
 *
 * The plan has no position of its own. "What comes next" is always the first
 * verses of the plan's books that are not read yet, so it automatically
 * respects everything marked in the Bible overview as well.
 */
export class ReadingService {

    /**
     * Returns the reading assignments of a day, creating them on first request.
     */
    async getAssignmentsForDate(date: Date = new Date()): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateString = toLocalDateString(date);
            const scope = await this.getPlanScope(date);
            let assignments = await dailyReadingAssignmentsRepository.findByDate(dateString);

            // Nothing planned for today's topic yet (first visit today, or the
            // plan/topic differs from what was stored for this date).
            if (!assignments.some(assignment => assignment.display_title === scope.title)) {
                await this.createAssignments(dateString, scope, assignments);
                assignments = await dailyReadingAssignmentsRepository.findByDate(dateString);
            }

            return await this.enhance(assignments);
        } catch (error) {
            throw new DatabaseError('Failed to load reading assignments', error);
        }
    }

    /**
     * "Read more": adds the next passages for the day on top of the existing ones.
     * @returns the newly created assignments (empty when nothing is left)
     */
    async addMoreAssignments(date: Date = new Date()): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateString = toLocalDateString(date);
            const scope = await this.getPlanScope(date);
            const existing = await dailyReadingAssignmentsRepository.findByDate(dateString);

            const created = await this.createAssignments(dateString, scope, existing);
            return await this.enhance(created);
        } catch (error) {
            throw new DatabaseError('Failed to add reading assignments', error);
        }
    }

    /** Checks an assignment off and records its verses as read today. */
    async completeAssignment(assignment: DailyReadingAssignment): Promise<AchievementUnlockEvent[]> {
        const today = toLocalDateString();

        const unlockedEvents = await progressService.markVersesRead(
            assignment.start_verse_id, assignment.end_verse_id, 'plan', today
        );
        await dailyReadingAssignmentsRepository.setCompleted(assignment.id, today);

        return unlockedEvents;
    }

    /** Reverts completeAssignment. Readings of the verses on other days are kept. */
    async reopenAssignment(assignment: DailyReadingAssignment): Promise<void> {
        const completedOn = assignment.completed_at ?? assignment.date;

        await dailyReadingAssignmentsRepository.setCompleted(assignment.id, null);
        await progressService.unmarkVerses(assignment.start_verse_id, assignment.end_verse_id, completedOn);
    }

    /** The user's daily verse goal. */
    async getDailyVerseGoal(): Promise<number> {
        const preferences = await readingPreferencesRepository.findByUserId(USER_ID);
        const goal = preferences?.dailyVerseGoal;
        return typeof goal === 'number' && goal > 0 ? goal : DEFAULT_DAILY_VERSE_GOAL;
    }

    // ========================================
    // PLANNING
    // ========================================

    /** Creates assignments for the day's goal and returns the new rows. */
    private async createAssignments(
        dateString: string,
        scope: PlanScope,
        existing: DailyReadingAssignment[]
    ): Promise<DailyReadingAssignment[]> {
        const [structure, readIds, verseGoal, plan] = await Promise.all([
            bibleService.getStructure(),
            progressService.getReadVerseIds(),
            this.getDailyVerseGoal(),
            this.getActivePlan(),
        ]);

        const chapters = scope.bookIds.flatMap(bookId => structure.chaptersByBook.get(bookId) ?? []);
        const isAssignedToday = (verseId: number) =>
            existing.some(assignment => verseId >= assignment.start_verse_id && verseId <= assignment.end_verse_id);

        let ranges = planNextRanges(chapters, verseId => readIds.has(verseId) || isAssignedToday(verseId), verseGoal);

        // Everything in scope has been read: start over from the beginning.
        if (ranges.length === 0) {
            ranges = planNextRanges(chapters, isAssignedToday, verseGoal);
        }

        const created: DailyReadingAssignment[] = [];
        for (const range of ranges) {
            created.push(await dailyReadingAssignmentsRepository.create({
                date: dateString,
                plan_name: plan.plan_name,
                chapter_id: range.chapterId,
                start_verse_id: range.startVerseId,
                end_verse_id: range.endVerseId,
                display_title: scope.title,
                is_completed: false,
            }));
        }
        return created;
    }

    /** Which books today's reading comes from, depending on the active plan. */
    private async getPlanScope(date: Date): Promise<PlanScope> {
        const plan = await this.getActivePlan();
        const structure = await bibleService.getStructure();
        const allBookIds = structure.books.map(book => book.id);

        if (plan.plan_type === 'topical') {
            // reading_topics.day_of_week counts from Sunday: Sunday = 1 (The Law),
            // Monday = 2 (Historical Books) ... Saturday = 7 (Letters). This is
            // the schedule the app has always used; changing it would move
            // every user's topics to a different weekday.
            const weekday = date.getDay() + 1;
            const [topic] = await readingTopicsRepository.findByDayOfWeek(weekday);

            if (topic) {
                const topicBooks = await bibleBookTopicsRepository.findByTopicId(topic.id);
                if (topicBooks.length > 0) {
                    return {title: topic.display_name, bookIds: topicBooks.map(entry => entry.bible_book_id)};
                }
            }
            logger.warn(`No reading topic configured for weekday ${weekday}, reading sequentially instead`);
        }

        // The app has no chronological ordering data, so 'chronological' reads
        // in canonical order like 'sequential'.
        return {
            title: plan.plan_type === 'chronological' ? 'Chronological Reading' : 'Sequential Reading',
            bookIds: allBookIds,
        };
    }

    private async getActivePlan(): Promise<ReadingPlanConfig> {
        const plans = await readingPlanConfigRepository.findAll();
        const active = plans.find(plan => plan.is_active);
        if (active) return active;

        const fallback = plans.find(plan => plan.plan_type === 'sequential');
        if (fallback) {
            return readingPlanConfigRepository.update({id: fallback.id, is_active: true});
        }
        return readingPlanConfigRepository.create({
            plan_name: 'Sequential Reading', plan_type: 'sequential', is_active: true,
        });
    }

    // ========================================
    // PRESENTATION
    // ========================================

    /** Adds book name, chapter and verse numbers for display. */
    private async enhance(assignments: DailyReadingAssignment[]): Promise<EnhancedDailyReadingAssignment[]> {
        const structure = await bibleService.getStructure();
        return Promise.all(assignments.map(assignment => this.enhanceOne(assignment, structure)));
    }

    private async enhanceOne(
        assignment: DailyReadingAssignment,
        structure: BibleStructure
    ): Promise<EnhancedDailyReadingAssignment> {
        const versesInRange = assignment.end_verse_id - assignment.start_verse_id + 1;
        const base: EnhancedDailyReadingAssignment = {
            ...assignment,
            localized_title: assignment.display_title,
            verses_in_range: versesInRange,
            estimated_reading_time: Math.ceil(versesInRange * MINUTES_PER_VERSE),
        };

        const chapter = structure.chaptersById.get(assignment.chapter_id)
            ?? bibleService.findChapterOfVerse(structure, assignment.start_verse_id);
        const book = chapter ? structure.booksById.get(chapter.bookId) : undefined;
        if (!chapter || !book) return base;

        const verseNumbers = await bibleService.getVerseNumbers(chapter);
        const endNumber = verseNumbers.get(assignment.end_verse_id) ?? 1;
        // A passage that starts with a psalm's superscription (number 0) is
        // shown as starting at verse 1, like a printed citation.
        const startNumber = Math.min(Math.max(verseNumbers.get(assignment.start_verse_id) ?? 1, 1), Math.max(endNumber, 1));

        return {
            ...base,
            localized_title: bibleService.getBookName(book),
            book_name: bibleService.getBookName(book),
            chapter_number: chapter.chapterNumber,
            start_verse_title: String(startNumber),
            end_verse_title: String(Math.max(endNumber, 1)),
        };
    }
}

export const readingService = new ReadingService();
