// AchievementContext.tsx - Global achievement event management
import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { AchievementUnlockEvent } from '@/models';

interface AchievementContextType {
    // Achievement events from any source
    achievementEvents: AchievementUnlockEvent[];

    // Methods to manage events
    addAchievementEvents: (events: AchievementUnlockEvent[]) => void;
    clearAchievementEvents: () => void;

    // Utility
    hasEvents: boolean;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

interface AchievementProviderProps {
    children: ReactNode;
}

export function AchievementProvider({ children }: AchievementProviderProps) {
    const [achievementEvents, setAchievementEvents] = useState<AchievementUnlockEvent[]>([]);

    const addAchievementEvents = useCallback((events: AchievementUnlockEvent[]) => {
        if (events.length > 0) {
            console.log('🏆 AchievementContext: Adding achievement events:', events.map(e => e.achievementName));
            setAchievementEvents(prev => [...prev, ...events]);
        }
    }, []);

    const clearAchievementEvents = useCallback(() => {
        console.log('🏆 AchievementContext: Clearing achievement events');
        setAchievementEvents([]);
    }, []);

    const contextValue: AchievementContextType = {
        achievementEvents,
        addAchievementEvents,
        clearAchievementEvents,
        hasEvents: achievementEvents.length > 0,
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
