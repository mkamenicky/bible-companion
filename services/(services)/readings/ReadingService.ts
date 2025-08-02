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
import {localizationService, SupportedLanguage} from "@/services";

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

    // ========================================
    // PUBLIC API METHODS
    // ========================================

    async fetchReadingAssignments(date: Date, language?: SupportedLanguage): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateStr = this.formatDate(date);
            console.log("ReadingService: Fetching assignments for date:", dateStr);

            // Check existing assignments first
            const existingAssignments = await this.getExistingAssignments(dateStr);
            if (existingAssignments.length > 0) {
                console.log("Found existing assignments:", existingAssignments.length);
                return await this.mapToEnhancedReadingAssignments(existingAssignments, language);
            }

            // Generate new assignments
            const activePlan = await this.getActiveReadingPlan();
            if (!activePlan) {
                throw new Error('No active reading plan found');
            }

            const newAssignments = await this.generateAssignmentsByType(activePlan, date);
            const savedAssignments = await this.saveAssignments(newAssignments, dateStr, activePlan.plan_name);

            console.log("Created new assignments:", savedAssignments.length);
            return await this.mapToEnhancedReadingAssignments(savedAssignments, language);

        } catch (error: any) {
            console.error("Error fetching reading assignments:", error);
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
            console.log("Existing assignments:", existingAssignments.length);

            // Try to extend incomplete assignments first
            const incompleteAssignments = existingAssignments.filter(a => !a.is_completed);
            if (incompleteAssignments.length > 0) {
                const assignmentToExtend = incompleteAssignments.sort((a, b) => b.end_verse_id - a.end_verse_id)[0];
                const extendedAssignment = await this.extendExistingAssignment(assignmentToExtend);

                if (extendedAssignment) {
                    console.log("Extended existing assignment");
                    return await this.mapToEnhancedReadingAssignments([extendedAssignment]);
                }
            }

            // Create new assignments if all are completed or extension failed
            console.log("Creating new assignments - all existing are completed");
            const continuationPoint = await this.findContinuationPoint(existingAssignments, activePlan);
            const currentTopic = activePlan.plan_type === 'topical' ? await this.getTodaysTopic(date.getDay() || 7) : undefined;

            const newAssignments = await this.generateNonOverlappingAssignments(activePlan, date, continuationPoint, existingAssignments, currentTopic);

            if (newAssignments.length === 0) {
                console.log("No additional assignments generated");
                return [];
            }

            const savedAssignments = await this.saveAssignments(newAssignments, dateStr, activePlan.plan_name);
            return await this.mapToEnhancedReadingAssignments(savedAssignments);

        } catch (error: any) {
            console.error('Error generating additional assignments:', error);
            throw new DatabaseMessageError(`Failed to generate additional assignments`, error as Error);
        }
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
                console.log(`Updated assignment ${existingAssignment.id} to completed: ${isRead}`);
            } else {
                const newAssignment = await dailyReadingAssignmentsRepository.create({
                    date: dateStr,
                    plan_name: dailyReadingAssignment.plan_name || "chronological",
                    chapter_id: dailyReadingAssignment.chapter_id,
                    start_verse_id: dailyReadingAssignment.start_verse_id,
                    end_verse_id: dailyReadingAssignment.end_verse_id,
                    display_title: dailyReadingAssignment.display_title || "Reading Assignment",
                    is_completed: isRead,
                    completed_at: isRead ? dateStr : undefined
                });
                console.log("Created new assignment:", newAssignment.id);
            }
        } catch (error: any) {
            console.error(`Failed to mark assignment as read:`, error);
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

    async getReadingProgress(startDate: Date, endDate: Date): Promise<any[]> {
        this.validateInput(startDate, 'date', 'startDate');
        this.validateInput(endDate, 'date', 'endDate');

        const startDateStr = this.formatDate(startDate);
        const endDateStr = this.formatDate(endDate);

        try {
            const allProgress = await bibleVerseProgressRepository.findAll();
            return allProgress.filter(p => p.dateRead >= startDateStr && p.dateRead <= endDateStr);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get reading progress', error as Error);
        }
    }

    async getCompletionPercentage(startDate: Date, endDate: Date, totalExpectedVerses: number): Promise<number> {
        const progress = await this.getReadingProgress(startDate, endDate);
        const completedVerses = progress.filter(p => p.isRead).length;
        return totalExpectedVerses === 0 ? 0 : Math.round((completedVerses / totalExpectedVerses) * 100);
    }

    async switchReadingPlan(planType: 'sequential' | 'topical' | 'chronological'): Promise<void> {
        try {
            const allPlans = await readingPlanConfigRepository.findAll();

            // Deactivate all plans
            for (const plan of allPlans.filter(p => p.is_active)) {
                await readingPlanConfigRepository.update({id: plan.id, is_active: false});
            }

            // Activate the selected plan
            let targetPlan = allPlans.find(p => p.plan_type === planType);
            if (!targetPlan) {
                targetPlan = await readingPlanConfigRepository.create({
                    plan_name: this.getPlanDisplayName(planType), plan_type: planType, is_active: true
                });
            } else {
                await readingPlanConfigRepository.update({id: targetPlan.id, is_active: true});
            }
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to switch reading plan', error as Error);
        }
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
                console.error(`Could not find chapter ${assignment.chapter_id}`);
                return null;
            }

            const maxVerseInChapter = currentChapter.LastVerseId || assignment.end_verse_id;
            const newEndVerseId = Math.min(assignment.end_verse_id + additionalVerses, maxVerseInChapter);

            if (newEndVerseId <= assignment.end_verse_id) {
                console.log(`Cannot extend assignment ${assignment.id} - already at end of chapter`);
                return null;
            }

            console.log(`Extending assignment from verse ${assignment.end_verse_id} to ${newEndVerseId}`);

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
            console.error(`Error extending assignment ${assignment.id}:`, error);
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
        const {plan, date, progress, preferences, existingAssignments} = context;
        const dayOfWeek = date.getDay() || 7;

        const todaysTopic = await this.getTodaysTopic(dayOfWeek);
        const booksForTopic = await this.getBooksForTopic(todaysTopic.id);

        const currentPosition = await this.getCurrentReadingPosition(progress, todaysTopic, booksForTopic, existingAssignments);

        const assignments = await this.generateAssignmentsForGoal(currentPosition, preferences.dailyVerseGoal, plan.plan_name, date, todaysTopic, booksForTopic);

        await this.updateReadingProgress(progress, currentPosition, todaysTopic.id, preferences.dailyVerseGoal);

        return assignments;
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


// Add method to get chapter with localized title
    private async getBookWithLocalizedTitle(chapterId: number, titleColumn: string): Promise<{
        localizedTitle: string
    } | null> {
        try {
            // First, get the chapter to find which book it belongs to
            const chapters = await bibleChapterRepository.findAll();
            const chapter = chapters.find(c => c.BibleChapterId === chapterId);

            if (!chapter) {
                console.warn(`Chapter not found: ${chapterId}`);
                return null;
            }

            // Then get the book information with localized title
            const books = await bibleBookRepository.findAll();
            const book = books.find(b => b.BibleBookId === chapter.BookNumber);

            if (!book) {
                console.warn(`Book not found for chapter: ${chapterId}`);
                return null;
            }

            // Get the localized book title with proper typing
            let localizedTitle: string;

            switch (titleColumn) {
                case 'ChapterDisplayTitle':
                    localizedTitle = book.ChapterDisplayTitle || book.BookDisplayTitle || 'Unknown Book';
                    break;
                case 'ChapterDisplayTitleGerman':
                    localizedTitle = book.ChapterDisplayTitleGerman || book.ChapterDisplayTitle || book.BookDisplayTitle || 'Unknown Book';
                    break;
                case 'ChapterDisplayTitleJapanese':
                    localizedTitle = book.ChapterDisplayTitleJapanese || book.ChapterDisplayTitle || book.BookDisplayTitle || 'Unknown Book';
                    break;
                default:
                    localizedTitle = book.ChapterDisplayTitle || book.BookDisplayTitle || 'Unknown Book';
                    break;
            }

            return {
                localizedTitle: localizedTitle
            };
        } catch (error) {
            console.error('Error getting localized book title:', error);
            return null;
        }
    }

// Add method to create localized display title
    private async createLocalizedDisplayTitle(assignment: DailyReadingAssignment, titleColumn: string): Promise<string> {
        try {
            // Get the localized book title
            const bookInfo = await this.getBookWithLocalizedTitle(assignment.chapter_id, titleColumn);

            if (!bookInfo) {
                return assignment.display_title; // fallback
            }

            // Get chapter information to build the complete title
            const chapters = await bibleChapterRepository.findAll();
            const chapter = chapters.find(c => c.BibleChapterId === assignment.chapter_id);

            if (!chapter) {
                return bookInfo.localizedTitle; // just return book name
            }

            // Get verse information to create a complete reference
            const startVerse = await bibleVerseRepository.findById(assignment.start_verse_id);
            const endVerse = await bibleVerseRepository.findById(assignment.end_verse_id);

            if (startVerse && endVerse) {
                // Parse verse labels to extract chapter and verse numbers
                // Assuming verse labels are in format like "Genesis 1:1"
                const startVerseInfo = this.parseVerseLabel(startVerse.Label);
                const endVerseInfo = this.parseVerseLabel(endVerse.Label);

                if (startVerseInfo && endVerseInfo) {
                    // Create a proper reference like "Genesis 1:1-15" or "Genesis 1:1-2:5"
                    if (startVerseInfo.chapter === endVerseInfo.chapter) {
                        // Same chapter: "Genesis 1:1-15"
                        return `${bookInfo.localizedTitle} ${startVerseInfo.chapter}:${startVerseInfo.verse}-${endVerseInfo.verse}`;
                    } else {
                        // Different chapters: "Genesis 1:1-2:5"
                        return `${bookInfo.localizedTitle} ${startVerseInfo.chapter}:${startVerseInfo.verse}-${endVerseInfo.chapter}:${endVerseInfo.verse}`;
                    }
                }
            }

            // Fallback: just return the localized book name
            return bookInfo.localizedTitle;

        } catch (error) {
            console.error('Error creating localized display title:', error);
            return assignment.display_title; // fallback
        }
    }

    // Helper method to parse verse labels (assuming format like "Genesis 1:1")
    private parseVerseLabel(label: string): { book: string; chapter: number; verse: number } | null {
        try {
            // This regex matches patterns like "Genesis 1:1" or "1 Samuel 2:15"
            const match = label.match(/^(.+?)\s+(\d+):(\d+)$/);
            if (match) {
                return {
                    book: match[1].trim(), chapter: parseInt(match[2]), verse: parseInt(match[3])
                };
            }
            return null;
        } catch (error) {
            console.error('Error parsing verse label:', error);
            return null;
        }
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

    private async getExistingAssignments(dateStr: string): Promise<EnhancedDailyReadingAssignment[]> {
        const existingAssignments = await dailyReadingAssignmentsRepository.findAll();
        const dailyReadingAssignments = existingAssignments.filter(assignment => assignment.date === dateStr);
        return await this.mapToEnhancedReadingAssignments(dailyReadingAssignments);
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
                // Create the complete localized display title
                const localizedDisplayTitle = await this.createLocalizedDisplayTitle(assignment, titleColumn);

                enhanced.push({
                    ...assignment,
                    localized_title: localizedDisplayTitle,
                    verses_in_range: assignment.end_verse_id - assignment.start_verse_id + 1,
                    estimated_reading_time: Math.ceil((assignment.end_verse_id - assignment.start_verse_id + 1) * 0.5),
                });
            } catch (error) {
                console.warn(`Failed to get localized title for assignment ${assignment.id}:`, error);
                // Fall back to original display title
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
                    console.log(`Assignment conflicts with existing assignment, skipping`);
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
                console.error(`Error saving assignment:`, error);

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
        const [allBooks, allChapters] = await Promise.all([bibleBookRepository.findAll(), bibleChapterRepository.findAll()]);

        let bookIndex = 0;
        let chapterId: number | undefined = undefined;
        let verseId: number | undefined = undefined;

        if (existingAssignments && existingAssignments.length > 0) {
            const lastAssignment = existingAssignments.sort((a, b) => b.end_verse_id - a.end_verse_id)[0];
            verseId = lastAssignment.end_verse_id + 1;

            const verse = await bibleVerseRepository.findById(verseId);
            if (verse) {
                const chapter = allChapters.find(ch => verseId! >= (ch.FirstVerseId || 0) && verseId! <= (ch.LastVerseId || 0));

                if (chapter) {
                    chapterId = chapter.BibleChapterId;
                    const book = allBooks.find(b => b.BibleBookId === chapter.BookNumber);
                    if (book) {
                        bookIndex = booksForTopic.findIndex(bt => bt.bible_book_id === book.BibleBookId);
                        if (bookIndex === -1) bookIndex = 0;
                    }
                }
            }
        } else if (progress.last_topic_id === todaysTopic.id && progress.current_book_id && progress.current_verse_id) {
            bookIndex = booksForTopic.findIndex(bt => bt.bible_book_id === progress.current_book_id);
            if (bookIndex === -1) bookIndex = 0;
            verseId = progress.current_verse_id;

            const chaptersInCurrentBook = allChapters
                .filter(ch => ch.BookNumber === booksForTopic[bookIndex].bible_book_id)
                .sort((a, b) => (a.ChapterNumber || 0) - (b.ChapterNumber || 0));

            const currentChapter = chaptersInCurrentBook.find(ch => verseId! >= (ch.FirstVerseId || 0) && verseId! <= (ch.LastVerseId || 0));

            chapterId = currentChapter?.BibleChapterId || chaptersInCurrentBook[0]?.BibleChapterId || undefined;
        } else {
            // Start from beginning
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
                console.warn("Too many assignments generated, stopping");
                break;
            }
        }

        return assignments;
    }

    private async createSingleAssignment(position: ReadingPosition, versesNeeded: number, planName: string, date: Date, topic: ReadingTopic, booksForTopic: BibleBookTopic[]): Promise<DailyReadingAssignment | null> {
        const currentBookTopic = booksForTopic[position.bookIndex];
        const currentBook = position.allBooks.find(b => b.BibleBookId === currentBookTopic.bible_book_id);

        if (!currentBook) return null;

        const chaptersInBook = position.allChapters
            .filter(ch => ch.BookNumber === currentBookTopic.bible_book_id)
            .sort((a, b) => (a.ChapterNumber || 0) - (b.ChapterNumber || 0));

        if (chaptersInBook.length === 0) return null;

        const startPosition = this.getStartPosition(position, chaptersInBook);
        if (!startPosition) return null;

        const readingRange = this.calculateReadingRange(startPosition, versesNeeded, chaptersInBook, position);

        const [startVerse, endVerse] = await Promise.all([bibleVerseRepository.findById(readingRange.startVerseId), bibleVerseRepository.findById(readingRange.endVerseId)]);

        if (!startVerse || !endVerse) {
            throw new Error(`Could not find verses ${readingRange.startVerseId} or ${readingRange.endVerseId}`);
        }

        return {
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
    }

    private getStartPosition(position: ReadingPosition, chaptersInBook: BibleChapter[]): {
        chapterId: number; verseId: number
    } | null {
        if (position.chapterId && position.verseId) {
            return {chapterId: position.chapterId, verseId: position.verseId};
        } else {
            const firstChapter = chaptersInBook[0];
            if (!firstChapter) return null;
            return {
                chapterId: firstChapter.BibleChapterId as number, verseId: firstChapter.FirstVerseId as number
            };
        }
    }

    private calculateReadingRange(startPosition: {
        chapterId: number; verseId: number
    }, versesNeeded: number, chaptersInBook: BibleChapter[], position: ReadingPosition): {
        startVerseId: number; endVerseId: number
    } {
        const startChapter = chaptersInBook.find(ch => ch.BibleChapterId === startPosition.chapterId);
        if (!startChapter) {
            throw new Error(`Could not find chapter ${startPosition.chapterId}`);
        }

        let endVerseId = Math.min(startPosition.verseId + versesNeeded - 1, startChapter.LastVerseId as number);

        if (endVerseId < (startChapter.LastVerseId as number)) {
            position.verseId = endVerseId + 1;
        } else {
            const currentChapterIndex = chaptersInBook.findIndex(ch => ch.BibleChapterId === startPosition.chapterId);
            if (currentChapterIndex + 1 < chaptersInBook.length) {
                const nextChapter = chaptersInBook[currentChapterIndex + 1];
                position.chapterId = nextChapter.BibleChapterId;
                position.verseId = nextChapter.FirstVerseId;
            } else {
                position.bookIndex++;
                position.chapterId = undefined;
                position.verseId = undefined;
            }
        }

        return {startVerseId: startPosition.verseId, endVerseId};
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
        const allTopics = await readingTopicsRepository.findAll();
        const todaysTopic = allTopics.find(topic => topic.day_of_week === dayOfWeek && topic.is_active);

        if (!todaysTopic) {
            throw new Error(`No topic configured for day ${dayOfWeek}`);
        }

        return todaysTopic;
    }

    private async getBooksForTopic(topicId: number): Promise<BibleBookTopic[]> {
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

    private getPlanDisplayName(planType: string): string {
        const names: Record<string, string> = {
            'sequential': 'Sequential Reading', 'topical': 'Topical Weekly', 'chronological': 'Chronological Reading'
        };
        return names[planType] || planType;
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
