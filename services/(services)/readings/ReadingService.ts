import {DailyReadingAssignment, MutableTaskStates, ReadingPlan, TaskStates} from "@/models";
import {DatabaseMessageError, ValidationError} from '@/errors';
import {getMondayOfWeek} from "@/utils";
import {bibleVerseProgressRepository} from '@/repository/(repositories)/bible-verse-progress.repository'
import {dailyReadingAssignmentsRepository} from '@/repository/(repositories)/daily-reading-assignments.repository'
import {readingPlanConfigRepository} from '@/repository/(repositories)/reading-plan-config.repository'
import {tasksRepository} from '@/repository/(repositories)/tasks.repository'

/**
 * Service class for managing Bible reading progress and tasks
 * Handles business logic for reading plans, task states, and verse progress
 */
export class ReadingService {
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
                const match = weekTasks.find(t => t.task_name === task && t.is_done);
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
                const match = dayTasks.find(t => t.task_name === task && t.is_done);
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

    async markDailyReadingAssignmentAsRead(dailyReadingAssignment: DailyReadingAssignment, date: Date = new Date(), isRead: boolean = true): Promise<void> {
        this.validateInput(date, 'date', 'date');
        try {
            console.log("marking assignment as read:", dailyReadingAssignment);
            const readAssignments = await dailyReadingAssignmentsRepository.findAll();
            const existingAssignment = readAssignments.find(assignment =>
                assignment.start_verse_id == dailyReadingAssignment.start_verse_id && assignment.end_verse_id == assignment.end_verse_id
            )

            console.log("existing assignment:", existingAssignment);
            if (existingAssignment) {
                dailyReadingAssignmentsRepository.update({
                    id: existingAssignment.id,
                    is_completed: isRead,
                    completed_at: date?.toISOString().split('T')[0]
                })
                return;
            }

            console.log("creating assignment:", dailyReadingAssignment);
            dailyReadingAssignmentsRepository.create({
                date: date?.toISOString().split('T')[0],
                plan_name: "cronological",
                start_verse_id: dailyReadingAssignment.start_verse_id,
                end_verse_id: dailyReadingAssignment.end_verse_id,
                display_title: "Cronological",
                is_completed: true,
                completed_at: date?.toISOString().split('T')[0]
            })

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
        console.log("fetching plans:");
        try {
            const readingPlanConfigs = await readingPlanConfigRepository.findAll();
            console.log("existingPlan:", readingPlanConfigs);
            let existingPlan = readingPlanConfigs.find(config =>
                config.plan_type === "cronological" && config.is_active
            );

            console.log("existingPlan:", existingPlan);

            if (!existingPlan) {
                existingPlan = await readingPlanConfigRepository.create({
                    plan_name: "Maximilians Test Plan",
                    plan_type: "cronological",
                    is_active: true
                })
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

    async fetchReadingAssignments(): Promise<DailyReadingAssignment[]> {
        try {
            console.log("fetching assignments:");
            const assignments = await dailyReadingAssignmentsRepository.findAll();
            const dailyReadingAssignments = assignments.filter(assignment => assignment.date === new Date().toISOString().split('T')[0]);

            console.log("found assignments:", dailyReadingAssignments);

            if (dailyReadingAssignments.length > 0) {
                return dailyReadingAssignments;
            }

            const dailyReadingAssignment = await dailyReadingAssignmentsRepository.create({
                date: new Date().toISOString().split('T')[0],
                plan_name: "cronological",
                start_verse_id: 1,
                end_verse_id: 30,
                display_title: "Genesis 1:1 - Genesis 1:30",
                is_completed: false
            });
            console.log("returning created assignments:", [dailyReadingAssignment]);

            return [dailyReadingAssignment];
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to fetch readingAssignments`, error as Error);
        }
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
