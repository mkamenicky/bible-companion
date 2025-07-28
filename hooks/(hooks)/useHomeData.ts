import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { TaskService } from '@/services';
import {DailyReadingAssignment, ReadingPlan} from "@/models";

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
    const [dailyReadingAssignments, setDailyReadingAssignments] = useState<DailyReadingAssignment[]>([]);
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

    const fetchAssignments = useCallback(async (): Promise<void> => {
        const assignments = await taskService.fetchReadingAssignments();
        setDailyReadingAssignments(assignments);
    }, [taskService]);

    const onRefresh = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        await Promise.all([fetchAssignments(), fetchTaskStates()]);
        setRefreshing(false);
    }, [fetchAssignments, fetchTaskStates]);

    // Event handlers
    const handleToggleVerses = useCallback(async (item: DailyReadingAssignment): Promise<void> => {
        if(item.is_completed) {
            await taskService.unmarkDailyAssignmentAsRead(item);
        }else{
            await taskService.markDailyAssignmentAsRead(item);
        }

        await fetchAssignments();
        await fetchTaskStates();
    }, [taskService, fetchTaskStates, fetchAssignments]);

    const handleConfirmationTaskSet = useCallback((task: string): void => {
        setConfirmationTask(task);
    }, []);

    const handleConfirmationCancel = useCallback((): void => {
        setConfirmationTask(null);
    }, []);

    const confirmTaskCompletion = useCallback(async (task: string | null = confirmationTask, status: any ): Promise<void> => {
        if (!task) return;

        if(status === undefined){
            status = !taskStatus[task];
        }

        console.log('Confirming task completion:', task);

        await taskService.toggleTaskCompletion(task, status);
        setTaskStatus(prev => ({ ...prev, [task]: status }));
        setConfirmationTask(null);
        onRefresh()
    }, [confirmationTask, taskService, onRefresh]);

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
        dailyReadingAssignments,

        // Constants
        weeklyChecklistItems: WEEKLY_CHECKLIST_ITEMS,
        dailyChecklistItems: DAILY_CHECKLIST_ITEMS,

        // Actions
        onRefresh,
        handleToggleVerses,
        handleConfirmationTaskSet,
        handleConfirmationCancel,
        confirmTaskCompletion
    };
}
