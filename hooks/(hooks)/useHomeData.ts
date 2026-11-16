import {useCallback, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {readingService, taskService} from '@/services';
import type {AchievementUnlockEvent, DailyReadingAssignment, EnhancedDailyReadingAssignment} from '@/models';
import {useAchievementContext} from '@/components/progress/AchievementContext';
import {startOfDay, toLocalDateString} from '@/utils/(utils)/date.utils';
import {logger} from '@/utils/(utils)/logger';

const {weeklyTasks: WEEKLY_TASKS, dailyTasks: DAILY_TASKS} = taskService.getTaskLists();

/** Groups assignments by their card title, each group in reading order. */
function groupByTitle(assignments: EnhancedDailyReadingAssignment[]): Map<string, EnhancedDailyReadingAssignment[]> {
    const groups = new Map<string, EnhancedDailyReadingAssignment[]>();
    for (const assignment of assignments) {
        const title = assignment.display_title || 'Reading Assignment';
        const group = groups.get(title);
        if (group) {
            group.push(assignment);
        } else {
            groups.set(title, [assignment]);
        }
    }
    groups.forEach(group => group.sort((a, b) => a.start_verse_id - b.start_verse_id));
    return groups;
}

/**
 * Data and actions of the home screen: today's reading assignments and the
 * daily/weekly checklists.
 */
export function useHomeData() {
    const {addAchievementEvents} = useAchievementContext();

    const [loading, setLoading] = useState(true);
    const [today, setToday] = useState<Date>(() => startOfDay());
    const [dailyReadingAssignments, setDailyReadingAssignments] = useState<Map<string, EnhancedDailyReadingAssignment[]>>(new Map());
    const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});

    const showUnlocks = useCallback((events: AchievementUnlockEvent[]) => {
        if (events.length > 0) addAchievementEvents(events);
    }, [addAchievementEvents]);

    /** Loads assignments and task states for the given day. */
    const loadDay = useCallback(async (day: Date): Promise<void> => {
        const [assignments, states] = await Promise.all([
            readingService.getAssignmentsForDate(day).catch(error => {
                logger.error('Error fetching assignments', error);
                return [] as EnhancedDailyReadingAssignment[];
            }),
            taskService.getTaskStates(day).catch(error => {
                logger.error('Error fetching task states', error);
                return {} as Record<string, boolean>;
            }),
        ]);

        setDailyReadingAssignments(groupByTitle(assignments));
        setTaskStatus(states);
    }, []);

    // Reload whenever the screen gains focus. "Today" is re-read each time so
    // the screen moves on to the next day when the app stays open overnight.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            const day = startOfDay();
            setToday(previous => (toLocalDateString(previous) === toLocalDateString(day) ? previous : day));

            loadDay(day).finally(() => {
                if (active) setLoading(false);
            });

            return () => {
                active = false;
            };
        }, [loadDay])
    );

    const onRefresh = useCallback(async (): Promise<void> => {
        const day = startOfDay();
        setToday(day);
        await loadDay(day);
    }, [loadDay]);

    /** Checks a reading assignment off, or re-opens a completed one. */
    const handleToggleVerses = useCallback(async (item: DailyReadingAssignment): Promise<void> => {
        const nowCompleted = !item.is_completed;

        // Optimistic update; reverted by a reload if saving fails.
        setDailyReadingAssignments(previous => {
            const next = new Map(previous);
            next.forEach((assignments, title) => {
                next.set(title, assignments.map(assignment => assignment.id === item.id
                    ? {...assignment, is_completed: nowCompleted, completed_at: nowCompleted ? toLocalDateString() : null}
                    : assignment));
            });
            return next;
        });

        try {
            if (nowCompleted) {
                showUnlocks(await readingService.completeAssignment(item));
            } else {
                await readingService.reopenAssignment(item);
            }
        } catch (error) {
            logger.error('Error toggling assignment', error);
            await loadDay(today);
        }
    }, [loadDay, today, showUnlocks]);

    /** Sets a checklist task to done / not done. */
    const confirmTaskCompletion = useCallback(async (task: string | null, status?: boolean): Promise<void> => {
        if (!task) return;
        const done = status ?? !taskStatus[task];

        setTaskStatus(previous => ({...previous, [task]: done}));
        try {
            showUnlocks(await taskService.setTaskState(task, done, today));
        } catch (error) {
            logger.error('Error saving task state', error);
            setTaskStatus(previous => ({...previous, [task]: !done}));
        }
    }, [taskStatus, today, showUnlocks]);

    /** "Read more": adds further passages to today's reading. */
    const handleReadMore = useCallback(async (): Promise<void> => {
        const added = await readingService.addMoreAssignments(today);
        if (added.length > 0) {
            await loadDay(today);
        }
    }, [today, loadDay]);

    return {
        loading,
        today,
        taskStatus,
        dailyReadingAssignments,
        weeklyChecklistItems: WEEKLY_TASKS,
        dailyChecklistItems: DAILY_TASKS,
        onRefresh,
        handleToggleVerses,
        confirmTaskCompletion,
        handleReadMore,
    };
}
