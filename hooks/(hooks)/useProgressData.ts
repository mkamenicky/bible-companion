// Updated useProgressData.ts with achievement context integration
import { useEffect, useState, useCallback } from 'react';
import { progressService } from '@/services';
import { ProgressStats, Achievement, AchievementUnlockEvent } from "@/models";
import { useAchievementContext } from '@/components/progress/AchievementContext';

export function useProgressData(userId: number = 1) {
    const [stats, setStats] = useState<ProgressStats | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [achievementStats, setAchievementStats] = useState<{
        total: number;
        unlocked: number;
        available: number;
        locked: number;
        completionPercentage: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentUnlocks, setRecentUnlocks] = useState<AchievementUnlockEvent[]>([]);

    // NEW: Use achievement context
    const { addAchievementEvents } = useAchievementContext();

    const loadProgressData = useCallback(async () => {
        try {
            setLoading(true);

            // Update achievement progress first to ensure it's current
            const unlockedEvents = await progressService.updateAchievementProgressFromDatabase(userId);

            // NEW: Add events to global context instead of local state
            if (unlockedEvents.length > 0) {
                addAchievementEvents(unlockedEvents);
                setRecentUnlocks(prev => [...unlockedEvents, ...prev].slice(0, 5)); // Keep last 5 for local use
            }

            // Fetch the updated stats and achievements in parallel
            const [progressStats, achievementData, achievementStatsData] = await Promise.all([
                progressService.getProgressStats(userId),
                progressService.getAchievements(userId),
                progressService.getAchievementStats(userId)
            ]);

            setStats(progressStats);
            setAchievements(achievementData);
            setAchievementStats(achievementStatsData);

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
            setAchievements([]);
            setAchievementStats({
                total: 0,
                unlocked: 0,
                available: 0,
                locked: 0,
                completionPercentage: 0
            });
        } finally {
            setLoading(false);
        }
    }, [userId, addAchievementEvents]);

    const onRefresh = useCallback(async () => {
        await loadProgressData();
    }, [loadProgressData]);

    const markReadingProgress = useCallback(async (
        versesRead: number,
        chaptersRead: number = 0,
        booksRead: string[] = [],
        readingPlan?: string,
        notes?: string
    ): Promise<AchievementUnlockEvent[]> => {
        try {
            // Update reading progress and get any new achievement unlocks
            const unlockedEvents = await progressService.updateReadingProgress(
                userId,
                versesRead,
                chaptersRead,
                booksRead,
                readingPlan,
                notes
            );

            // NEW: Add events to global context
            if (unlockedEvents.length > 0) {
                addAchievementEvents(unlockedEvents);
            }

            // Reload data to reflect changes
            await loadProgressData();

            return unlockedEvents;
        } catch (error) {
            console.error('Error marking reading progress:', error);
            return [];
        }
    }, [userId, loadProgressData, addAchievementEvents]);

    // Method to handle external achievement events (from other hooks)
    const handleExternalAchievementEvents = useCallback((events: AchievementUnlockEvent[]) => {
        console.log('🏆 useProgressData received external achievement events:', events);
        addAchievementEvents(events);
        setRecentUnlocks(prev => [...events, ...prev].slice(0, 5));

        // Optionally reload data to ensure UI is in sync
        loadProgressData();
    }, [loadProgressData, addAchievementEvents]);

    // Method to manually trigger achievement check
    const triggerAchievementCheck = useCallback(async (): Promise<AchievementUnlockEvent[]> => {
        try {
            console.log('🏆 Manually triggering achievement check...');
            const unlockedEvents = await progressService.updateAchievementProgressFromDatabase(userId);

            if (unlockedEvents.length > 0) {
                console.log('🎉 New achievements found:', unlockedEvents.map(e => e.achievementName));
                addAchievementEvents(unlockedEvents);
                setRecentUnlocks(prev => [...unlockedEvents, ...prev].slice(0, 5));

                // Reload data to reflect changes
                await loadProgressData();
            }

            return unlockedEvents;
        } catch (error) {
            console.error('❌ Error checking achievements:', error);
            return [];
        }
    }, [userId, loadProgressData, addAchievementEvents]);

    const clearRecentUnlocks = useCallback(() => {
        setRecentUnlocks([]);
    }, []);

    const dismissUnlock = useCallback((achievementId: string) => {
        setRecentUnlocks(prev => prev.filter(unlock => unlock.achievementId !== achievementId));
    }, []);

    // Get achievements by category
    const getAchievementsByCategory = useCallback(async (category: string): Promise<Achievement[]> => {
        try {
            return await progressService.getAchievementsByCategory(category, userId);
        } catch (error) {
            console.error('Error getting achievements by category:', error);
            return [];
        }
    }, [userId]);

    // Get available achievements (prerequisites met)
    const getAvailableAchievements = useCallback(async (): Promise<Achievement[]> => {
        try {
            return await progressService.getAvailableAchievements(userId);
        } catch (error) {
            console.error('Error getting available achievements:', error);
            return [];
        }
    }, [userId]);

    useEffect(() => {
        loadProgressData();
    }, [loadProgressData]);

    return {
        // Core data
        stats,
        achievements,
        achievementStats,
        loading,

        // Achievement unlock events
        recentUnlocks,
        clearRecentUnlocks,
        dismissUnlock,

        // Actions
        onRefresh,
        markReadingProgress,

        // Achievement event handling
        handleExternalAchievementEvents,
        triggerAchievementCheck,

        // Achievement queries
        getAchievementsByCategory,
        getAvailableAchievements,

        // Computed values
        hasRecentUnlocks: recentUnlocks.length > 0,
        unlockedAchievements: achievements.filter(a => a.unlocked),
        inProgressAchievements: achievements.filter(a => !a.unlocked && a.progress > 0),
        availableAchievements: achievements.filter(a => !a.unlocked && a.progress === 0),
    };
}
