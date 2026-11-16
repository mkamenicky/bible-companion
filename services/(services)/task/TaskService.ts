import {tasksRepository} from '@/repository';
import type {AchievementUnlockEvent} from '@/models';
import {DAILY_TASKS, WEEKLY_TASKS, weeklyTaskKey} from '@/constants/tasks';
import {progressService} from '@/services/(services)/progress/ProgressService';
import {DatabaseError} from '@/errors';
import {getMondayOfWeek, toLocalDateString} from '@/utils/(utils)/date.utils';
import {validateInput} from '@/utils/(utils)/validation.utils';
import {logger} from '@/utils/(utils)/logger';

/**
 * The weekly and daily checklists on the home screen.
 */
export class TaskService {

    /** Task names for the checklists. */
    getTaskLists(): { weeklyTasks: string[]; dailyTasks: string[] } {
        return {weeklyTasks: [...WEEKLY_TASKS], dailyTasks: [...DAILY_TASKS]};
    }

    /**
     * Done-state of every weekly and daily task for the given day,
     * keyed by task name.
     */
    async getTaskStates(date: Date = new Date()): Promise<Record<string, boolean>> {
        validateInput(date, 'date', 'date');

        const today = toLocalDateString(date);
        const monday = getMondayOfWeek(date);

        try {
            const [weekRows, dayRows] = await Promise.all([
                tasksRepository.findByDate(monday),
                tasksRepository.findByDate(today),
            ]);

            const states: Record<string, boolean> = {};
            for (const taskName of WEEKLY_TASKS) {
                const key = weeklyTaskKey(taskName, monday);
                states[taskName] = weekRows.some(row => row.task_name === key && row.is_done);
            }
            for (const taskName of DAILY_TASKS) {
                states[taskName] = dayRows.some(row => row.task_name === taskName && row.is_done);
            }
            return states;
        } catch (error) {
            throw new DatabaseError('Failed to load task states', error);
        }
    }

    /**
     * Marks a task as done or not done for the given day (or its week).
     * @returns achievements unlocked by this (consistency achievements)
     */
    async setTaskState(taskName: string, done: boolean, date: Date = new Date()): Promise<AchievementUnlockEvent[]> {
        validateInput(taskName, 'string', 'taskName');
        validateInput(date, 'date', 'date');

        try {
            if (WEEKLY_TASKS.includes(taskName)) {
                const monday = getMondayOfWeek(date);
                await tasksRepository.upsert(monday, weeklyTaskKey(taskName, monday), done);
            } else {
                await tasksRepository.upsert(toLocalDateString(date), taskName, done);
            }
        } catch (error) {
            throw new DatabaseError(`Failed to save task state for: ${taskName}`, error);
        }

        // The task is saved; a problem while updating achievements must not
        // make the check-off itself look failed.
        try {
            return done ? await progressService.updateAchievementProgress() : [];
        } catch (error) {
            logger.error('Failed to update achievements after a task change', error);
            return [];
        }
    }
}

export const taskService = new TaskService();
