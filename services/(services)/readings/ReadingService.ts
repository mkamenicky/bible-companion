import {
    BibleBook,
    BibleBookTopic,
    BibleChapter,
    DailyReadingAssignment,
    EnhancedDailyReadingAssignment,
    ReadingPlan,
    ReadingPlanProgress,
    ReadingPreferences,
    ReadingTopic
} from "@/models";
import {DatabaseMessageError, ValidationError} from '@/errors';
import {
    bibleBookRepository,
    bibleBookTopicsRepository,
    bibleChapterRepository,
    bibleVerseProgressRepository,
    bibleVerseRepository,
    dailyReadingAssignmentsRepository,
    readingPlanConfigRepository,
    readingPlanProgressRepository,
    readingPreferencesRepository,
    readingTopicsRepository
} from '@/repository'
import {localizationService, SupportedLanguage} from "@/services/(services)/localization/localization.service";
import {logger} from "@/utils/(utils)/logger";

export type Languages = "english" | "german" | "japanese";

interface ReadingPosition {
    bookIndex: number;
    chapterId: number | undefined;
    verseId: number | undefined;
    allBooks: BibleBook[];
    allChapters: BibleChapter[];
}

interface AssignmentContext {
    plan: any;
    date: Date;
    progress: ReadingPlanProgress;
    preferences: ReadingPreferences;
    existingAssignments?: DailyReadingAssignment[];
    currentTopic?: ReadingTopic;
}

export class ReadingService {
    private static bookCache: BibleBook[] | null = null;
    private static chapterCache: BibleChapter[] | null = null;
    private static cacheTimestamp: number = 0;
    private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // ========================================
    // PUBLIC API METHODS
    // ========================================

    async fetchReadingAssignments(date: Date, language?: SupportedLanguage): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateStr = this.formatDate(date);
            const existingAssignments = await this.getExistingAssignments(dateStr);
            const activePlan = await this.getActiveReadingPlan();
            console.info("active:", date, existingAssignments, activePlan);
            if (activePlan?.plan_type === 'topical') {
                const dayOfWeek = this.getDayOfWeek(date);
                const todaysTopic = await this.getTodaysTopic(dayOfWeek);
                console.info("todaysTopic:", todaysTopic);
                if (existingAssignments.length > 0) {
                    const hasMatchingTopic = existingAssignments.some(assignment => assignment.display_title === todaysTopic?.display_name);

                    if (!hasMatchingTopic) {
                        const newAssignments = await this.generateAssignmentsByType(activePlan, date);
                        const savedAssignments = await this.saveAssignments(newAssignments, dateStr, activePlan.plan_name);
                        return await this.mapToEnhancedReadingAssignments(savedAssignments, language);
                    }

                    return await this.mapToEnhancedReadingAssignments(existingAssignments, language);
                }
            } else if (existingAssignments.length > 0) {
                return await this.mapToEnhancedReadingAssignments(existingAssignments, language);
            }

            if (!activePlan) {
                throw new Error('No active reading plan found');
            }

            const newAssignments = await this.generateAssignmentsByType(activePlan, date);
            const savedAssignments = await this.saveAssignments(newAssignments, dateStr, activePlan.plan_name);

            return await this.mapToEnhancedReadingAssignments(savedAssignments, language);

        } catch (error: any) {
            console.error(error);
            throw new DatabaseMessageError(`Failed to fetch reading assignments`, error as Error);
        }
    }

    async generateAdditionalAssignments(date: Date): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateStr = this.formatDate(date);
            const activePlan = await this.getActiveReadingPlan();
            if (!activePlan) {
                throw new Error('No active reading plan found');
            }

            const existingAssignments = await this.getExistingAssignmentsByDate(dateStr);

            // Try to extend incomplete assignments first
            const incompleteAssignments = existingAssignments.filter(a => !a.is_completed);
            if (incompleteAssignments.length > 0) {
                const assignmentToExtend = incompleteAssignments.sort((a, b) => b.end_verse_id - a.end_verse_id)[0];
                const extendedAssignment = await this.extendExistingAssignment(assignmentToExtend);

                if (extendedAssignment) {
                    return await this.mapToEnhancedReadingAssignments([extendedAssignment]);
                }
            }

            // Create new assignments if all are completed or extension failed
            const continuationPoint = await this.findContinuationPoint(existingAssignments, activePlan);
            const currentTopic = activePlan.plan_type === 'topical' ? await this.getTodaysTopic(this.getDayOfWeek(date)) : undefined;

            const newAssignments = await this.generateNonOverlappingAssignments(activePlan, date, continuationPoint, existingAssignments, currentTopic);

            if (newAssignments.length === 0) {
                return [];
            }

            const savedAssignments = await this.saveAssignments(newAssignments, dateStr, activePlan.plan_name);
            return await this.mapToEnhancedReadingAssignments(savedAssignments);

        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to generate additional assignments`, error as Error);
        }
    }

    private getDayOfWeek(date: Date) {
        console.log(date)
        return date.getDay() + 1;
    }

    async markVerseAsRead(bibleVerseId: number, date: Date = new Date()): Promise<void> {
        this.validateInput(bibleVerseId, 'number', 'bibleVerseId');
        this.validateInput(date, 'date', 'date');

        const dateStr = this.formatDate(date);

        try {
            const allProgress = await bibleVerseProgressRepository.findAll();
            const existingProgress = allProgress.find(p => p.bibleVerseId === bibleVerseId && p.dateRead === dateStr);

            if (existingProgress) {
                if (!existingProgress.isRead) {
                    await bibleVerseProgressRepository.update({id: existingProgress.id, isRead: true});
                }
            } else {
                await bibleVerseProgressRepository.create({bibleVerseId, dateRead: dateStr, isRead: true});
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to mark verse as read: ${bibleVerseId}`, error as Error);
        }
    }

    async markDailyReadingAssignmentAsRead(dailyReadingAssignment: DailyReadingAssignment, date: Date = new Date(), isRead: boolean = true): Promise<void> {
        this.validateInput(date, 'date', 'date');

        try {
            const dateStr = this.formatDate(date);
            const readAssignments = await dailyReadingAssignmentsRepository.findAll();

            // Find existing assignment by ID or verse range
            let existingAssignment = readAssignments.find(a => a.id === dailyReadingAssignment.id) || readAssignments.find(a => a.start_verse_id === dailyReadingAssignment.start_verse_id && a.end_verse_id === dailyReadingAssignment.end_verse_id && a.date === dateStr);

            if (existingAssignment) {
                await dailyReadingAssignmentsRepository.update({
                    id: existingAssignment.id,
                    chapter_id: existingAssignment.chapter_id,
                    is_completed: isRead,
                    completed_at: isRead ? dateStr : undefined
                });
            } else {
                await dailyReadingAssignmentsRepository.create({
                    date: dateStr,
                    plan_name: dailyReadingAssignment.plan_name || "chronological",
                    chapter_id: dailyReadingAssignment.chapter_id,
                    start_verse_id: dailyReadingAssignment.start_verse_id,
                    end_verse_id: dailyReadingAssignment.end_verse_id,
                    display_title: dailyReadingAssignment.display_title || "Reading Assignment",
                    is_completed: isRead,
                    completed_at: isRead ? dateStr : undefined
                });
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to mark dailyReadingAssignment as read`, error as Error);
        }
    }

    async unmarkVerseAsRead(bibleVerseId: number): Promise<void> {
        this.validateInput(bibleVerseId, 'number', 'bibleVerseId');

        try {
            const allProgress = await bibleVerseProgressRepository.findAll();
            const progressToRemove = allProgress.filter(p => p.bibleVerseId === bibleVerseId);

            for (const progress of progressToRemove) {
                await bibleVerseProgressRepository.deleteById(progress.id);
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to unmark verse as read: ${bibleVerseId}`, error as Error);
        }
    }

    async getReadingPlan(): Promise<ReadingPlan[]> {
        try {
            const readingPlanConfigs = await readingPlanConfigRepository.findAll();
            let existingPlan = readingPlanConfigs.find(config => config.is_active);

            if (!existingPlan) {
                existingPlan = await readingPlanConfigRepository.create({
                    plan_name: "Sequential Reading", plan_type: "sequential", is_active: true
                });
            }

            return [{readingPlanConfig: existingPlan}];
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get reading plan', error as Error);
        }
    }

    // ========================================
    // PRIVATE CACHE METHODS
    // ========================================

    private async getCachedBooks(): Promise<BibleBook[]> {
        const now = Date.now();
        if (!ReadingService.bookCache || (now - ReadingService.cacheTimestamp) > ReadingService.CACHE_DURATION) {
            ReadingService.bookCache = await bibleBookRepository.findAll();
            ReadingService.cacheTimestamp = now;
        }
        return ReadingService.bookCache;
    }

    private async getCachedChapters(): Promise<BibleChapter[]> {
        const now = Date.now();
        if (!ReadingService.chapterCache || (now - ReadingService.cacheTimestamp) > ReadingService.CACHE_DURATION) {
            ReadingService.chapterCache = await bibleChapterRepository.findAll();
            ReadingService.cacheTimestamp = now;
        }
        return ReadingService.chapterCache;
    }

    // ========================================
    // PRIVATE CORE METHODS
    // ========================================

    private async extendExistingAssignment(assignment: DailyReadingAssignment): Promise<DailyReadingAssignment | null> {
        try {
            const preferences = await this.getUserPreferences();
            const additionalVerses = preferences.dailyVerseGoal || 10;

            const allChapters = await bibleChapterRepository.findAll();
            const currentChapter = allChapters.find(ch => ch.BibleChapterId === assignment.chapter_id);

            if (!currentChapter) {
                return null;
            }

            const maxVerseInChapter = currentChapter.LastVerseId || assignment.end_verse_id;
            const newEndVerseId = Math.min(assignment.end_verse_id + additionalVerses, maxVerseInChapter);

            if (newEndVerseId <= assignment.end_verse_id) {
                return null;
            }

            await dailyReadingAssignmentsRepository.update({
                id: assignment.id,
                chapter_id: assignment.chapter_id,
                start_verse_id: assignment.start_verse_id,
                end_verse_id: newEndVerseId,
                display_title: assignment.display_title,
                is_completed: assignment.is_completed,
                completed_at: assignment.completed_at || undefined,
            });

            return {...assignment, end_verse_id: newEndVerseId};
        } catch (error: any) {
            return null;
        }
    }

    private async findContinuationPoint(existingAssignments: DailyReadingAssignment[], activePlan: any): Promise<number> {
        if (existingAssignments.length === 0) {
            const progress = await this.getOrCreateProgress(activePlan.id);
            return progress.current_verse_id || 1;
        }

        const lastVerseRead = Math.max(...existingAssignments.map(a => a.end_verse_id));
        return lastVerseRead + 1;
    }

    private async generateNonOverlappingAssignments(activePlan: any, date: Date, startVerseId: number, existingAssignments: DailyReadingAssignment[], currentTopic?: ReadingTopic): Promise<DailyReadingAssignment[]> {
        const preferences = await this.getUserPreferences();
        const versesToRead = preferences.dailyVerseGoal || 10;

        const context: AssignmentContext = {
            plan: activePlan,
            date,
            progress: await this.getOrCreateProgress(activePlan.id),
            preferences,
            existingAssignments,
            currentTopic
        };

        const newAssignment = await this.generateSingleChapterAssignment(context, startVerseId, versesToRead);
        return [newAssignment];
    }

    private async generateAssignmentsByType(activePlan: any, date: Date, existingAssignments?: DailyReadingAssignment[]): Promise<DailyReadingAssignment[]> {
        const context: AssignmentContext = {
            plan: activePlan,
            date,
            progress: await this.getOrCreateProgress(activePlan.id),
            preferences: await this.getUserPreferences(),
            existingAssignments
        };

        switch (activePlan.plan_type) {
            case 'sequential':
            case 'chronological':
                return [await this.generateSequentialAssignment(context)];
            case 'topical':
                return await this.generateTopicalAssignment(context);
            default:
                throw new Error(`Unsupported plan type: ${activePlan.plan_type}`);
        }
    }

    private async generateSequentialAssignment(context: AssignmentContext): Promise<DailyReadingAssignment> {
        const {plan, date, progress, preferences, existingAssignments} = context;
        const versesToRead = preferences.dailyVerseGoal || 10;

        let startVerseId = progress.current_verse_id || 1;

        if (existingAssignments && existingAssignments.length > 0) {
            const lastAssignment = existingAssignments.sort((a, b) => b.end_verse_id - a.end_verse_id)[0];
            startVerseId = lastAssignment.end_verse_id + 1;
        }

        const assignment = await this.generateSingleChapterAssignment(context, startVerseId, versesToRead);

        await readingPlanProgressRepository.update({
            id: progress.id,
            current_verse_id: assignment.end_verse_id + 1,
            verses_read_today: (progress.verses_read_today || 0) + versesToRead,
            last_updated: new Date().toISOString()
        });

        return assignment;
    }

    private async generateTopicalAssignment(context: AssignmentContext): Promise<DailyReadingAssignment[]> {
        try {
            const {plan, date, preferences} = context;
            const dayOfWeek = this.getDayOfWeek(date);

            const todaysTopic = await this.getTodaysTopic(dayOfWeek);
            const booksForTopic = await this.getBooksForTopic(todaysTopic.id);
            const allBooks = await this.getCachedBooks();
            const allChapters = await this.getCachedChapters();

            const position: ReadingPosition = {
                bookIndex: 0, chapterId: undefined, verseId: undefined, allBooks, allChapters
            };

            const assignments = await this.generateAssignmentsForGoal(position, preferences.dailyVerseGoal || 10, plan.plan_name, date, todaysTopic, booksForTopic);

            return assignments;
        } catch (error) {
            throw error;
        }
    }

    private async generateSingleChapterAssignment(context: AssignmentContext, startVerseId: number, versesToRead: number): Promise<DailyReadingAssignment> {
        const {plan, date, currentTopic} = context;

        const startVerse = await bibleVerseRepository.findById(startVerseId);
        if (!startVerse) {
            throw new Error(`Could not find start verse: ${startVerseId}`);
        }

        const allChapters = await bibleChapterRepository.findAll();
        const startChapter = allChapters.find(ch => startVerseId >= (ch.FirstVerseId || 0) && startVerseId <= (ch.LastVerseId || 0));

        if (!startChapter) {
            throw new Error(`Could not find chapter for verse: ${startVerseId}`);
        }

        const maxVerseInChapter = startChapter.LastVerseId || startVerseId;
        const endVerseId = Math.min(startVerseId + versesToRead - 1, maxVerseInChapter);

        const endVerse = await bibleVerseRepository.findById(endVerseId);
        if (!endVerse) {
            throw new Error(`Could not find end verse: ${endVerseId}`);
        }

        const displayTitle = this.getDisplayTitle(plan.plan_type, currentTopic);

        return {
            id: 0,
            date: this.formatDate(date),
            plan_name: plan.plan_name,
            chapter_id: startChapter.BibleChapterId || 1,
            start_verse_id: startVerse.BibleVerseId,
            end_verse_id: endVerse.BibleVerseId,
            display_title: displayTitle,
            is_completed: false,
            completed_at: null
        };
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    private getLocalizedDisplayTitleColumn(language: string): string {
        const columnMap: Record<string, string> = {
            'en': 'ChapterDisplayTitle',
            'de': 'ChapterDisplayTitleGerman',
            'ja': 'ChapterDisplayTitleJapanese',
            'es': 'ChapterDisplayTitle',
            'fr': 'ChapterDisplayTitle',
            'zh': 'ChapterDisplayTitle'
        };

        return columnMap[language] || 'ChapterDisplayTitle';
    }

    private getDisplayTitle(planType: string, currentTopic?: ReadingTopic): string {
        if (planType === 'topical' && currentTopic) {
            return currentTopic.display_name;
        } else if (planType === 'sequential') {
            return 'Sequential Reading';
        } else if (planType === 'chronological') {
            return 'Chronological Reading';
        } else {
            return 'Reading Assignment';
        }
    }

    private async getExistingAssignments(dateStr: string): Promise<DailyReadingAssignment[]> {
        try {
            return await dailyReadingAssignmentsRepository.findWhere('date = ?', [dateStr]);
        } catch (error: any) {
            return [];
        }
    }

    private async getExistingAssignmentsByDate(dateStr: string): Promise<DailyReadingAssignment[]> {
        const allAssignments = await dailyReadingAssignmentsRepository.findAll();
        return allAssignments.filter(assignment => assignment.date === dateStr);
    }

    private async mapToEnhancedReadingAssignments(assignments: DailyReadingAssignment[], language?: SupportedLanguage): Promise<EnhancedDailyReadingAssignment[]> {
        const currentLanguage = language || localizationService.getCurrentLanguage();
        const titleColumn = this.getLocalizedDisplayTitleColumn(currentLanguage);

        const enhanced: EnhancedDailyReadingAssignment[] = [];

        for (const assignment of assignments) {
            try {
                const calculateVerseNumber = (verseId: number, chapter: BibleChapter): number => {
                    if (!chapter.FirstVerseId) return 1;
                    return (verseId - chapter.FirstVerseId) + 1;
                };

                const [bibleChapter] = await Promise.all([bibleChapterRepository.findById(assignment.chapter_id)]);
                // @ts-ignore
                const [book] = await Promise.all([bibleBookRepository.findById(bibleChapter.BookNumber)])

                const startVerseNumber = bibleChapter ? calculateVerseNumber(assignment.start_verse_id, bibleChapter) : 1;
                const endVerseNumber = bibleChapter ? calculateVerseNumber(assignment.end_verse_id, bibleChapter) : 1;

                enhanced.push({
                    ...assignment, // @ts-ignore
                    localized_title: book?.[titleColumn],
                    chapter_number: bibleChapter?.ChapterNumber,
                    start_verse_title: startVerseNumber.toString(),
                    end_verse_title: endVerseNumber.toString(),
                    verses_in_range: assignment.end_verse_id - assignment.start_verse_id + 1,
                    estimated_reading_time: Math.ceil((assignment.end_verse_id - assignment.start_verse_id + 1) * 0.5),
                });
            } catch (error) {
                // Fall back to original display title if localization fails
                enhanced.push({
                    ...assignment,
                    localized_title: assignment.display_title,
                    verses_in_range: assignment.end_verse_id - assignment.start_verse_id + 1,
                    estimated_reading_time: Math.ceil((assignment.end_verse_id - assignment.start_verse_id + 1) * 0.5),
                });
            }
        }

        return enhanced;
    }

    private async saveAssignments(assignments: DailyReadingAssignment[], dateStr: string, planName: string): Promise<DailyReadingAssignment[]> {
        const savedAssignments: DailyReadingAssignment[] = [];

        for (const assignment of assignments) {
            try {
                const existingAssignments = await dailyReadingAssignmentsRepository.findAll();
                const conflictingAssignment = existingAssignments.find(existing => existing.date === dateStr && existing.chapter_id === assignment.chapter_id && this.hasVerseOverlap(assignment, existing));

                if (conflictingAssignment) {
                    continue;
                }

                const savedAssignment = await dailyReadingAssignmentsRepository.create({
                    date: dateStr,
                    plan_name: planName,
                    chapter_id: assignment.chapter_id,
                    start_verse_id: assignment.start_verse_id,
                    end_verse_id: assignment.end_verse_id,
                    display_title: assignment.display_title,
                    is_completed: false,
                    completed_at: undefined
                });

                savedAssignments.push(savedAssignment);
            } catch (error: any) {
                // Continue with other assignments if one fails
            }
        }

        return savedAssignments;
    }

    private hasVerseOverlap(assignment: DailyReadingAssignment, existing: DailyReadingAssignment): boolean {
        return (assignment.start_verse_id >= existing.start_verse_id && assignment.start_verse_id <= existing.end_verse_id) || (assignment.end_verse_id >= existing.start_verse_id && assignment.end_verse_id <= existing.end_verse_id) || (assignment.start_verse_id <= existing.start_verse_id && assignment.end_verse_id >= existing.end_verse_id);
    }

    // ========================================
    // TOPICAL READING HELPERS
    // ========================================

    private async getCurrentReadingPosition(progress: ReadingPlanProgress, todaysTopic: ReadingTopic, booksForTopic: BibleBookTopic[], existingAssignments?: DailyReadingAssignment[]): Promise<ReadingPosition> {
        const [allBooks, allChapters] = await Promise.all([this.getCachedBooks(), this.getCachedChapters()]);

        let bookIndex = 0;
        let chapterId: number | undefined = undefined;
        let verseId: number | undefined = undefined;

        // First priority: Check existing assignments for TODAY'S TOPIC ONLY
        if (existingAssignments && existingAssignments.length > 0) {
            const topicBookIds = booksForTopic.map(bt => bt.bible_book_id);
            const relevantAssignments = existingAssignments.filter(assignment => {
                const chapter = allChapters.find(ch => ch.BibleChapterId === assignment.chapter_id);
                return chapter && topicBookIds.includes(<number>chapter.BookNumber);
            });

            if (relevantAssignments.length > 0) {
                const lastAssignment = relevantAssignments.sort((a, b) => b.end_verse_id - a.end_verse_id)[0];
                const nextVerseId = lastAssignment.end_verse_id + 1;

                const verse = await bibleVerseRepository.findById(nextVerseId);
                if (verse) {
                    const chapter = allChapters.find(ch => nextVerseId >= (ch.FirstVerseId || 0) && nextVerseId <= (ch.LastVerseId || 0));

                    if (chapter) {
                        const book = allBooks.find(b => b.BibleBookId === chapter.BookNumber);
                        if (book) {
                            const topicBookIndex = booksForTopic.findIndex(bt => bt.bible_book_id === book.BibleBookId);
                            if (topicBookIndex !== -1) {
                                bookIndex = topicBookIndex;
                                chapterId = chapter.BibleChapterId;
                                verseId = nextVerseId;
                            }
                        }
                    }
                }
            }
        }

        // Second priority: Check saved progress ONLY if it's the same topic
        if (verseId === undefined && progress.last_topic_id === todaysTopic.id && progress.current_book_id && progress.current_verse_id) {
            bookIndex = booksForTopic.findIndex(bt => bt.bible_book_id === progress.current_book_id);

            if (bookIndex !== -1) {
                verseId = progress.current_verse_id;

                const chaptersInCurrentBook = allChapters
                    .filter(ch => ch.BookNumber === booksForTopic[bookIndex].bible_book_id)
                    .sort((a, b) => (a.ChapterNumber || 0) - (b.ChapterNumber || 0));

                const currentChapter = chaptersInCurrentBook.find(ch => verseId! >= (ch.FirstVerseId || 0) && verseId! <= (ch.LastVerseId || 0));

                chapterId = currentChapter?.BibleChapterId || chaptersInCurrentBook[0]?.BibleChapterId || undefined;
            }
        }

        // Third priority: Start from the beginning of TODAY'S TOPIC
        if (verseId === undefined) {
            const firstBookForTopic = booksForTopic[0];
            if (firstBookForTopic) {
                bookIndex = 0;
                const chaptersInFirstBook = allChapters
                    .filter(ch => ch.BookNumber === firstBookForTopic.bible_book_id)
                    .sort((a, b) => (a.ChapterNumber || 0) - (b.ChapterNumber || 0));

                const firstChapter = chaptersInFirstBook[0];
                if (firstChapter) {
                    chapterId = firstChapter.BibleChapterId;
                    verseId = firstChapter.FirstVerseId;
                }
            }
        }

        return {bookIndex, chapterId, verseId, allBooks, allChapters};
    }

    private async generateAssignmentsForGoal(position: ReadingPosition, dailyVerseGoal: number, planName: string, date: Date, topic: ReadingTopic, booksForTopic: BibleBookTopic[]): Promise<DailyReadingAssignment[]> {
        const assignments: DailyReadingAssignment[] = [];
        let versesRemaining = dailyVerseGoal;

        while (versesRemaining > 0 && position.bookIndex < booksForTopic.length) {
            const assignment = await this.createSingleAssignment(position, versesRemaining, planName, date, topic, booksForTopic);

            if (!assignment) {
                position.bookIndex++;
                continue;
            }

            assignments.push(assignment);
            versesRemaining -= (assignment.end_verse_id + 1) - assignment.start_verse_id;

            if (assignments.length > 10) {
                break;
            }
        }

        return assignments;
    }

    private async createSingleAssignment(position: ReadingPosition, versesNeeded: number, planName: string, date: Date, topic: ReadingTopic, booksForTopic: BibleBookTopic[]): Promise<DailyReadingAssignment | null> {
        const currentBookTopic = booksForTopic[position.bookIndex];

        if (!currentBookTopic || !currentBookTopic.bible_book_id) {
            return null;
        }

        const currentBook = position.allBooks.find(b => b.BibleBookId === currentBookTopic.bible_book_id);

        if (!currentBook) {
            return null;
        }

        const chaptersInBook = position.allChapters
            .filter(ch => ch.BookNumber === currentBookTopic.bible_book_id)
            .sort((a, b) => (a.ChapterNumber || 0) - (b.ChapterNumber || 0));

        if (chaptersInBook.length === 0) {
            return null;
        }

        const startPosition = this.getStartPosition(position, chaptersInBook);

        if (!startPosition) {
            return null;
        }

        const readingRange = this.calculateReadingRange(startPosition, versesNeeded, chaptersInBook, position);

        if (readingRange.startVerseId <= 0 || readingRange.endVerseId <= 0) {
            throw new Error(`Invalid verse IDs: start=${readingRange.startVerseId}, end=${readingRange.endVerseId}. Must be positive.`);
        }

        try {
            const [startVerse, endVerse] = await Promise.all([bibleVerseRepository.findById(readingRange.startVerseId), bibleVerseRepository.findById(readingRange.endVerseId)]);

            if (!startVerse || !endVerse) {
                throw new Error(`Could not find verses ${readingRange.startVerseId} or ${readingRange.endVerseId}`);
            }

            const assignment = {
                id: 0,
                date: this.formatDate(date),
                plan_name: planName,
                chapter_id: startPosition.chapterId,
                start_verse_id: startVerse.BibleVerseId,
                end_verse_id: endVerse.BibleVerseId,
                display_title: topic.display_name,
                is_completed: false,
                completed_at: null
            };

            return assignment;

        } catch (error) {
            throw error;
        }
    }

    private getStartPosition(position: ReadingPosition, chaptersInBook: BibleChapter[]): {
        chapterId: number; verseId: number
    } | null {
        // If no current position, start at the beginning of the first chapter
        if (!position.chapterId && !position.verseId) {
            const firstChapter = chaptersInBook[0];
            if (!firstChapter || !firstChapter.FirstVerseId) {
                return null;
            }

            return {
                chapterId: firstChapter.BibleChapterId, verseId: firstChapter.FirstVerseId
            };
        }

        // If we have a current position, continue from there
        if (position.chapterId && position.verseId) {
            return {
                chapterId: position.chapterId, verseId: position.verseId
            };
        }

        return null;
    }

    private calculateReadingRange(startPosition: {
        chapterId: number;
        verseId: number
    }, versesNeeded: number, chaptersInBook: BibleChapter[], position: ReadingPosition): {
        startVerseId: number;
        endVerseId: number
    } {
        const startChapter = chaptersInBook.find(ch => ch.BibleChapterId === startPosition.chapterId);
        if (!startChapter || !startChapter.LastVerseId) {
            throw new Error(`Invalid start chapter: ${startPosition.chapterId}`);
        }

        const startVerseId = startPosition.verseId;
        let endVerseId = Math.min(startVerseId + versesNeeded - 1, startChapter.LastVerseId);

        if (startVerseId <= 0) {
            throw new Error(`Invalid startVerseId: ${startVerseId}. Must be positive.`);
        }

        return {startVerseId, endVerseId};
    }

    private async updateReadingProgress(progress: ReadingPlanProgress, position: ReadingPosition, topicId: number, dailyVerseGoal: number): Promise<void> {
        const finalBookId = position.bookIndex < position.allBooks.length ? position.allBooks[position.bookIndex].BibleBookId : position.allBooks[position.allBooks.length - 1].BibleBookId;

        await readingPlanProgressRepository.update({
            id: progress.id,
            current_book_id: finalBookId,
            current_verse_id: position.verseId || 1,
            current_chapter_id: position.chapterId,
            last_topic_id: topicId,
            verses_read_today: dailyVerseGoal,
            last_updated: new Date().toISOString()
        });
    }

    // ========================================
    // REPOSITORY & UTILITY METHODS
    // ========================================

    private async getActiveReadingPlan(): Promise<any> {
        const allPlans = await readingPlanConfigRepository.findAll();
        return allPlans.find(plan => plan.is_active);
    }

    private async getTodaysTopic(dayOfWeek: number): Promise<ReadingTopic> {
        console.log(dayOfWeek)
        if (typeof dayOfWeek !== 'number' || dayOfWeek < 1 || dayOfWeek > 7) {
            throw new ValidationError(`Invalid dayOfWeek: ${dayOfWeek}. Must be a number between 1-7`);
        }

        const allTopics = await readingTopicsRepository.findAll();
        const todaysTopic = allTopics.find(topic => topic.day_of_week === dayOfWeek && topic.is_active);

        if (!todaysTopic) {
            throw new Error(`No topic configured for day ${dayOfWeek}`);
        }

        return todaysTopic;
    }

    private async getBooksForTopic(topicId: number): Promise<BibleBookTopic[]> {
        if (typeof topicId !== 'number' || topicId <= 0) {
            throw new ValidationError(`Invalid topicId: ${topicId}. Must be a positive number`);
        }

        const topicBooks = await bibleBookTopicsRepository.findAll();
        const booksForTopic = topicBooks
            .filter(bt => bt.topic_id === topicId)
            .sort((a, b) => a.sort_order - b.sort_order);

        if (booksForTopic.length === 0) {
            throw new Error(`No books configured for topic ID: ${topicId}`);
        }

        return booksForTopic;
    }

    private async getOrCreateProgress(planConfigId: number): Promise<ReadingPlanProgress> {
        const allProgress: ReadingPlanProgress[] = await readingPlanProgressRepository.findAll();
        let progress: ReadingPlanProgress | undefined = allProgress.find(p => p.plan_config_id === planConfigId);

        if (!progress) {
            progress = await readingPlanProgressRepository.create({
                plan_config_id: planConfigId,
                current_verse_id: 1,
                verses_read_today: 0,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
            });
        }

        return progress;
    }

    private async getUserPreferences(): Promise<ReadingPreferences> {
        const allPreferences = await readingPreferencesRepository.findAll();
        let preferences: ReadingPreferences | undefined = allPreferences.find(p => p.userId === 1);

        if (!preferences) {
            preferences = await readingPreferencesRepository.create({
                userId: 1, dailyVerseGoal: 10, preferredReadingTime: 'morning'
            });
        }

        return preferences;
    }

    private validateInput(value: any, type: 'string' | 'date' | 'number', fieldName: string): void {
        if (type === 'string' && (!value || typeof value !== 'string')) {
            throw new ValidationError(`${fieldName} must be a non-empty string`);
        }
        if (type === 'date' && (!(value instanceof Date) || isNaN(value.getTime()))) {
            throw new ValidationError(`${fieldName} must be a valid Date`);
        }
        if (type === 'number' && (typeof value !== 'number' || value <= 0)) {
            throw new ValidationError(`${fieldName} must be a positive number`);
        }
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}

export const readingService = new ReadingService();
