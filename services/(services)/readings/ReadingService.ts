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
 * Service class for managing Bible reading progress and plans
 * Handles business logic for reading plans, verse progress, and reading assignments
 */
export class ReadingService {

    /**
     * Fetches or creates daily reading assignments based on active reading plan
     */
    async fetchReadingAssignments(date: Date = new Date()): Promise<EnhancedDailyReadingAssignment[]> {
        try {
            const dateStr = this.formatDate(date);
            console.log("Fetching assignments for date:", dateStr);

            // Check if assignments already exist for this date
            const todaysAssignments = await this.getExistingAssignments(dateStr);
            if (todaysAssignments.length > 0) {
                console.log("Found existing assignments:", todaysAssignments);
                return todaysAssignments;
            }

            // Get active reading plan
            const activePlan = await this.getActiveReadingPlan();
            if (!activePlan) {
                throw new Error('No active reading plan found');
            }

            console.log("Active plan:", activePlan);

            // Generate new assignments based on plan type
            const newAssignments = await this.generateAssignmentsByType(activePlan, date);

            // Save all assignments
            const savedAssignments = await this.saveAssignments(newAssignments, dateStr, activePlan.plan_name);

            console.log("Created new assignments:", savedAssignments);
            return await this.mapToEnhancedReadingAssignments(savedAssignments);

        } catch (error: any) {
            console.error(error);
            throw new DatabaseMessageError(`Failed to fetch reading assignments`, error as Error);
        }
    }

    /**
     * Get existing assignments for a date
     */
    private async getExistingAssignments(dateStr: string): Promise<EnhancedDailyReadingAssignment[]> {
        const existingAssignments = await dailyReadingAssignmentsRepository.findAll();
        const dailyReadingAssignments = existingAssignments.filter(assignment => assignment.date === dateStr);

        return await this.mapToEnhancedReadingAssignments(dailyReadingAssignments);
    }

    private async mapToEnhancedReadingAssignments(dailyReadingAssignments: DailyReadingAssignment[]) {
        const stripHtml = (html: string | undefined): string | undefined => {
            if (!html) return html;
            // Remove HTML tags
            const withoutTags = html.replace(/<[^>]*>/g, '');
            // Decode common HTML entities
            return withoutTags
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        };

        const enhancedAssignments = await Promise.all(
            dailyReadingAssignments.map(async assignment => {
                const startVerse = await bibleVerseRepository.findById(assignment.start_verse_id);
                const endVerse = await bibleVerseRepository.findById(assignment.end_verse_id);
                const bibleChapter = await bibleChapterRepository.findById(assignment.chapter_id);
                const bibleBook = await bibleBookRepository.findById(<number>bibleChapter?.BookNumber);

                const enhancedAssignment: EnhancedDailyReadingAssignment = {
                    ...assignment,
                    book_title: bibleBook?.BookDisplayTitle,
                    chapter_title: bibleChapter?.ChapterNumber,
                    start_verse_title: stripHtml(startVerse?.Label),
                    end_verse_title: stripHtml(endVerse?.Label)
                };

                return enhancedAssignment;
            })
        );

        // Sort by chapter_id
        return enhancedAssignments.sort((a, b) => a.chapter_id - b.chapter_id);
    }

    /**
     * Generate assignments based on plan type
     */
    private async generateAssignmentsByType(activePlan: any, date: Date): Promise<DailyReadingAssignment[]> {
        switch (activePlan.plan_type) {
            case 'sequential':
                const sequentialAssignment = await this.generateSequentialAssignment(activePlan, date);
                return [sequentialAssignment];
            case 'topical':
                return await this.generateTopicalAssignment(activePlan, date);
            case 'chronological':
                const chronologicalAssignment = await this.generateChronologicalAssignment(activePlan, date);
                return [chronologicalAssignment];
            default:
                throw new Error(`Unsupported plan type: ${activePlan.plan_type}`);
        }
    }

    /**
     * Save multiple assignments
     */
    private async saveAssignments(
        assignments: DailyReadingAssignment[],
        dateStr: string,
        planName: string
    ): Promise<DailyReadingAssignment[]> {
        const savedAssignments: DailyReadingAssignment[] = [];

        for (const assignment of assignments) {
            console.log("Trying to save Assignment:", assignment);
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
        }

        return savedAssignments;
    }

    /**
     * Gets the active reading plan
     */
    private async getActiveReadingPlan(): Promise<any> {
        const allPlans = await readingPlanConfigRepository.findAll();
        return allPlans.find(plan => plan.is_active);
    }

    /**
     * Generates sequential reading assignment (next verses in order)
     */
    private async generateSequentialAssignment(plan: any, date: Date): Promise<DailyReadingAssignment> {
        const progress = await this.getOrCreateProgress(plan.id);
        const preferences = await this.getUserPreferences();
        const versesToRead = preferences.dailyVerseGoal || 10;

        // Calculate verse range
        const startVerseId = progress.current_verse_id || 1;
        const endVerseId = startVerseId + versesToRead - 1;

        // Get verse labels for display
        const [startVerse, endVerse] = await Promise.all([
            bibleVerseRepository.findById(startVerseId),
            bibleVerseRepository.findById(endVerseId)
        ]);

        if (!startVerse || !endVerse) {
            throw new Error('Could not find verse range for sequential reading');
        }

        // Find chapter for the start verse
        const allChapters = await bibleChapterRepository.findAll();
        const startChapter = allChapters.find(ch =>
            startVerseId >= <number>ch.FirstVerseId && startVerseId <= <number>ch.LastVerseId
        );

        // Update progress
        await readingPlanProgressRepository.update({
            id: progress.id,
            current_verse_id: endVerseId + 1,
            verses_read_today: versesToRead,
            last_updated: new Date().toISOString()
        });

        return {
            id: 0,
            date: this.formatDate(date),
            plan_name: plan.plan_name,
            chapter_id: startChapter?.BibleChapterId || 1,
            start_verse_id: startVerse.BibleVerseId,
            end_verse_id:  endVerse.BibleVerseId,
            display_title: `Sequential Reading`,
            is_completed: false,
            completed_at: null
        };
    }

    /**
     * Generates topical reading assignment based on day of week
     * Creates multiple assignments if needed to meet daily verse goal
     */
    private async generateTopicalAssignment(plan: any, date: Date): Promise<DailyReadingAssignment[]> {
        const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7

        console.log("Generating topical assignment for day:", dayOfWeek);

        // Get today's topic
        const todaysTopic = await this.getTodaysTopic(dayOfWeek);

        // Get books for this topic
        const booksForTopic = await this.getBooksForTopic(todaysTopic.id);

        // Get or create progress and user preferences
        const [progress, preferences] = await Promise.all([
            this.getOrCreateProgress(plan.id),
            this.getUserPreferences()
        ]);

        // Get current reading position
        const currentPosition = await this.getCurrentReadingPosition(
            progress,
            todaysTopic,
            booksForTopic
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
        await this.updateReadingProgress(progress, currentPosition, todaysTopic.id, preferences.dailyVerseGoal);

        return assignments;
    }

    /**
     * Get today's active topic
     */
    private async getTodaysTopic(dayOfWeek: number): Promise<ReadingTopic> {
        const allTopics = await readingTopicsRepository.findAll();
        const todaysTopic = allTopics.find(topic =>
            topic.day_of_week === dayOfWeek && topic.is_active
        );

        if (!todaysTopic) {
            throw new Error(`No topic configured for day ${dayOfWeek}`);
        }

        return todaysTopic;
    }

    /**
     * Get books configured for a topic
     */
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


    /**
     * Get current reading position
     */
    private async getCurrentReadingPosition(
        progress: ReadingPlanProgress,
        todaysTopic: ReadingTopic,
        booksForTopic: BibleBookTopic[]
    ): Promise<ReadingPosition> {
        const [allBooks, allChapters] = await Promise.all([
            bibleBookRepository.findAll(),
            bibleChapterRepository.findAll()
        ]);

        let bookIndex = 0;
        let chapterId: number | undefined = undefined;
        let verseId: number | undefined = undefined;

        // Continue from where we left off if we're in the same topic
        if (progress.last_topic_id === todaysTopic.id && progress.current_book_id && progress.current_verse_id) {
            bookIndex = booksForTopic.findIndex(bt => bt.bible_book_id === progress.current_book_id);
            if (bookIndex === -1) bookIndex = 0; // Reset if book not found

            verseId = progress.current_verse_id;

            // Find current chapter
            const chaptersInCurrentBook = allChapters
                .filter(ch => ch.BookNumber === booksForTopic[bookIndex].bible_book_id)
                .sort((a, b) => <number>a.ChapterNumber - <number>b.ChapterNumber);

            const currentChapter = chaptersInCurrentBook.find(ch =>
                verseId! >= <number>ch.FirstVerseId && verseId! <= <number>ch.LastVerseId
            );

            chapterId = currentChapter?.BibleChapterId || chaptersInCurrentBook[0]?.BibleChapterId || undefined;
        }

        return {
            bookIndex,
            chapterId,
            verseId,
            allBooks,
            allChapters
        };
    }

    /**
     * Generate assignments to meet daily verse goal
     */
    private async generateAssignmentsForGoal(
        position: ReadingPosition,
        dailyVerseGoal: number,
        planName: string,
        date: Date,
        topic: ReadingTopic,
        booksForTopic: BibleBookTopic[]
    ): Promise<DailyReadingAssignment[]> {
        const assignments: DailyReadingAssignment[] = [];
        let versesRemaining = dailyVerseGoal;

        while (versesRemaining > 0 && position.bookIndex < booksForTopic.length) {
            const assignment = await this.createSingleAssignment(
                position,
                versesRemaining,
                planName,
                date,
                topic,
                booksForTopic
            );

            if (!assignment) {
                position.bookIndex++;
                continue;
            }

            assignments.push(assignment);
            versesRemaining -= (assignment.end_verse_id + 1) - assignment.start_verse_id;

            console.log("verses remaining", versesRemaining);
            // Safety check
            if (assignments.length > 10) {
                console.warn("Too many assignments generated, stopping");
                break;
            }
        }

        return assignments;
    }

    /**
     * Create a single reading assignment
     */
    private async createSingleAssignment(
        position: ReadingPosition,
        versesNeeded: number,
        planName: string,
        date: Date,
        topic: ReadingTopic,
        booksForTopic: BibleBookTopic[]
    ): Promise<DailyReadingAssignment | null> {
        const currentBookTopic = booksForTopic[position.bookIndex];
        const currentBook = position.allBooks.find(b => b.BibleBookId === currentBookTopic.bible_book_id);

        if (!currentBook) {
            return null;
        }

        const chaptersInBook = position.allChapters
            .filter(ch => ch.BookNumber === currentBookTopic.bible_book_id)
            .sort((a, b) => <number>a.ChapterNumber - <number>b.ChapterNumber);

        if (chaptersInBook.length === 0) {
            return null;
        }

        // Determine starting position
        const startPosition: { chapterId: number; verseId: number } | null = this.getStartPosition(position, chaptersInBook);
        if (!startPosition) {
            return null;
        }

        // Calculate reading range
        const readingRange = this.calculateReadingRange(
            startPosition,
            versesNeeded,
            chaptersInBook,
            position
        );

        // Get verse labels for display
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

    /**
     * Get starting position for reading
     */
    private getStartPosition(
        position: ReadingPosition,
        chaptersInBook: BibleChapter[]
    ): { chapterId: number; verseId: number } | null {
        if (position.chapterId && position.verseId) {
            // Continue from current position
            return {
                chapterId: position.chapterId,
                verseId: position.verseId
            };
        } else {
            // Start from first chapter
            const firstChapter = chaptersInBook[0];
            if (!firstChapter) return null;

            return {
                chapterId: <number>firstChapter.BibleChapterId,
                verseId: <number>firstChapter.FirstVerseId
            };
        }
    }

    /**
     * Calculate the range of verses to read
     */
    private calculateReadingRange(
        startPosition: { chapterId: number; verseId: number },
        versesNeeded: number,
        chaptersInBook: BibleChapter[],
        position: ReadingPosition
    ): { startVerseId: number; endVerseId: number } {
        const startChapter = chaptersInBook.find(ch => ch.BibleChapterId === startPosition.chapterId);
        if (!startChapter) {
            throw new Error(`Could not find chapter ${startPosition.chapterId}`);
        }

        let endVerseId = Math.min(
            startPosition.verseId + versesNeeded - 1,
            <number>startChapter.LastVerseId
        );

        // Update position for next time
        if (endVerseId < <number>startChapter.LastVerseId) {
            // Didn't finish current chapter
            position.verseId = endVerseId + 1;
        } else {
            // Finished current chapter, move to next
            const currentChapterIndex = chaptersInBook.findIndex(ch => ch.BibleChapterId === startPosition.chapterId);
            if (currentChapterIndex + 1 < chaptersInBook.length) {
                const nextChapter = chaptersInBook[currentChapterIndex + 1];
                position.chapterId = nextChapter.BibleChapterId;
                position.verseId = nextChapter.FirstVerseId;
            } else {
                // Finished book, move to next
                position.bookIndex++;
                position.chapterId = undefined;
                position.verseId = undefined;
            }
        }

        return {
            startVerseId: startPosition.verseId,
            endVerseId
        };
    }

    /**
     * Update reading progress
     */
    private async updateReadingProgress(
        progress: ReadingPlanProgress,
        position: ReadingPosition,
        topicId: number,
        dailyVerseGoal: number
    ): Promise<void> {
        const finalBookId = position.bookIndex < position.allBooks.length
            ? position.allBooks[position.bookIndex].BibleBookId
            : position.allBooks[position.allBooks.length - 1].BibleBookId;

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

    /**
     * Calculate number of verses from verse labels (approximate)
     */
    private getVerseCountFromLabels(startLabel: string, endLabel: string): number {
        // This is a simplified approach - you might need more sophisticated parsing
        // For now, assume 1 verse per assignment to prevent infinite loops
        return 1;
    }

    /**
     * Generates chronological reading assignment
     */
    private async generateChronologicalAssignment(plan: any, date: Date): Promise<DailyReadingAssignment> {
        // Use similar structure to sequential but with chronological ordering
        const progress = await this.getOrCreateProgress(plan.id);
        const preferences = await this.getUserPreferences();
        const versesToRead = preferences.dailyVerseGoal || 10;

        // For now, using sequential logic - you'd implement chronological ordering here
        const startVerseId = progress.current_verse_id || 1;
        const endVerseId = startVerseId + versesToRead - 1;

        const [startVerse, endVerse] = await Promise.all([
            bibleVerseRepository.findById(startVerseId),
            bibleVerseRepository.findById(endVerseId)
        ]);

        if (!startVerse || !endVerse) {
            throw new Error('Could not find verse range for chronological reading');
        }

        const allChapters = await bibleChapterRepository.findAll();
        const startChapter = allChapters.find(ch =>
            startVerseId >= <number>ch.FirstVerseId && startVerseId <= <number>ch.LastVerseId
        );

        await readingPlanProgressRepository.update({
            id: progress.id,
            current_verse_id: endVerseId + 1,
            verses_read_today: versesToRead,
            last_updated: new Date().toISOString()
        });

        return {
            id: 0,
            date: this.formatDate(date),
            plan_name: plan.plan_name,
            chapter_id: startChapter?.BibleChapterId || 1,
            start_verse_id: startVerseId,
            end_verse_id: endVerseId,
            display_title: `Chronological Reading`,
            is_completed: false,
            completed_at: null
        };
    }

    /**
     * Gets or creates reading plan progress record
     */
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

    /**
     * Gets user reading preferences
     */
    private async getUserPreferences(): Promise<ReadingPreferences> {
        const allPreferences = await readingPreferencesRepository.findAll();
        let preferences: ReadingPreferences | undefined = allPreferences.find(p => p.userId === 1);

        if (!preferences) {
            preferences = await readingPreferencesRepository.create({
                userId: 1,
                dailyVerseGoal: 10,
                preferredReadingTime: 'morning'
            });
        }

        return preferences;
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
            const existingProgress = allProgress.find(progress =>
                progress.bibleVerseId === bibleVerseId && progress.dateRead === dateStr
            );

            if (existingProgress) {
                if (!existingProgress.isRead) {
                    await bibleVerseProgressRepository.update({
                        id: existingProgress.id,
                        isRead: true
                    });
                }
            } else {
                await bibleVerseProgressRepository.create({
                    bibleVerseId,
                    dateRead: dateStr,
                    isRead: true
                });
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to mark verse as read: ${bibleVerseId}`, error as Error);
        }
    }

    /**
     * Marks a daily reading assignment as read/unread
     */
    async markDailyReadingAssignmentAsRead(
        dailyReadingAssignment: DailyReadingAssignment,
        date: Date = new Date(),
        isRead: boolean = true
    ): Promise<void> {
        this.validateInput(date, 'date', 'date');

        try {
            console.log("marking assignment as read:", dailyReadingAssignment);
            const readAssignments = await dailyReadingAssignmentsRepository.findAll();
            const existingAssignment = readAssignments.find(assignment =>
                assignment.start_verse_id == dailyReadingAssignment.start_verse_id &&
                assignment.end_verse_id == dailyReadingAssignment.end_verse_id &&
                assignment.date === this.formatDate(date)
            );

            console.log("existing assignment:", existingAssignment);
            if (existingAssignment) {
                await dailyReadingAssignmentsRepository.update({
                    id: existingAssignment.id,
                    chapter_id: existingAssignment.chapter_id,
                    is_completed: isRead,
                    completed_at: isRead ? date.toISOString().split('T')[0] : undefined
                });
                return;
            }

            console.log("creating assignment:", dailyReadingAssignment);
            await dailyReadingAssignmentsRepository.create({
                date: date.toISOString().split('T')[0],
                plan_name: dailyReadingAssignment.plan_name || "chronological",
                chapter_id: dailyReadingAssignment.chapter_id,
                start_verse_id: dailyReadingAssignment.start_verse_id,
                end_verse_id: dailyReadingAssignment.end_verse_id,
                display_title: dailyReadingAssignment.display_title || "Reading Assignment",
                is_completed: isRead,
                completed_at: isRead ? date.toISOString().split('T')[0] : undefined
            });

        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to mark dailyReadingAssignment as read: ${dailyReadingAssignment}`, error as Error);
        }
    }

    /**
     * Unmarks a Bible verse as read by removing its progress record
     */
    async unmarkVerseAsRead(bibleVerseId: number): Promise<void> {
        this.validateInput(bibleVerseId, 'number', 'bibleVerseId');

        try {
            const allProgress = await bibleVerseProgressRepository.findAll();
            const progressToRemove = allProgress.filter(progress =>
                progress.bibleVerseId === bibleVerseId
            );

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
                    plan_name: "Sequential Reading",
                    plan_type: "sequential",
                    is_active: true
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
            return allProgress.filter(progress =>
                progress.dateRead >= startDateStr && progress.dateRead <= endDateStr
            );
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
                        id: plan.id,
                        is_active: false
                    });
                }
            }

// Activate the selected plan
            let targetPlan = allPlans.find(p => p.plan_type === planType);
            if (!targetPlan) {
                targetPlan = await readingPlanConfigRepository.create({
                    plan_name: this.getPlanDisplayName(planType),
                    plan_type: planType,
                    is_active: true
                });
            } else {
                await readingPlanConfigRepository.update({
                    id: targetPlan.id,
                    is_active: true
                });
            }

        } catch (error: any) {
            throw new DatabaseMessageError('Failed to switch reading plan', error as Error);
        }
    }

    /**
     * Gets display name for plan type
     */
    private getPlanDisplayName(planType: string): string {
        const names: Record<string, string> = {
            'sequential': 'Sequential Reading',
            'topical': 'Topical Weekly',
            'chronological': 'Chronological Reading'
        };
        return names[planType] || planType;
    }

    /**
     * Validates input parameters
     */
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

    /**
     * Formats date to ISO string (YYYY-MM-DD)
     */
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}

export const readingService = new ReadingService();
