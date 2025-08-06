// Updated Index.tsx - Clean version using global achievement context
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
import { DateFormattingService, ThemeService } from '@/services';

export default function Index() {
    const t = useTranslation();

    // Custom hook for data management (now handles achievements via context)
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

    // Formatted date values
    const weekday = DateFormattingService.getWeekday(today);
    const weekRange = DateFormattingService.getFormattedWeekRange(today);

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
                    ([assignmentTitle, assignments]) => {
                        console.debug(`Rendering assignments for ${assignmentTitle}:`, assignments.length, 'assignments');

                        return (
                            <DailyAssignmentsCard
                                key={`${assignmentTitle}-${assignments.length}-${assignments.map(a => a.id).join(',')}`}
                                dailyReadingAssignments={assignments}
                                onToggle={handleToggleVerses}
                                onReadMore={handleReadMore}
                                title={t('home.readingPlanToday', { title: assignmentTitle })}
                                styles={styles}
                                customColors={customColors}
                            />
                        );
                    })
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
