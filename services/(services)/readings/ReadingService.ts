import type {ReadingPlan, TaskStates, MutableTaskStates} from "@/models";
import {DatabaseMessageError, ValidationError} from '@/errors';
import {getMondayOfWeek} from "@/utils";
import {
    bibleBookRepository,
    bibleChapterRepository,
    bibleVerseProgressRepository,
    bibleVerseRepository,
    tasksRepository
} from '@/repository';

/**
 * Service class for managing Bible reading progress and tasks
 * Handles business logic for reading plans, task states, and verse progress
 */
export class ReadingService {
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

    /**
     * Sets the completion state of a task for a specific date
     */
    async setTaskState(taskName: string, date: Date, done: boolean): Promise<void> {
        this.validateInput(taskName, 'string', 'taskName');
        this.validateInput(date, 'date', 'date');

        const dateStr = this.formatDate(date);

        try {
            // Try to find existing task
            const allTasks = await tasksRepository.findAll();
            const existingTask = allTasks.find(task =>
                task.date === dateStr && task.task_name === taskName
            );

            if (existingTask) {
                // Update existing task
                await tasksRepository.update({
                    id: existingTask.id,
                    is_done: done
                });
            } else {
                // Create new task
                await tasksRepository.create({
                    date: dateStr,
                    task_name: taskName,
                    is_done: done
                });
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to set task state for: ${taskName}`, error as Error);
        }
    }

    /**
     * Gets the completion states of weekly tasks starting from Monday
     */
    async getWeeklyTaskStates(date: Date, weeklyTasks: readonly string[]): Promise<TaskStates> {
        this.validateInput(date, 'date', 'date');

        if (!Array.isArray(weeklyTasks)) {
            throw new ValidationError('weeklyTasks must be an array');
        }

        const mondayStr = getMondayOfWeek(date);

        try {
            // Get all tasks from the repository
            const allTasks = await tasksRepository.findAll();

            // Filter tasks that are from Monday onwards
            const weekTasks = allTasks.filter(task => task.date >= mondayStr);

            const result: MutableTaskStates = {};
            for (const task of weeklyTasks) {
                const match = weekTasks.find(t => t.task_name === task && t.is_done === true);
                result[task] = !!match;
            }

            return result as TaskStates;
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get weekly task states', error as Error);
        }
    }

    /**
     * Gets the completion states of daily tasks for a specific date
     */
    async getDailyTaskStates(date: Date, dailyTasks: readonly string[]): Promise<TaskStates> {
        this.validateInput(date, 'date', 'date');

        if (!Array.isArray(dailyTasks)) {
            throw new ValidationError('dailyTasks must be an array');
        }

        if (dailyTasks.length === 0) {
            return {} as TaskStates;
        }

        const dateStr = this.formatDate(date);

        try {
            // Get all tasks from the repository
            const allTasks = await tasksRepository.findAll();

            // Filter tasks for the specific date and task names
            const dayTasks = allTasks.filter(task =>
                task.date === dateStr && dailyTasks.includes(task.task_name)
            );

            const result: MutableTaskStates = {};
            for (const task of dailyTasks) {
                const match = dayTasks.find(t => t.task_name === task && t.is_done === true);
                result[task] = !!match;
            }

            return result as TaskStates;
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get daily task states', error as Error);
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
            // Get all progress records to find existing one
            const allProgress = await bibleVerseProgressRepository.findAll();
            const existingProgress = allProgress.find(progress =>
                progress.bibleVerseId === bibleVerseId && progress.dateRead === dateStr
            );

            if (existingProgress) {
                // Update existing progress if it's not already marked as read
                if (!existingProgress.isRead) {
                    await bibleVerseProgressRepository.update({
                        id: existingProgress.id,
                        isRead: true
                    });
                }
            } else {
                // Create new progress record
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
     * Unmarks a Bible verse as read by removing its progress record
     */
    async unmarkVerseAsRead(bibleVerseId: number): Promise<void> {
        this.validateInput(bibleVerseId, 'number', 'bibleVerseId');

        try {
            // Get all progress records to find ones for this verse
            const allProgress = await bibleVerseProgressRepository.findAll();
            const progressToRemove = allProgress.filter(progress =>
                progress.bibleVerseId === bibleVerseId
            );

            // Delete all progress records for this verse
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
        try {
            // Get the first Bible book (you may want to make this configurable)
            const book = await bibleBookRepository.findById(1);
            if (!book) {
                return [];
            }

            // Use repository method to find chapters by book number if available
            // Otherwise fallback to filtering all chapters
            let bookChapters;
            if (typeof bibleChapterRepository.findByBookNumber === 'function') {
                bookChapters = await bibleChapterRepository.findByBookNumber(book.BibleBookId);
            } else {
                const allChapters = await bibleChapterRepository.findAll();
                bookChapters = allChapters.filter(chapter =>
                    chapter.BookNumber === book.BibleBookId
                );
            }

            if (bookChapters.length === 0) {
                return [];
            }

            // For now, get the first chapter (you may want to implement more logic here)
            const chapter = bookChapters[0];

            // Get verses for this chapter using repository method
            if (!chapter.FirstVerseId || !chapter.LastVerseId) {
                return [{
                    bibleBook: book,
                    bibleChapter: chapter,
                    bibleVerses: []
                }];
            }

            const verses = await bibleVerseRepository.findByRange(
                chapter.FirstVerseId,
                chapter.LastVerseId
            );

            return [{
                bibleBook: book,
                bibleChapter: chapter,
                bibleVerses: verses
            }];
        } catch (error: unknown) {
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
            // Get all progress records from repository and filter by date range
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
}
