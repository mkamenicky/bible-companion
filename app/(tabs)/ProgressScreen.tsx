// React imports
import React from 'react';
import { useColorScheme, View, Text } from 'react-native';

// Third-party library imports
import { ActivityIndicator, Appbar } from 'react-native-paper';

// Local component imports
import { ScreenContainer } from '@/components';
import {StreakCard, AchievementsCard, ReadingStatsCard, PeriodStatsCard} from '@/components';

// Service and utility imports
import { useProgressData } from '@/hooks';
import { ThemeService } from '@/services';

export default function ProgressScreen() {
    const { stats, loading, onRefresh } = useProgressData();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (loading || !stats) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={customColors.accent} />
                <Text style={{ marginTop: 16, color: customColors.text }}>Loading progress...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title="Progress"
                    titleStyle={{ color: customColors.color, fontWeight: '600' }}
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
