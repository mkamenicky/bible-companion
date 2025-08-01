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
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Languages = "english" | "german" | "japanese";

/**
 * Current reading position state
 */
interface ReadingPosition {
    bookIndex: number;
    chapterId: number | undefined;
    verseId: number | undefined;
    allBooks: BibleBook[];
    allChapters: BibleChapter[];
}

/**
 * Assignment generation context
 */
interface AssignmentContext {
    plan: any;
    date: Date;
    progress: ReadingPlanProgress;
    preferences: ReadingPreferences;
    existingAssignments?: DailyReadingAssignment[];
}

/**
 * Service class for managing Bible reading progress and plans
 * Handles business logic for reading plans, verse progress, and reading assignments
 */
export class ReadingService {

    /**
     * Fetches or creates daily reading assignments for the SPECIFIED date
     */
    async fetchReadingAssignments(date: Date): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateStr = this.formatDate(date);
            console.log("ReadingService: Fetching assignments for EXACT date:", dateStr);

            // Check if assignments already exist for THIS SPECIFIC date
            const todaysAssignments = await this.getExistingAssignments(dateStr);
            if (todaysAssignments.length > 0) {
                console.log("Found existing assignments for", dateStr, ":", todaysAssignments);
                return todaysAssignments;
            }

            // Generate new assignments for THIS SPECIFIC date
            const activePlan = await this.getActiveReadingPlan();
            if (!activePlan) {
                throw new Error('No active reading plan found');
            }

            console.log("Active plan:", activePlan);
            const newAssignments = await this.generateAssignmentsByType(activePlan, date);
            const savedAssignments = await this.saveAssignments(newAssignments, dateStr, activePlan.plan_name);

            console.log("Created new assignments for", dateStr, ":", savedAssignments);
            return await this.mapToEnhancedReadingAssignments(savedAssignments);

        } catch (error: any) {
            console.error(error);
            throw new DatabaseMessageError(`Failed to fetch reading assignments`, error as Error);
        }
    }

    /**
     * Generates additional reading assignments for the SPECIFIED date
     */
    async generateAdditionalAssignments(date: Date): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateStr = this.formatDate(date);
            console.log("ReadingService: Generating additional assignments for EXACT date:", dateStr);

            // Get active reading plan
            const activePlan = await this.getActiveReadingPlan();
            if (!activePlan) {
                throw new Error('No active reading plan found');
            }

            // Get existing assignments for THIS SPECIFIC date
            const existingAssignments = await this.getExistingAssignmentsByDate(dateStr);
            console.log("Existing assignments for", dateStr, ":", existingAssignments);

            // Generate new assignments for THIS SPECIFIC date
            const newAssignments = await this.generateAssignmentsByType(activePlan, date, existingAssignments);

            if (newAssignments.length === 0) {
                console.log("ReadingService: No additional assignments generated for", dateStr);
                return [];
            }

            // Save all new assignments with the CORRECT date
            const savedAssignments = await this.saveAssignments(
                newAssignments,
                dateStr,
                activePlan.plan_name
            );

            console.log("ReadingService: Created additional assignments for", dateStr, ":", savedAssignments);

            // Map to enhanced assignments and return
            return await this.mapToEnhancedReadingAssignments(savedAssignments);

        } catch (error: any) {
            console.error('ReadingService: Error generating additional assignments:', error);
            throw new DatabaseMessageError(`Failed to generate additional assignments`, error as Error);
        }
    }

    /**
     * Marks a Bible verse as read for a specific date
     */
    async markVerseAsRead(bibleVerseId: number, date: Date = new Date()): Promise<void> {
        this.validateInput(bibleVerseId, 'number', 'bibleVerseId');
        this.validateInput(date, 'date', 'date');

        const dateStr = this.formatDate(date);

        try {
            const allProgress = await bibleVerseProgressRepository.findAll();
            const existingProgress = allProgress.find(progress => progress.bibleVerseId === bibleVerseId && progress.dateRead === dateStr);

            if (existingProgress) {
                if (!existingProgress.isRead) {
                    await bibleVerseProgressRepository.update({
                        id: existingProgress.id, isRead: true
                    });
                }
            } else {
                await bibleVerseProgressRepository.create({
                    bibleVerseId, dateRead: dateStr, isRead: true
                });
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to mark verse as read: ${bibleVerseId}`, error as Error);
        }
    }

    // Enhanced markDailyReadingAssignmentAsRead method for ReadingService

    /**
     * Marks a daily reading assignment as read/unread with improved logic
     */
    async markDailyReadingAssignmentAsRead(
        dailyReadingAssignment: DailyReadingAssignment,
        date: Date = new Date(),
        isRead: boolean = true
    ): Promise<void> {
        this.validateInput(date, 'date', 'date');

        try {
            const dateStr = this.formatDate(date);
            console.log("ReadingService: Marking assignment as read:", {
                assignment_id: dailyReadingAssignment.id,
                verses: `${dailyReadingAssignment.start_verse_id}-${dailyReadingAssignment.end_verse_id}`,
                chapter_id: dailyReadingAssignment.chapter_id,
                date: dateStr,
                is_read: isRead,
                display_title: dailyReadingAssignment.display_title
            });

            const readAssignments = await dailyReadingAssignmentsRepository.findAll();

            // Try to find existing assignment by multiple criteria for robustness
            let existingAssignment = readAssignments.find(assignment =>
                assignment.id === dailyReadingAssignment.id
            );

            // Fallback: try to find by verse range and date if ID doesn't match
            if (!existingAssignment) {
                existingAssignment = readAssignments.find(assignment =>
                    assignment.start_verse_id === dailyReadingAssignment.start_verse_id &&
                    assignment.end_verse_id === dailyReadingAssignment.end_verse_id &&
                    assignment.date === dateStr
                );

                if (existingAssignment) {
                    console.log("Found assignment by verse range instead of ID:", existingAssignment.id);
                }
            }

            console.log("Existing assignment found:", existingAssignment ?
                `ID: ${existingAssignment.id}, completed: ${existingAssignment.is_completed}` :
                'none');

            if (existingAssignment) {
                // Update existing assignment
                console.log(`Updating existing assignment ${existingAssignment.id} to completed: ${isRead}`);

                await dailyReadingAssignmentsRepository.update({
                    id: existingAssignment.id,
                    chapter_id: existingAssignment.chapter_id,
                    is_completed: isRead,
                    completed_at: isRead ? dateStr : undefined
                });

                console.log(`Successfully updated assignment ${existingAssignment.id}`);
            } else {
                // Create new assignment record
                console.log("No existing assignment found, creating new one");

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

    /**
     * Unmarks a Bible verse as read by removing its progress record
     */
    async unmarkVerseAsRead(bibleVerseId: number): Promise<void> {
        this.validateInput(bibleVerseId, 'number', 'bibleVerseId');

        try {
            const allProgress = await bibleVerseProgressRepository.findAll();
            const progressToRemove = allProgress.filter(progress => progress.bibleVerseId === bibleVerseId);

            for (const progress of progressToRemove) {
                await bibleVerseProgressRepository.deleteById(progress.id);
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to unmark verse as read: ${bibleVerseId}`, error as Error);
        }
    }

    /**
     * Gets the current reading plan with books, chapters, and verses
     */
    async getReadingPlan(): Promise<ReadingPlan[]> {
        console.log("fetching plans:");
        try {
            const readingPlanConfigs = await readingPlanConfigRepository.findAll();
            console.log("existingPlan:", readingPlanConfigs);
            let existingPlan = readingPlanConfigs.find(config => config.is_active);

            console.log("existingPlan:", existingPlan);

            if (!existingPlan) {
                existingPlan = await readingPlanConfigRepository.create({
                    plan_name: "Sequential Reading", plan_type: "sequential", is_active: true
                });
            }

            return [{
                readingPlanConfig: existingPlan
            }];
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get reading plan', error as Error);
        }
    }

    /**
     * Gets reading progress for a specific date range
     */
    async getReadingProgress(startDate: Date, endDate: Date): Promise<any[]> {
        this.validateInput(startDate, 'date', 'startDate');
        this.validateInput(endDate, 'date', 'endDate');

        const startDateStr = this.formatDate(startDate);
        const endDateStr = this.formatDate(endDate);

        try {
            const allProgress = await bibleVerseProgressRepository.findAll();
            return allProgress.filter(progress => progress.dateRead >= startDateStr && progress.dateRead <= endDateStr);
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get reading progress', error as Error);
        }
    }

    /**
     * Gets completion percentage for a date range
     */
    async getCompletionPercentage(startDate: Date, endDate: Date, totalExpectedVerses: number): Promise<number> {
        const progress = await this.getReadingProgress(startDate, endDate);
        const completedVerses = progress.filter(p => p.isRead).length;

        if (totalExpectedVerses === 0) return 0;
        return Math.round((completedVerses / totalExpectedVerses) * 100);
    }

    /**
     * Changes the active reading plan
     */
    async switchReadingPlan(planType: 'sequential' | 'topical' | 'chronological'): Promise<void> {
        try {
            // Deactivate all plans
            const allPlans = await readingPlanConfigRepository.findAll();
            for (const plan of allPlans) {
                if (plan.is_active) {
                    await readingPlanConfigRepository.update({
                        id: plan.id, is_active: false
                    });
                }
            }

            // Activate the selected plan
            let targetPlan = allPlans.find(p => p.plan_type === planType);
            if (!targetPlan) {
                targetPlan = await readingPlanConfigRepository.create({
                    plan_name: this.getPlanDisplayName(planType), plan_type: planType, is_active: true
                });
            } else {
                await readingPlanConfigRepository.update({
                    id: targetPlan.id, is_active: true
                });
            }

        } catch (error: any) {
            throw new DatabaseMessageError('Failed to switch reading plan', error as Error);
        }
    }

    // ========================================
    // PRIVATE METHODS - REFACTORED TO ELIMINATE DUPLICATION
    // ========================================

    /**
     * Get existing assignments for a date (enhanced)
     */
    private async getExistingAssignments(dateStr: string): Promise<EnhancedDailyReadingAssignment[]> {
        const existingAssignments = await dailyReadingAssignmentsRepository.findAll();
        const dailyReadingAssignments = existingAssignments.filter(assignment => assignment.date === dateStr);
        return await this.mapToEnhancedReadingAssignments(dailyReadingAssignments);
    }

    /**
     * Get existing assignments for a specific date (raw data)
     */
    private async getExistingAssignmentsByDate(dateStr: string): Promise<DailyReadingAssignment[]> {
        const allAssignments = await dailyReadingAssignmentsRepository.findAll();
        return allAssignments.filter(assignment => assignment.date === dateStr);
    }

    /**
     * UNIFIED assignment generation method that handles both initial and additional assignments
     */
    private async generateAssignmentsByType(
        activePlan: any,
        date: Date,
        existingAssignments?: DailyReadingAssignment[]
    ): Promise<DailyReadingAssignment[]> {

        // Create context object with all necessary data
        const context: AssignmentContext = {
            plan: activePlan,
            date,
            progress: await this.getOrCreateProgress(activePlan.id),
            preferences: await this.getUserPreferences(),
            existingAssignments
        };

        switch (activePlan.plan_type) {
            case 'sequential':
                return [await this.generateSequentialAssignment(context)];
            case 'topical':
                return await this.generateTopicalAssignment(context);
            case 'chronological':
                return [await this.generateChronologicalAssignment(context)];
            default:
                throw new Error(`Unsupported plan type: ${activePlan.plan_type}`);
        }
    }

    private async generateSequentialAssignment(context: AssignmentContext): Promise<DailyReadingAssignment> {
        const { plan, date, progress, preferences, existingAssignments } = context;
        const versesToRead = preferences.dailyVerseGoal || 10;

        // Calculate starting verse - either from progress or after existing assignments
        let startVerseId = progress.current_verse_id || 1;

        if (existingAssignments && existingAssignments.length > 0) {
            const lastAssignment = existingAssignments
                .sort((a, b) => b.end_verse_id - a.end_verse_id)[0];
            startVerseId = lastAssignment.end_verse_id + 1;
        }

        // Generate a single assignment that respects chapter boundaries
        const assignment = await this.generateSingleChapterAssignment(context, startVerseId, versesToRead);

        // Update progress to the new position
        await readingPlanProgressRepository.update({
            id: progress.id,
            current_verse_id: assignment.end_verse_id + 1,
            verses_read_today: (progress.verses_read_today || 0) + versesToRead,
            last_updated: new Date().toISOString()
        });

        return assignment;
    }

    /**
     * UNIFIED topical assignment generation
     */
    private async generateTopicalAssignment(context: AssignmentContext): Promise<DailyReadingAssignment[]> {
        const { plan, date, progress, preferences, existingAssignments } = context;
        const dayOfWeek = date.getDay() || 7;

        console.log("Generating topical assignment for day:", dayOfWeek);

        // Get today's topic and books
        const todaysTopic = await this.getTodaysTopic(dayOfWeek);
        const booksForTopic = await this.getBooksForTopic(todaysTopic.id);

        // Get current reading position (considering existing assignments if any)
        const currentPosition = await this.getCurrentReadingPosition(
            progress,
            todaysTopic,
            booksForTopic,
            existingAssignments
        );

        // Generate assignments to meet daily verse goal
        const assignments = await this.generateAssignmentsForGoal(
            currentPosition,
            preferences.dailyVerseGoal,
            plan.plan_name,
            date,
            todaysTopic,
            booksForTopic
        );

        // Update progress
        await this.updateReadingProgress(
            progress,
            currentPosition,
            todaysTopic.id,
            preferences.dailyVerseGoal
        );

        return assignments;
    }

    /**
     * UNIFIED chronological assignment generation
     */
    private async generateChronologicalAssignment(context: AssignmentContext): Promise<DailyReadingAssignment> {
        // For now, use sequential logic (chronological ordering would need special implementation)
        return await this.generateSequentialAssignment(context);
    }

    /**
     * UNIFIED current reading position calculation
     * Handles both initial generation and continuing from existing assignments
     */
    private async getCurrentReadingPosition(
        progress: ReadingPlanProgress,
        todaysTopic: ReadingTopic,
        booksForTopic: BibleBookTopic[],
        existingAssignments?: DailyReadingAssignment[]
    ): Promise<ReadingPosition> {

        const [allBooks, allChapters] = await Promise.all([
            bibleBookRepository.findAll(),
            bibleChapterRepository.findAll()
        ]);

        let bookIndex = 0;
        let chapterId: number | undefined = undefined;
        let verseId: number | undefined = undefined;

        // Priority 1: Continue from existing assignments if they exist
        if (existingAssignments && existingAssignments.length > 0) {
            const lastAssignment = existingAssignments
                .sort((a, b) => b.end_verse_id - a.end_verse_id)[0];

            verseId = lastAssignment.end_verse_id + 1;

            // Find which book and chapter this verse belongs to
            const verse = await bibleVerseRepository.findById(verseId);
            if (verse) {
                const chapter = allChapters.find(ch =>
                    verseId! >= (ch.FirstVerseId || 0) &&
                    verseId! <= (ch.LastVerseId || 0)
                );

                if (chapter) {
                    chapterId = chapter.BibleChapterId;
                    const book = allBooks.find(b => b.BibleBookId === chapter.BookNumber);
                    if (book) {
                        bookIndex = booksForTopic.findIndex(bt => bt.bible_book_id === book.BibleBookId);
                        if (bookIndex === -1) bookIndex = 0;
                    }
                }
            }
        }
        // Priority 2: Use saved progress from previous sessions
        else if (progress.last_topic_id === todaysTopic.id && progress.current_book_id && progress.current_verse_id) {
            bookIndex = booksForTopic.findIndex(bt => bt.bible_book_id === progress.current_book_id);
            if (bookIndex === -1) bookIndex = 0;
            verseId = progress.current_verse_id;

            const chaptersInCurrentBook = allChapters
                .filter(ch => ch.BookNumber === booksForTopic[bookIndex].bible_book_id)
                .sort((a, b) => (a.ChapterNumber || 0) - (b.ChapterNumber || 0));

            const currentChapter = chaptersInCurrentBook.find(ch =>
                verseId! >= (ch.FirstVerseId || 0) &&
                verseId! <= (ch.LastVerseId || 0)
            );

            chapterId = currentChapter?.BibleChapterId || chaptersInCurrentBook[0]?.BibleChapterId || undefined;
        }
        // Priority 3: Start from beginning if no progress exists

        return {
            bookIndex,
            chapterId,
            verseId,
            allBooks,
            allChapters
        };
    }

    // Rest of the private methods remain the same...
    private async mapToEnhancedReadingAssignments(dailyReadingAssignments: DailyReadingAssignment[]) {
        const stripHtml = (html: string | undefined): string | undefined => {
            if (!html) return html;
            const withoutTags = html.replace(/<[^>]*>/g, '');
            return withoutTags
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        };

        const enhancedAssignments = await Promise.all(dailyReadingAssignments.map(async assignment => {
            const startVerse = await bibleVerseRepository.findById(assignment.start_verse_id);
            const endVerse = await bibleVerseRepository.findById(assignment.end_verse_id);
            const bibleChapter = await bibleChapterRepository.findById(assignment.chapter_id);
            const bibleBook = await bibleBookRepository.findById(<number>bibleChapter?.BookNumber);

            const language = await AsyncStorage.getItem("language") ? AsyncStorage.getItem("language") : "english" as Languages;

            let bibleBookTitle;
            switch (language) {
                case "english":
                    bibleBookTitle = bibleBook?.ChapterDisplayTitle;
                    break;
                case "german":
                    bibleBookTitle = bibleBook?.ChapterDisplayTitleGerman;
                    break;
                case "japanese":
                    bibleBookTitle = bibleBook?.ChapterDisplayTitleJapanese;
            }

            const enhancedAssignment: EnhancedDailyReadingAssignment = {
                ...assignment,
                book_title: bibleBookTitle,
                chapter_title: bibleChapter?.ChapterNumber,
                start_verse_title: stripHtml(startVerse?.Label),
                end_verse_title: stripHtml(endVerse?.Label)
            };

            return enhancedAssignment;
        }));

        return enhancedAssignments.sort((a, b) => a.chapter_id - b.chapter_id);
    }

    /**
     * Enhanced save method that handles the unique constraint (date, plan_name, chapter_id)
     * by combining assignments from the same chapter
     */
    private async saveAssignments(assignments: DailyReadingAssignment[], dateStr: string, planName: string): Promise<DailyReadingAssignment[]> {
        const savedAssignments: DailyReadingAssignment[] = [];

        // Group assignments by chapter_id to handle unique constraint
        const assignmentsByChapter = new Map<number, DailyReadingAssignment[]>();

        for (const assignment of assignments) {
            const chapterId = assignment.chapter_id;
            if (!assignmentsByChapter.has(chapterId)) {
                assignmentsByChapter.set(chapterId, []);
            }
            assignmentsByChapter.get(chapterId)!.push(assignment);
        }

        // Process each chapter group
        for (const [chapterId, chapterAssignments] of assignmentsByChapter) {
            try {
                // Check if assignment already exists for this date, plan, and chapter
                const existingAssignments = await dailyReadingAssignmentsRepository.findAll();
                const existingAssignment = existingAssignments.find(existing =>
                    existing.date === dateStr &&
                    existing.plan_name === planName &&
                    existing.chapter_id === chapterId
                );

                if (existingAssignment) {
                    // Update existing assignment to extend the verse range
                    const minStartVerse = Math.min(existingAssignment.start_verse_id, ...chapterAssignments.map(a => a.start_verse_id));
                    const maxEndVerse = Math.max(existingAssignment.end_verse_id, ...chapterAssignments.map(a => a.end_verse_id));

                    console.log(`Extending existing assignment for chapter ${chapterId}: ${minStartVerse}-${maxEndVerse}`);

                    const updatedAssignment = await dailyReadingAssignmentsRepository.update({
                        id: existingAssignment.id,
                        chapter_id: chapterId,
                        start_verse_id: minStartVerse,
                        end_verse_id: maxEndVerse,
                        display_title: existingAssignment.display_title // Keep original title
                    });

                    savedAssignments.push({
                        ...existingAssignment,
                        start_verse_id: minStartVerse,
                        end_verse_id: maxEndVerse
                    });
                } else {
                    // Create new assignment by combining all assignments for this chapter
                    const combinedAssignment = this.combineChapterAssignments(chapterAssignments, dateStr, planName);

                    console.log("Creating new assignment:", combinedAssignment);

                    const savedAssignment = await dailyReadingAssignmentsRepository.create({
                        date: dateStr,
                        plan_name: planName,
                        chapter_id: combinedAssignment.chapter_id,
                        start_verse_id: combinedAssignment.start_verse_id,
                        end_verse_id: combinedAssignment.end_verse_id,
                        display_title: combinedAssignment.display_title,
                        is_completed: false,
                        completed_at: undefined
                    });

                    savedAssignments.push(savedAssignment);
                }
            } catch (error: any) {
                console.error(`Error saving assignment for chapter ${chapterId}:`, error);

                // If we still get a constraint error, try to handle it gracefully
                if (error.message && error.message.includes('UNIQUE constraint failed')) {
                    console.log(`Unique constraint violation for chapter ${chapterId}, attempting to update existing record`);

                    // Fetch the existing record and update it
                    const existingAssignments = await dailyReadingAssignmentsRepository.findAll();
                    const existingAssignment = existingAssignments.find(existing =>
                        existing.date === dateStr &&
                        existing.plan_name === planName &&
                        existing.chapter_id === chapterId
                    );

                    if (existingAssignment) {
                        const minStartVerse = Math.min(existingAssignment.start_verse_id, ...chapterAssignments.map(a => a.start_verse_id));
                        const maxEndVerse = Math.max(existingAssignment.end_verse_id, ...chapterAssignments.map(a => a.end_verse_id));

                        await dailyReadingAssignmentsRepository.update({
                            id: existingAssignment.id,
                            chapter_id: chapterId,
                            start_verse_id: minStartVerse,
                            end_verse_id: maxEndVerse
                        });

                        savedAssignments.push({
                            ...existingAssignment,
                            start_verse_id: minStartVerse,
                            end_verse_id: maxEndVerse
                        });
                    }
                } else {
                    throw error; // Re-throw if it's not a constraint error
                }
            }
        }

        return savedAssignments;
    }

    /**
     * Combines multiple assignments from the same chapter into a single assignment
     */
    private combineChapterAssignments(assignments: DailyReadingAssignment[], dateStr: string, planName: string): DailyReadingAssignment {
        if (assignments.length === 0) {
            throw new Error('No assignments to combine');
        }

        if (assignments.length === 1) {
            return assignments[0];
        }

        // Find the range of verses across all assignments
        const minStartVerse = Math.min(...assignments.map(a => a.start_verse_id));
        const maxEndVerse = Math.max(...assignments.map(a => a.end_verse_id));
        const chapterId = assignments[0].chapter_id;
        const displayTitle = assignments[0].display_title;

        console.log(`Combining ${assignments.length} assignments for chapter ${chapterId}: verses ${minStartVerse}-${maxEndVerse}`);

        return {
            id: 0,
            date: dateStr,
            plan_name: planName,
            chapter_id: chapterId,
            start_verse_id: minStartVerse,
            end_verse_id: maxEndVerse,
            display_title: displayTitle,
            is_completed: false,
            completed_at: null
        };
    }

    /**
     * Alternative approach: Generate assignments that span across chapters if needed
     * This ensures we never have multiple assignments for the same chapter on the same day
     */
    private async generateSingleChapterAssignment(
        context: AssignmentContext,
        startVerseId: number,
        versesToRead: number
    ): Promise<DailyReadingAssignment> {

        const { plan, date } = context;

        // Get verse and chapter information
        const startVerse = await bibleVerseRepository.findById(startVerseId);
        if (!startVerse) {
            throw new Error(`Could not find start verse: ${startVerseId}`);
        }

        // Find chapter for the start verse
        const allChapters = await bibleChapterRepository.findAll();
        const startChapter = allChapters.find(ch =>
            startVerseId >= (ch.FirstVerseId || 0) &&
            startVerseId <= (ch.LastVerseId || 0)
        );

        if (!startChapter) {
            throw new Error(`Could not find chapter for verse: ${startVerseId}`);
        }

        // Calculate end verse, but don't go beyond the current chapter
        const maxVerseInChapter = startChapter.LastVerseId || startVerseId;
        const endVerseId = Math.min(startVerseId + versesToRead - 1, maxVerseInChapter);

        const endVerse = await bibleVerseRepository.findById(endVerseId);
        if (!endVerse) {
            throw new Error(`Could not find end verse: ${endVerseId}`);
        }

        return {
            id: 0,
            date: this.formatDate(date),
            plan_name: plan.plan_name,
            chapter_id: startChapter.BibleChapterId || 1,
            start_verse_id: startVerse.BibleVerseId,
            end_verse_id: endVerse.BibleVerseId,
            display_title: plan.plan_type === 'sequential' ? 'Sequential Reading' :
                plan.plan_type === 'chronological' ? 'Chronological Reading' :
                    'Reading Assignment',
            is_completed: false,
            completed_at: null
        };
    }

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
            .sort((a, b) => <number>a.ChapterNumber - <number>b.ChapterNumber);

        if (chaptersInBook.length === 0) return null;

        const startPosition = this.getStartPosition(position, chaptersInBook);
        if (!startPosition) return null;

        const readingRange = this.calculateReadingRange(startPosition, versesNeeded, chaptersInBook, position);

        const [startVerse, endVerse] = await Promise.all([
            bibleVerseRepository.findById(readingRange.startVerseId),
            bibleVerseRepository.findById(readingRange.endVerseId)
        ]);

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
            display_title: `${topic.display_name}`,
            is_completed: false,
            completed_at: null
        };
    }

    private getStartPosition(position: ReadingPosition, chaptersInBook: BibleChapter[]): {chapterId: number; verseId: number} | null {
        if (position.chapterId && position.verseId) {
            return {
                chapterId: position.chapterId, verseId: position.verseId
            };
        } else {
            const firstChapter = chaptersInBook[0];
            if (!firstChapter) return null;

            return {
                chapterId: <number>firstChapter.BibleChapterId, verseId: <number>firstChapter.FirstVerseId
            };
        }
    }

    private calculateReadingRange(startPosition: {chapterId: number; verseId: number}, versesNeeded: number, chaptersInBook: BibleChapter[], position: ReadingPosition): {startVerseId: number; endVerseId: number} {
        const startChapter = chaptersInBook.find(ch => ch.BibleChapterId === startPosition.chapterId);
        if (!startChapter) {
            throw new Error(`Could not find chapter ${startPosition.chapterId}`);
        }

        let endVerseId = Math.min(startPosition.verseId + versesNeeded - 1, <number>startChapter.LastVerseId);

        if (endVerseId < <number>startChapter.LastVerseId) {
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

        return {
            startVerseId: startPosition.verseId, endVerseId
        };
    }

    private async updateReadingProgress(progress: ReadingPlanProgress, position: ReadingPosition, topicId: number, dailyVerseGoal: number): Promise<void> {
        const finalBookId = position.bookIndex < position.allBooks.length ?
            position.allBooks[position.bookIndex].BibleBookId :
            position.allBooks[position.allBooks.length - 1].BibleBookId;

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
            'sequential': 'Sequential Reading',
            'topical': 'Topical Weekly',
            'chronological': 'Chronological Reading'
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
