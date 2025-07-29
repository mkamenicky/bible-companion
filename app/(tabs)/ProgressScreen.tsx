// React imports
import React from 'react';
import {useColorScheme, View} from 'react-native';

// Third-party library imports
import {Appbar} from 'react-native-paper';

// Local component imports
import {
    AchievementsCard,
    LoadingScreen,
    PeriodStatsCard,
    ReadingStatsCard,
    ScreenContainer,
    StreakCard
} from '@/components';

// Service and utility imports
import {useProgressData} from '@/hooks';
import {ThemeService} from '@/services';

export default function ProgressScreen() {
    const {stats, loading, onRefresh} = useProgressData();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (loading || !stats) {
        return (
            <LoadingScreen
                message="Loading progress..."
                styles={styles}
                customColors={customColors}
            />
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title="Progress"
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
                />
            </ScreenContainer>
        </View>
    );
}
