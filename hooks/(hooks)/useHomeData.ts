import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { TaskService } from '@/services';
import {DailyReadingAssignment, ReadingPlan} from "@/models";

export function useHomeData() {
    // State management
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [readingPlan, setReadingPlan] = useState<ReadingPlan[]>([]);
    const [dailyReadingAssignments, setDailyReadingAssignments] = useState<DailyReadingAssignment[]>([]);
    const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});
    const [confirmationTask, setConfirmationTask] = useState<string | null>(null);

    // New state for dynamic task lists
    const [weeklyChecklistItems, setWeeklyChecklistItems] = useState<string[]>([]);
    const [dailyChecklistItems, setDailyChecklistItems] = useState<string[]>([]);

    // Memoized values
    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, [new Date().toDateString()]); // Updates when date string changes

    const taskService = useMemo(() => new TaskService(), []);

    // Data fetching methods
    const fetchReadingPlan = useCallback(async (): Promise<void> => {
        const plan = await taskService.fetchReadingPlan();
        setReadingPlan(plan);
    }, [taskService]);

    const fetchTaskLists = useCallback(async (): Promise<void> => {
        const { weeklyTasks, dailyTasks } = await taskService.getTaskLists(today);
        setWeeklyChecklistItems(weeklyTasks);
        setDailyChecklistItems(dailyTasks);
    }, [taskService, today]);

    const fetchTaskStates = useCallback(async (): Promise<void> => {
        const states = await taskService.fetchTaskStates(today);
        setTaskStatus(states);
    }, [taskService, today]);

    const fetchAssignments = useCallback(async (): Promise<void> => {
        const assignments = await taskService.fetchReadingAssignments();
        setDailyReadingAssignments(assignments);
    }, [taskService]);

    const loadInitialData = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            await Promise.all([
                fetchTaskLists(),
                fetchAssignments(),
                fetchTaskStates()
            ]);
        } finally {
            setLoading(false);
        }
    }, [fetchTaskLists, fetchAssignments, fetchTaskStates]);

    const onRefresh = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchTaskLists(),
                fetchAssignments(),
                fetchTaskStates()
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [fetchTaskLists, fetchAssignments, fetchTaskStates]);

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

        await taskService.toggleTaskCompletion(task, status, today);
        setTaskStatus(prev => ({ ...prev, [task]: status }));
        setConfirmationTask(null);
        onRefresh()
    }, [confirmationTask, taskService, today, taskStatus, onRefresh]);

    // Lifecycle effects
    useFocusEffect(
        useCallback(() => {
            loadInitialData();
        }, [loadInitialData])
    );

    return {
        // State
        loading,
        refreshing,
        readingPlan,
        taskStatus,
        confirmationTask,
        today,
        dailyReadingAssignments,

        // Dynamic task lists from database
        weeklyChecklistItems,
        dailyChecklistItems,

        // Actions
        onRefresh,
        handleToggleVerses,
        handleConfirmationTaskSet,
        handleConfirmationCancel,
        confirmTaskCompletion
    };
}
