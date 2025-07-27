import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { TaskService } from '@/services/task/TaskService';
import { ReadingPlan } from '@/repository/reading.repository';

// Constants
const WEEKLY_CHECKLIST_ITEMS = [
    'Weekly Bible Reading (Meeting)',
    'Midweek Meeting Preparation',
    'Weekend Meeting Preparation',
    'Family Worship',
] as string[];

const DAILY_CHECKLIST_ITEMS = ['Daily Text'] as string[];

export function useHomeData() {
    // State management
    const [refreshing, setRefreshing] = useState(false);
    const [readingPlan, setReadingPlan] = useState<ReadingPlan[]>([]);
    const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});
    const [confirmationTask, setConfirmationTask] = useState<string | null>(null);

    // Memoized values
    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const taskService = useMemo(
        () => new TaskService(today, [...WEEKLY_CHECKLIST_ITEMS], [...DAILY_CHECKLIST_ITEMS]),
        [today]
    );

    // Data fetching methods
    const fetchReadingPlan = useCallback(async (): Promise<void> => {
        const plan = await taskService.fetchReadingPlan();
        setReadingPlan(plan);
    }, [taskService]);

    const fetchTaskStates = useCallback(async (): Promise<void> => {
        const states = await taskService.fetchTaskStates();
        setTaskStatus(states);
    }, [taskService]);

    const onRefresh = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        await Promise.all([fetchReadingPlan(), fetchTaskStates()]);
        setRefreshing(false);
    }, [fetchReadingPlan, fetchTaskStates]);

    // Event handlers
    const handleToggleVerses = useCallback(async (item: ReadingPlan): Promise<void> => {
        await taskService.markReadingPlanVersesAsRead(item);
        await fetchTaskStates();
    }, [taskService, fetchTaskStates]);

    const handleConfirmationTaskSet = useCallback((task: string): void => {
        setConfirmationTask(task);
    }, []);

    const handleConfirmationCancel = useCallback((): void => {
        setConfirmationTask(null);
    }, []);

    const confirmTaskCompletion = useCallback(async (): Promise<void> => {
        if (!confirmationTask) return;

        await taskService.confirmTaskCompletion(confirmationTask);
        setTaskStatus(prev => ({ ...prev, [confirmationTask]: true }));
        setConfirmationTask(null);
    }, [confirmationTask, taskService]);

    // Lifecycle effects
    useFocusEffect(
        useCallback(() => {
            onRefresh();
        }, [onRefresh])
    );

    return {
        // State
        refreshing,
        readingPlan,
        taskStatus,
        confirmationTask,
        today,

        // Constants
        weeklyChecklistItems: WEEKLY_CHECKLIST_ITEMS,
        dailyChecklistItems: DAILY_CHECKLIST_ITEMS,

        // Actions
        onRefresh,
        handleToggleVerses,
        handleConfirmationTaskSet,
        handleConfirmationCancel,
        confirmTaskCompletion,
    };
}
