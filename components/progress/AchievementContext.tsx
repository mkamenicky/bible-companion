// AchievementContext.tsx - Enhanced global achievement event management
import React, { createContext, useContext, useCallback, useState, ReactNode, useEffect } from 'react';
import { AchievementUnlockEvent } from '@/models';

interface AchievementContextType {
    // Achievement events from any source
    achievementEvents: AchievementUnlockEvent[];

    // Methods to manage events
    addAchievementEvents: (events: AchievementUnlockEvent[]) => void;
    clearAchievementEvents: () => void;
    dismissAchievementEvent: (achievementId: string) => void;

    // Utility
    hasEvents: boolean;
    eventCount: number;

    // Progress tracking integration
    triggerProgressRefresh: () => void;
    onProgressRefresh?: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

interface AchievementProviderProps {
    children: ReactNode;
    onProgressRefresh?: () => void;
}

export function AchievementProvider({ children, onProgressRefresh }: AchievementProviderProps) {
    const [achievementEvents, setAchievementEvents] = useState<AchievementUnlockEvent[]>([]);

    const addAchievementEvents = useCallback((events: AchievementUnlockEvent[]) => {
        if (events.length > 0) {
            console.debug('🏆 AchievementContext: Adding achievement events:', events.map(e => e.achievementName));
            setAchievementEvents(prev => {
                // Avoid duplicates by checking achievement IDs
                const existingIds = new Set(prev.map(e => e.achievementId));
                const newEvents = events.filter(e => !existingIds.has(e.achievementId));
                return [...prev, ...newEvents];
            });
        }
    }, []);

    const clearAchievementEvents = useCallback(() => {
        console.debug('🏆 AchievementContext: Clearing all achievement events');
        setAchievementEvents([]);
    }, []);

    const dismissAchievementEvent = useCallback((achievementId: string) => {
        console.debug('🏆 AchievementContext: Dismissing achievement event:', achievementId);
        setAchievementEvents(prev => prev.filter(event => event.achievementId !== achievementId));
    }, []);

    const triggerProgressRefresh = useCallback(() => {
        console.debug('🔄 AchievementContext: Triggering progress refresh');
        if (onProgressRefresh) {
            onProgressRefresh();
        }
    }, [onProgressRefresh]);

    // Auto-clear old events after some time (optional)
    useEffect(() => {
        if (achievementEvents.length > 0) {
            const timer = setTimeout(() => {
                console.debug('🏆 AchievementContext: Auto-clearing old achievement events');
                setAchievementEvents(prev => prev.slice(-3)); // Keep only last 3 events
            }, 30000); // 30 seconds

            return () => clearTimeout(timer);
        }
    }, [achievementEvents]);

    const contextValue: AchievementContextType = {
        achievementEvents,
        addAchievementEvents,
        clearAchievementEvents,
        dismissAchievementEvent,
        hasEvents: achievementEvents.length > 0,
        eventCount: achievementEvents.length,
        triggerProgressRefresh,
        onProgressRefresh,
    };

    return (
        <AchievementContext.Provider value={contextValue}>
            {children}
        </AchievementContext.Provider>
    );
}

export function useAchievementContext(): AchievementContextType {
    const context = useContext(AchievementContext);
    if (!context) {
        throw new Error('useAchievementContext must be used within an AchievementProvider');
    }
    return context;
}

// Optional: Hook for components that want to add achievement events easily
export function useAchievementReporter() {
    const { addAchievementEvents } = useAchievementContext();

    return useCallback(async (progressUpdateFn: () => Promise<AchievementUnlockEvent[]>) => {
        try {
            const unlockedEvents = await progressUpdateFn();
            if (unlockedEvents.length > 0) {
                addAchievementEvents(unlockedEvents);
            }
            return unlockedEvents;
        } catch (error) {
            console.error('Error reporting achievement progress:', error);
            return [];
        }
    }, [addAchievementEvents]);
}
