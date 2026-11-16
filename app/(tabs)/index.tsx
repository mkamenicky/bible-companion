import React from 'react';
import { useColorScheme, View } from 'react-native';
import { Appbar } from 'react-native-paper';

// Local component imports
import {
    DailyAssignmentsCard,
    DailyTextBanner,
    LoadingScreen,
    ScreenContainer,
    WeeklyChecklistCard,
} from '@/components';

// Service and utility imports
import { useHomeData, useTranslation } from '@/hooks';
import { ThemeService } from '@/services';
import { formatWeekRange } from '@/utils';

export default function Index() {
    const t = useTranslation();

    const {
        today,
        onRefresh,
        taskStatus,
        handleToggleVerses,
        handleReadMore,
        dailyChecklistItems,
        weeklyChecklistItems,
        confirmTaskCompletion,
        dailyReadingAssignments,
        loading,
    } = useHomeData();

    // Theme and styling
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    // Show loading screen if data is still loading
    if (loading) {
        return (
            <LoadingScreen
                message={t('home.loadingMessage')}
                styles={styles}
                customColors={customColors}
            />
        );
    }

    const weekRange = formatWeekRange(today);

    // Render
    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title={t('home.title')}
                    titleStyle={{ color: customColors.color, fontWeight: '600' }}
                />
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                <DailyTextBanner
                    today={today}
                    dailyChecklistItems={dailyChecklistItems}
                    taskStatus={taskStatus}
                    onConfirm={confirmTaskCompletion}
                    styles={styles}
                    customColors={customColors}
                />

                {dailyReadingAssignments && Array.from(dailyReadingAssignments.entries()).map(
                    ([assignmentTitle, assignments]) => (
                        <DailyAssignmentsCard
                            key={assignmentTitle}
                            dailyReadingAssignments={assignments}
                            onToggle={handleToggleVerses}
                            onReadMore={handleReadMore}
                            title={t('home.readingPlanToday', { title: assignmentTitle })}
                            styles={styles}
                            customColors={customColors}
                        />
                    ))
                }

                <WeeklyChecklistCard
                    items={weeklyChecklistItems}
                    title={t('home.week', { range: weekRange })}
                    taskStatus={taskStatus}
                    onConfirm={confirmTaskCompletion}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>
        </View>
    );
}
