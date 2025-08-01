import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { TaskService } from '@/services';
import {DailyReadingAssignment, EnhancedDailyReadingAssignment, ReadingPlan} from "@/models";

export function useHomeData() {
    // State management
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [readingPlan, setReadingPlan] = useState<ReadingPlan[]>([]);
    const [dailyReadingAssignments, setDailyReadingAssignments] = useState<Map<string, EnhancedDailyReadingAssignment[]>>();
    const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});
    const [confirmationTask, setConfirmationTask] = useState<string | null>(null);

    // New state for dynamic task lists
    const [weeklyChecklistItems, setWeeklyChecklistItems] = useState<string[]>([]);
    const [dailyChecklistItems, setDailyChecklistItems] = useState<string[]>([]);

    // Also update the today calculation to ensure it's consistent
    const today = useMemo(() => {
        const now = new Date();
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        console.log('Today calculated as:', todayDate.toISOString().split('T')[0]);
        return todayDate;
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

    /**
     * Enhanced fetchAssignments that ensures fresh data
     */
    const fetchAssignments = useCallback(async (): Promise<void> => {
        try {
            const todayDateStr = today.toISOString().split('T')[0];
            console.log('Fetching fresh assignments for today:', todayDateStr);

            // Always fetch fresh data from the database
            const assignments = await taskService.fetchReadingAssignments(today);
            console.log('Fresh assignments fetched:', assignments.length, 'total');

            // Filter to ensure we only show today's assignments
            const todayAssignments = assignments.filter(item => {
                const itemDate = item.date;
                const isToday = itemDate === todayDateStr;
                if (!isToday) {
                    console.log(`Filtering out assignment from ${itemDate} (not today ${todayDateStr})`);
                }
                return isToday;
            });

            console.log('Assignments for today after filtering:', todayAssignments.length);

            // Group assignments by display_title
            const assignmentMap = new Map<string, EnhancedDailyReadingAssignment[]>();

            todayAssignments.forEach((item, index) => {
                const title = item.display_title || 'Reading Assignment';
                console.log(`Processing assignment ${index + 1}:`, {
                    id: item.id,
                    title,
                    verses: `${item.start_verse_id}-${item.end_verse_id}`,
                    completed: item.is_completed,
                    chapter: item.chapter_id
                });

                if (assignmentMap.has(title)) {
                    assignmentMap.get(title)?.push(item);
                } else {
                    assignmentMap.set(title, [item]);
                }
            });

            // Sort assignments within each group by start_verse_id for consistent ordering
            assignmentMap.forEach((assignmentList, title) => {
                assignmentList.sort((a, b) => a.start_verse_id - b.start_verse_id);
                console.log(`Sorted assignments for "${title}":`,
                    assignmentList.map(a => `${a.id}(${a.start_verse_id}-${a.end_verse_id})`).join(', '));
            });

            console.log('Final assignment groups:', Array.from(assignmentMap.keys()));

            setDailyReadingAssignments(assignmentMap);

        } catch (error) {
            console.error('Error fetching assignments:', error);
            setDailyReadingAssignments(new Map());
        }
    }, [taskService, today]);

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

    /**
     * Handles toggling verse completion with proper state management for new assignments
     */
    const handleToggleVerses = useCallback(async (item: DailyReadingAssignment): Promise<void> => {
        try {
            console.log('Toggling verses for assignment:', {
                id: item.id,
                start_verse: item.start_verse_id,
                end_verse: item.end_verse_id,
                current_status: item.is_completed,
                display_title: item.display_title
            });

            // Optimistically update UI state first for better UX
            setDailyReadingAssignments(prevAssignments => {
                const newAssignments = new Map(prevAssignments);

                newAssignments.forEach((assignments, title) => {
                    const updatedAssignments = assignments.map(assignment => {
                        if (assignment.id === item.id &&
                            assignment.start_verse_id === item.start_verse_id &&
                            assignment.end_verse_id === item.end_verse_id) {

                            console.log(`Optimistically updating assignment ${assignment.id} to ${!assignment.is_completed}`);
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

            // Perform the actual database operation
            if (item.is_completed) {
                console.log('Unmarking assignment as read');
                await taskService.unmarkDailyAssignmentAsRead(item);
            } else {
                console.log('Marking assignment as read');
                await taskService.markDailyAssignmentAsRead(item);
            }

            // Refresh the data to ensure consistency with database
            console.log('Refreshing assignments and task states after toggle');
            await Promise.all([
                fetchAssignments(),
                fetchTaskStates()
            ]);

            console.log('Successfully toggled assignment completion');

        } catch (error) {
            console.error('Error toggling verse completion:', error);

            // Revert optimistic update on error
            console.log('Reverting optimistic update due to error');
            await fetchAssignments();

            // Re-throw to allow UI to handle error display
            throw error;
        }
    }, [taskService, fetchAssignments, fetchTaskStates]);

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

    /**
     * Handles generating additional reading assignments with correct date
     */
    const handleReadMore = useCallback(async (): Promise<void> => {
        try {
            console.log('Generating additional reading assignments for date:', today.toISOString().split('T')[0]);

            // Generate additional assignments using the same date as current assignments
            const additionalAssignments = await taskService.generateAdditionalAssignments(today);

            if (additionalAssignments.length === 0) {
                console.log('No additional assignments generated');
                return;
            }

            console.log(`Generated ${additionalAssignments.length} additional assignments:`, additionalAssignments);

            // Force refresh assignments data for TODAY's date
            await fetchAssignments();

            // Also refresh task states to ensure completion status is correct
            await fetchTaskStates();

            console.log('Successfully refreshed assignments and task states');

        } catch (error) {
            console.error('Error generating additional assignments:', error);
            throw error; // Re-throw to let the component handle the error
        }
    }, [taskService, today, fetchAssignments, fetchTaskStates]);

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
        confirmTaskCompletion,
        handleReadMore
    };
}
