// components/GlobalAchievementModal.tsx
import React from 'react';
import { useColorScheme } from 'react-native';
import AchievementNotificationModal from '@/components/progress/AchievementNotificationModal';
import { useAchievementContext } from '@/components/progress/AchievementContext';
import { ThemeService } from '@/services';

export function GlobalAchievementModal() {
    const { achievementEvents, clearAchievementEvents, hasEvents } = useAchievementContext();
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    // Only render if there are achievement events to show
    if (!hasEvents) {
        return null;
    }

    return (
        <AchievementNotificationModal
            events={achievementEvents}
            onClose={clearAchievementEvents}
            styles={styles}
            customColors={customColors}
        />
    );
}
