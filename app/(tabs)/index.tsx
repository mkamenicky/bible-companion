// React imports
import React from 'react';
import {useColorScheme, View} from 'react-native';

// Third-party library imports
import {Appbar} from 'react-native-paper';

// Local component imports
import {
    DailyTextBanner,
    DailyAssignmentsCard,
    ScreenContainer,
    TaskConfirmationModal,
    WeeklyChecklistCard,
    LoadingScreen
} from '@/components';

// Service and utility imports
import {useHomeData} from '@/hooks';
import {DateFormattingService, ThemeService} from '@/services';
import {DailyReadingAssignment} from "@/models";

export default function Index() {
    // Custom hook for data management
    const {
        today,
        onRefresh,
        taskStatus,
        handleToggleVerses,
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
                message="Loading home..."
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
                    title="Home"
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
                    ([assignmentTitle, assignments]) => (
                        <DailyAssignmentsCard
                            key={assignmentTitle}
                            dailyReadingAssignments={assignments}
                            onToggle={handleToggleVerses}
                            title={`Reading Plan Today: ${assignmentTitle}`}
                            styles={styles}
                            customColors={customColors}
                        />
                    ))
                }

                <WeeklyChecklistCard
                    items={weeklyChecklistItems}
                    title={`Week: ${weekRange}`}
                    taskStatus={taskStatus}
                    onConfirm={confirmTaskCompletion}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>
        </View>
    );
}
