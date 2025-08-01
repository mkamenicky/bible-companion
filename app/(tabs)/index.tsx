// React imports
import React from 'react';
import {useColorScheme, View} from 'react-native';

// Third-party library imports
import {Appbar} from 'react-native-paper';

// Local component imports
import {DailyAssignmentsCard, DailyTextBanner, LoadingScreen, ScreenContainer, WeeklyChecklistCard} from '@/components';

// Service and utility imports
import {useHomeData, useTranslation} from '@/hooks';
import {DateFormattingService, ThemeService} from '@/services';

export default function Index() {
    const t = useTranslation(); // Add translation hook

    // Custom hook for data management
    const {
        today,
        onRefresh,
        taskStatus,
        handleToggleVerses,
        handleReadMore, // Add this
        dailyChecklistItems,
        weeklyChecklistItems,
        confirmTaskCompletion,
        dailyReadingAssignments,
        loading, // Add loading state if not already present in hook
    } = useHomeData();

    // Theme and styling - Now using Instagram theme by default
    const colorScheme = useColorScheme();

    // Get Instagram-style colors and styles
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
                    titleStyle={{color: customColors.color, fontWeight: '600'}}
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
                        console.log(`Rendering assignments for ${assignmentTitle}:`, assignments.length, 'assignments');

                        return (
                            <DailyAssignmentsCard
                                key={`${assignmentTitle}-${assignments.length}-${assignments.map(a => a.id).join(',')}`} // Force re-render when assignments change
                                dailyReadingAssignments={assignments}
                                onToggle={handleToggleVerses}
                                onReadMore={handleReadMore} // Add this prop
                                title={t('home.readingPlanToday', {title: assignmentTitle})}
                                styles={styles}
                                customColors={customColors}
                            />
                        );
                    })
                }

                <WeeklyChecklistCard
                    items={weeklyChecklistItems}
                    title={t('home.week', {range: weekRange})}
                    taskStatus={taskStatus}
                    onConfirm={confirmTaskCompletion}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>
        </View>
    );
}
