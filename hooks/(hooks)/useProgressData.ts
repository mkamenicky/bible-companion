import {useEffect, useState} from 'react';
import {progressService} from '@/services';
import {ProgressStats} from "@/models";

export function useProgressData() {
    const [stats, setStats] = useState<ProgressStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProgressData = async () => {
        try {
            setLoading(true);
            setStats(await progressService.getProgressStats());
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
