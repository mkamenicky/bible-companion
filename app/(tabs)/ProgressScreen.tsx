// ProgressScreen.tsx
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

export default function ProgressScreen() {
    const t = useTranslation();
    const {stats, loading, onRefresh} = useProgressData();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

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
                />
            </ScreenContainer>
        </View>
    );
}
