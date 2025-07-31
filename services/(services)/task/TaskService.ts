import {DailyReadingAssignment, EnhancedDailyReadingAssignment, ReadingPlan} from "@/models";
import {readingService} from "@/services/(services)/readings/ReadingService";
import {DatabaseMessageError, ValidationError} from '@/errors';
import {getMondayOfWeek} from "@/utils";
import {tasksRepository} from '@/repository'

// Default task templates
const DEFAULT_WEEKLY_TASKS = [
    'Weekly Bible Reading (Meeting)',
    'Midweek Meeting Preparation',
    'Weekend Meeting Preparation',
    'Family Worship',
];

const DEFAULT_DAILY_TASKS = ['Daily Text'];

// Helper function to generate task key for weekly tasks
function getWeeklyTaskKey(taskName: string, mondayDate: string): string {
    return `${taskName}_WEEKLY_${mondayDate}`;
}

export class TaskService {

    /**
     * Gets or creates weekly tasks for the current week
     */
    async getWeeklyTasks(date: Date = new Date()): Promise<string[]> {
        this.validateInput(date, 'date', 'date');

        const mondayStr = getMondayOfWeek(date);

        try {
            // Check if weekly tasks exist for this week by looking for our weekly task pattern
            const allTasks = await tasksRepository.findAll();
            const existingWeeklyTasks = allTasks.filter(task =>
                task.task_name.includes(`_WEEKLY_${mondayStr}`)
            );

            if (existingWeeklyTasks.length > 0) {
                // Extract original task names from the stored keys
                return existingWeeklyTasks.map(task =>
                    task.task_name.replace(`_WEEKLY_${mondayStr}`, '')
                );
            }

            // Create new weekly tasks for this week
            const newTasks: string[] = [];
            for (const taskName of DEFAULT_WEEKLY_TASKS) {
                const weeklyTaskKey = getWeeklyTaskKey(taskName, mondayStr);
                await tasksRepository.create({
                    date: mondayStr,
                    task_name: weeklyTaskKey,
                    is_done: false
                });
                newTasks.push(taskName);
            }

            return newTasks;
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get or create weekly tasks', error as Error);
        }
    }

    /**
     * Gets or creates daily tasks for the current date
     */
    async getDailyTasks(date: Date = new Date()): Promise<string[]> {
        this.validateInput(date, 'date', 'date');

        const dateStr = this.formatDate(date);

        try {
            // Check if daily tasks exist for this date
            const allTasks = await tasksRepository.findAll();
            const existingDailyTasks = allTasks.filter(task =>
                task.date === dateStr &&
                DEFAULT_DAILY_TASKS.includes(task.task_name) &&
                !task.task_name.includes('_WEEKLY_')
            );

            if (existingDailyTasks.length > 0) {
                return existingDailyTasks.map(task => task.task_name);
            }

            // Create new daily tasks for this date
            const newTasks: string[] = [];
            for (const taskName of DEFAULT_DAILY_TASKS) {
                await tasksRepository.create({
                    date: dateStr,
                    task_name: taskName,
                    is_done: false
                });
                newTasks.push(taskName);
            }

            return newTasks;
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get or create daily tasks', error as Error);
        }
    }

    /**
     * Gets the completion states of weekly tasks
     */
    async getWeeklyTaskStates(date: Date = new Date()): Promise<Record<string, boolean>> {
        const weeklyTasks = await this.getWeeklyTasks(date);
        const mondayStr = getMondayOfWeek(date);

        try {
            const allTasks = await tasksRepository.findAll();

            // Filter tasks that are weekly tasks from this week
            const weekTasks = allTasks.filter(task =>
                task.task_name.includes(`_WEEKLY_${mondayStr}`)
            );

            const result: Record<string, boolean> = {};
            for (const task of weeklyTasks) {
                const weeklyTaskKey = getWeeklyTaskKey(task, mondayStr);
                const match = weekTasks.find(t => t.task_name === weeklyTaskKey && t.is_done);
                result[task] = !!match;
            }

            return result;
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get weekly task states', error as Error);
        }
    }

    /**
     * Gets the completion states of daily tasks
     */
    async getDailyTaskStates(date: Date = new Date()): Promise<Record<string, boolean>> {
        const dailyTasks = await this.getDailyTasks(date);

        if (dailyTasks.length === 0) {
            return {};
        }

        const dateStr = this.formatDate(date);

        try {
            const allTasks = await tasksRepository.findAll();

            // Filter tasks for the specific date and task names (excluding weekly tasks)
            const dayTasks = allTasks.filter(task =>
                task.date === dateStr &&
                dailyTasks.includes(task.task_name) &&
                !task.task_name.includes('_WEEKLY_')
            );

            const result: Record<string, boolean> = {};
            for (const task of dailyTasks) {
                const match = dayTasks.find(t => t.task_name === task && t.is_done);
                result[task] = !!match;
            }

            return result;
        } catch (error: any) {
            throw new DatabaseMessageError('Failed to get daily task states', error as Error);
        }
    }

    /**
     * Gets combined task states (weekly + daily)
     */
    async fetchTaskStates(date: Date = new Date()): Promise<Record<string, boolean>> {
        const weekly = await this.getWeeklyTaskStates(date);
        const daily = await this.getDailyTaskStates(date);
        return {...weekly, ...daily};
    }

    /**
     * Sets the completion state of a task for a specific date
     */
    async setTaskState(taskName: string, date: Date, done: boolean): Promise<void> {
        this.validateInput(taskName, 'string', 'taskName');
        this.validateInput(date, 'date', 'date');

        const dateStr = this.formatDate(date);
        const mondayStr = getMondayOfWeek(date);

        // Determine if this is a weekly task and create appropriate task key
        let taskKey = taskName;
        let searchDate = dateStr;

        if (DEFAULT_WEEKLY_TASKS.includes(taskName)) {
            taskKey = getWeeklyTaskKey(taskName, mondayStr);
            searchDate = mondayStr;
        }

        try {
            // Try to find existing task
            const allTasks = await tasksRepository.findAll();
            const existingTask = allTasks.find(task =>
                task.date === searchDate && task.task_name === taskKey
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
                    date: searchDate,
                    task_name: taskKey,
                    is_done: done
                });
            }
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to set task state for: ${taskName}`, error as Error);
        }
    }

    /**
     * Toggles the completion state of a task
     */
    async toggleTaskCompletion(taskName: string, done: boolean, date: Date = new Date()): Promise<void> {
        if (!taskName) return;
        await this.setTaskState(taskName, date, done);
    }

    /**
     * Gets the task lists for UI rendering
     */
    async getTaskLists(date: Date = new Date()): Promise<{
        weeklyTasks: string[];
        dailyTasks: string[];
    }> {
        const [weeklyTasks, dailyTasks] = await Promise.all([
            this.getWeeklyTasks(date),
            this.getDailyTasks(date)
        ]);

        return { weeklyTasks, dailyTasks };
    }

    // Reading-related methods - these delegate to ReadingService
    async fetchReadingPlan(): Promise<ReadingPlan[]> {
        return await readingService.getReadingPlan();
    }

    async fetchReadingAssignments(): Promise<EnhancedDailyReadingAssignment[]> {
        return await readingService.fetchReadingAssignments();
    }

    async markDailyAssignmentAsRead(dailyReadingAssignment: DailyReadingAssignment): Promise<void> {
        console.log('Marking daily assignment as read:', dailyReadingAssignment);
        for (let verseId = dailyReadingAssignment.start_verse_id; verseId <= dailyReadingAssignment.end_verse_id; verseId++) {
            console.log('Marking verse as read on:', verseId, new Date());
            await readingService.markVerseAsRead(verseId, new Date());
        }

        await readingService.markDailyReadingAssignmentAsRead(dailyReadingAssignment, new Date(), true);
    }

    async unmarkDailyAssignmentAsRead(dailyReadingAssignment: DailyReadingAssignment): Promise<void> {
        console.log('Unmarking daily assignment as not read:', dailyReadingAssignment);
        for (let verseId = dailyReadingAssignment.start_verse_id; verseId <= dailyReadingAssignment.end_verse_id; verseId++) {
            console.log('Marking verse as not read:', verseId);
            await readingService.unmarkVerseAsRead(verseId);
        }

        await readingService.markDailyReadingAssignmentAsRead(dailyReadingAssignment, undefined, false);
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
