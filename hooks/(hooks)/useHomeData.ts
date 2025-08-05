
// Optimized useHomeData.ts
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { TaskService, progressService } from '@/services';
import { DailyReadingAssignment, EnhancedDailyReadingAssignment, ReadingPlan } from "@/models";
import { useAchievementContext } from '@/components/progress/AchievementContext';

export function useHomeData() {
    const { addAchievementEvents } = useAchievementContext();

    // State management
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [readingPlan, setReadingPlan] = useState<ReadingPlan[]>([]);
    const [dailyReadingAssignments, setDailyReadingAssignments] = useState<Map<string, EnhancedDailyReadingAssignment[]>>();
    const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});
    const [confirmationTask, setConfirmationTask] = useState<string | null>(null);
    const [weeklyChecklistItems, setWeeklyChecklistItems] = useState<string[]>([]);
    const [dailyChecklistItems, setDailyChecklistItems] = useState<string[]>([]);

    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, [new Date().toDateString()]);

    const taskService = useMemo(() => new TaskService(), []);

    // Debounced achievement checking to avoid excessive calls
    const checkForAchievementUnlocks = useCallback(async (userId: number = 1) => {
        try {
            const unlockedEvents = await progressService.updateAchievementProgressFromDatabase(userId);
            if (unlockedEvents.length > 0) {
                addAchievementEvents(unlockedEvents);
            }
            return unlockedEvents;
        } catch (error) {
            console.error('Error checking achievements:', error);
            return [];
        }
    }, [addAchievementEvents]);

    // Optimized data fetching - reduce redundant operations
    const fetchAssignments = useCallback(async (): Promise<void> => {
        try {
            const todayDateStr = today.toISOString().split('T')[0];
            const assignments = await taskService.fetchReadingAssignments(today);

            // Filter and group in one pass
            const assignmentMap = new Map<string, EnhancedDailyReadingAssignment[]>();

            assignments
                .filter(item => item.date === todayDateStr)
                .forEach(item => {
                    const title = item.display_title || 'Reading Assignment';
                    if (!assignmentMap.has(title)) {
                        assignmentMap.set(title, []);
                    }
                    assignmentMap.get(title)!.push(item);
                });

            // Sort once per group
            assignmentMap.forEach(assignmentList => {
                assignmentList.sort((a, b) => a.start_verse_id - b.start_verse_id);
            });

            setDailyReadingAssignments(assignmentMap);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setDailyReadingAssignments(new Map());
        }
    }, [taskService, today]);

    // Parallel data loading
    const loadInitialData = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            // Load all data in parallel
            await Promise.all([
                (async () => {
                    const { weeklyTasks, dailyTasks } = await taskService.getTaskLists(today);
                    setWeeklyChecklistItems(weeklyTasks);
                    setDailyChecklistItems(dailyTasks);
                })(),
                fetchAssignments(),
                (async () => {
                    const states = await taskService.fetchTaskStates(today);
                    setTaskStatus(states);
                })()
            ]);
        } finally {
            setLoading(false);
        }
    }, [taskService, today, fetchAssignments]);

    const onRefresh = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        try {
            await Promise.all([
                (async () => {
                    const { weeklyTasks, dailyTasks } = await taskService.getTaskLists(today);
                    setWeeklyChecklistItems(weeklyTasks);
                    setDailyChecklistItems(dailyTasks);
                })(),
                fetchAssignments(),
                (async () => {
                    const states = await taskService.fetchTaskStates(today);
                    setTaskStatus(states);
                })()
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [taskService, today, fetchAssignments]);

    // Optimized toggle with minimal refreshing
    const handleToggleVerses = useCallback(async (item: DailyReadingAssignment): Promise<void> => {
        try {
            const wasCompleted = item.is_completed;

            // Optimistic update
            setDailyReadingAssignments(prevAssignments => {
                const newAssignments = new Map(prevAssignments);
                newAssignments.forEach((assignments, title) => {
                    const updatedAssignments = assignments.map(assignment => {
                        if (assignment.id === item.id) {
                            return {
                                ...assignment,
                                is_completed: !assignment.is_completed,
                                completed_at: !assignment.is_completed ? new Date().toISOString().split('T')[0] : null
                            };
                        }
                        return assignment;
                    });
                    newAssignments.set(title, updatedAssignments);
                });
                return newAssignments;
            });

            // Database operation
            if (wasCompleted) {
                await taskService.unmarkDailyAssignmentAsRead(item);
            } else {
                await taskService.markDailyAssignmentAsRead(item);
                // Only check achievements on completion, not on every toggle
                setTimeout(() => checkForAchievementUnlocks(), 100); // Debounced
            }

            // Only refresh task states, not all assignments
            const states = await taskService.fetchTaskStates(today);
            setTaskStatus(states);

        } catch (error) {
            console.error('Error toggling verse completion:', error);
            // Revert on error
            await fetchAssignments();
            throw error;
        }
    }, [taskService, today, fetchAssignments, checkForAchievementUnlocks]);

    const confirmTaskCompletion = useCallback(async (task: string | null = confirmationTask, status: any): Promise<void> => {
        if (!task) return;

        if (status === undefined) {
            status = !taskStatus[task];
        }

        await taskService.toggleTaskCompletion(task, status, today);
        setTaskStatus(prev => ({ ...prev, [task]: status }));
        setConfirmationTask(null);

        // Only check achievements when completing tasks, with debounce
        if (status) {
            setTimeout(() => checkForAchievementUnlocks(), 100);
        }
    }, [confirmationTask, taskService, today, taskStatus, checkForAchievementUnlocks]);

    const handleReadMore = useCallback(async (): Promise<void> => {
        try {
            const additionalAssignments = await taskService.generateAdditionalAssignments(today);

            if (additionalAssignments.length === 0) {
                return;
            }

            // Only refresh assignments, not all data
            await fetchAssignments();
            const states = await taskService.fetchTaskStates(today);
            setTaskStatus(states);

            // Debounced achievement check
            setTimeout(() => checkForAchievementUnlocks(), 100);

        } catch (error) {
            console.error('Error generating additional assignments:', error);
            throw error;
        }
    }, [taskService, today, fetchAssignments, checkForAchievementUnlocks]);

    useFocusEffect(
        useCallback(() => {
            loadInitialData();
        }, [loadInitialData])
    );

    return {
        loading,
        refreshing,
        readingPlan,
        taskStatus,
        confirmationTask,
        today,
        dailyReadingAssignments,
        weeklyChecklistItems,
        dailyChecklistItems,
        onRefresh,
        handleToggleVerses,
        handleConfirmationTaskSet: useCallback((task: string) => setConfirmationTask(task), []),
        handleConfirmationCancel: useCallback(() => setConfirmationTask(null), []),
        confirmTaskCompletion,
        handleReadMore,
    };
}
