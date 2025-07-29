import { useState, useEffect } from 'react';
import { progressService } from '@/services';
import { dailyReadingAssignmentsRepository } from '@/repository/(repositories)/daily-reading-assignments.repository';
import { tasksRepository } from '@/repository/(repositories)/tasks.repository';

interface ProgressStats {
    // Streak data
    currentStreak: number;
    longestStreak: number;
    totalReadingDays: number;

    // Reading progress
    totalVersesRead: number;
    chaptersCompleted: number;
    bibleProgressPercentage: number;

    // Period stats
    weeklyVersesRead: number;
    monthlyVersesRead: number;

    // Legacy compatibility
    weeklyProgress: number;
    monthlyProgress: number;
    completedTasks: number;
    totalTasks: number;
}

export function useProgressData() {
    const [stats, setStats] = useState<ProgressStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProgressData = async () => {
        try {
            setLoading(true);

            // Use ProgressService methods instead of duplicating logic
            const [
                streakInfo,
                readingStats,
                periodStats,
                bibleProgress,
                readingAssignments,
                tasks
            ] = await Promise.all([
                progressService.calculateDetailedStreak(),
                progressService.calculateReadingStats(),
                progressService.calculatePeriodStats(),
                progressService.calculateBibleProgress(),
                dailyReadingAssignmentsRepository.findAll(),
                tasksRepository.findAll()
            ]);

            // Calculate legacy stats for backward compatibility
            const legacyData = calculateLegacyStats(readingAssignments, tasks);

            const combinedStats: ProgressStats = {
                // Streak data from ProgressService
                currentStreak: streakInfo.currentStreak,
                longestStreak: streakInfo.longestStreak,
                totalReadingDays: readingStats.totalReadingDays,

                // Reading progress from ProgressService
                totalVersesRead: readingStats.totalVersesRead,
                chaptersCompleted: readingStats.totalChaptersRead,
                bibleProgressPercentage: Math.round(bibleProgress.percentage),

                // Period stats from ProgressService
                weeklyVersesRead: periodStats.thisWeek,
                monthlyVersesRead: periodStats.thisMonth,

                // Legacy compatibility
                ...legacyData,
            };

            setStats(combinedStats);
        } catch (error) {
            console.error('Error loading progress data:', error);
            // Set default values on error
            setStats({
                currentStreak: 0,
                longestStreak: 0,
                totalReadingDays: 0,
                totalVersesRead: 0,
                chaptersCompleted: 0,
                bibleProgressPercentage: 0,
                weeklyVersesRead: 0,
                monthlyVersesRead: 0,
                weeklyProgress: 0,
                monthlyProgress: 0,
                completedTasks: 0,
                totalTasks: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate legacy stats for backward compatibility
    const calculateLegacyStats = (readingAssignments: any[], tasks: any[]) => {
        const completedAssignments = readingAssignments.filter(a => a.is_completed).length;
        const totalAssignments = readingAssignments.length || 1; // Avoid division by zero

        const completedTasks = tasks.filter(t => t.is_done).length;
        const totalTasks = Math.max(tasks.length, 1); // Avoid division by zero

        // Legacy progress calculations (kept for compatibility)
        const weeklyProgress = Math.min(Math.round((completedAssignments / totalAssignments) * 100), 100);
        const monthlyProgress = Math.min(Math.round((completedTasks / totalTasks) * 100), 100);

        return {
            weeklyProgress,
            monthlyProgress,
            completedTasks,
            totalTasks,
        };
    };

    const onRefresh = async () => {
        await loadProgressData();
    };

    useEffect(() => {
        loadProgressData();
    }, []);

    return {
        stats,
        loading,
        onRefresh,
    };
}
