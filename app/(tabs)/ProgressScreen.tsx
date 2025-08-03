// ProgressScreen.tsx - Enhanced with achievement context integration
import React from 'react';
import {useColorScheme, View} from 'react-native';
import {Appbar} from 'react-native-paper';
import {
    AchievementsCard,
    LoadingScreen,
    PeriodStatsCard,
    ReadingStatsCard,
    ScreenContainer,
    StreakCard
} from '@/components';
import {useProgressData, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';
import { useAchievementContext } from '@/components/progress/AchievementContext';

export default function ProgressScreen() {
    const t = useTranslation();
    const {stats, loading, onRefresh} = useProgressData();

    // NEW: Use achievement context
    const { addAchievementEvents } = useAchievementContext();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    // NEW: Handle achievement unlocks from AchievementsCard
    const handleAchievementUnlocked = (events: any[]) => {
        if (events.length > 0) {
            addAchievementEvents(events);
        }
    };

    if (loading || !stats) {
        return (
            <LoadingScreen
                message={t('progress.loadingMessage')}
                styles={styles}
                customColors={customColors}
            />
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title={t('progress.title')}
                    titleStyle={{color: customColors.color, fontWeight: '600'}}
                />
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                <StreakCard
                    currentStreak={stats.currentStreak}
                    longestStreak={stats.longestStreak}
                    totalReadingDays={stats.totalReadingDays}
                    styles={styles}
                    customColors={customColors}
                />

                <ReadingStatsCard
                    totalVersesRead={stats.totalVersesRead}
                    chaptersCompleted={stats.chaptersCompleted}
                    bibleProgressPercentage={stats.bibleProgressPercentage}
                    styles={styles}
                    customColors={customColors}
                />

                <PeriodStatsCard
                    weeklyVersesRead={stats.weeklyVersesRead}
                    monthlyVersesRead={stats.monthlyVersesRead}
                    styles={styles}
                    customColors={customColors}
                />

                <AchievementsCard
                    currentStreak={stats.currentStreak}
                    totalVersesRead={stats.totalVersesRead}
                    chaptersCompleted={stats.chaptersCompleted}
                    styles={styles}
                    customColors={customColors}
                    onAchievementUnlocked={handleAchievementUnlocked}
                />
            </ScreenContainer>
        </View>
    );
}
