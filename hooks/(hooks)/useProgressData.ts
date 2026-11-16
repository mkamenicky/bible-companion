import {useCallback, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {consistencyService, progressService} from '@/services';
import type {ConsistencyOverview, ProgressStats} from '@/models';
import {useAchievementContext} from '@/components/progress/AchievementContext';
import {logger} from '@/utils/(utils)/logger';

const EMPTY_STATS: ProgressStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalReadingDays: 0,
    totalVersesRead: 0,
    chaptersCompleted: 0,
    bibleProgressPercentage: 0,
    weeklyVersesRead: 0,
    monthlyVersesRead: 0,
};

/**
 * Statistics for the progress screen. Reloads every time the screen gains
 * focus, so numbers are current after reading was marked on another tab.
 */
export function useProgressData() {
    const [stats, setStats] = useState<ProgressStats | null>(null);
    const [consistency, setConsistency] = useState<ConsistencyOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const {addAchievementEvents} = useAchievementContext();

    const loadProgressData = useCallback(async () => {
        try {
            // Brings achievements up to date (e.g. a streak that grew overnight)
            // and reports anything newly unlocked.
            const unlockedEvents = await progressService.updateAchievementProgress();
            if (unlockedEvents.length > 0) {
                addAchievementEvents(unlockedEvents);
            }

            const [progressStats, consistencyOverview] = await Promise.all([
                progressService.getProgressStats(),
                consistencyService.getOverview(),
            ]);
            setStats(progressStats);
            setConsistency(consistencyOverview);
        } catch (error) {
            logger.error('Error loading progress data', error);
            setStats(previous => previous ?? EMPTY_STATS);
        } finally {
            setLoading(false);
        }
    }, [addAchievementEvents]);

    useFocusEffect(
        useCallback(() => {
            loadProgressData();
        }, [loadProgressData])
    );

    return {
        stats,
        consistency,
        loading,
        onRefresh: loadProgressData,
    };
}
