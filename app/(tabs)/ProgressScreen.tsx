import React from 'react';
import {useColorScheme, View} from 'react-native';
import {Appbar} from 'react-native-paper';
import {
    AchievementsCard,
    ConsistencyCard,
    LoadingScreen,
    ReadingStatsCard,
    ScreenContainer,
} from '@/components';
import {useProgressData, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';

/**
 * Progress overview: Bible reading totals, then how regular the routines
 * are, then the achievements.
 */
export default function ProgressScreen() {
    const t = useTranslation();
    const {stats, consistency, loading, onRefresh} = useProgressData();

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
                <ReadingStatsCard
                    stats={stats}
                    styles={styles}
                    customColors={customColors}
                />

                {consistency && (
                    <ConsistencyCard
                        overview={consistency}
                        styles={styles}
                        customColors={customColors}
                    />
                )}

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
