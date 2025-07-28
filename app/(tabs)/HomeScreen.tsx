// React imports
import React from 'react';
import {useColorScheme, View} from 'react-native';

// Third-party library imports
import {Appbar, Portal} from 'react-native-paper';

// Local component imports
import {
    DailyTextBanner,
    DailyAssignmentsCard,
    ScreenContainer,
    TaskConfirmationModal,
    WeeklyChecklistCard
} from '@/components';

// Service and utility imports
import {useHomeData} from '@/hooks';
import {DateFormattingService, ThemeService} from '@/services';

export default function HomeScreen() {
    // Custom hook for data management
    const {
        taskStatus,
        confirmationTask,
        today,
        weeklyChecklistItems,
        dailyChecklistItems,
        onRefresh,
        handleToggleVerses,
        handleConfirmationCancel,
        confirmTaskCompletion,
        dailyReadingAssignments,
    } = useHomeData();

    // Theme and styling - Now using Instagram theme by default
    const colorScheme = useColorScheme();

    // Get Instagram-style colors and styles
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

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

                <DailyAssignmentsCard
                    dailyReadingAssignments={dailyReadingAssignments}
                    onToggle={handleToggleVerses}
                    title={`Reading Plan for ${weekday}`}
                    styles={styles}
                    customColors={customColors}
                />
                <WeeklyChecklistCard
                    items={weeklyChecklistItems}
                    title={`Week: ${weekRange}`}
                    taskStatus={taskStatus}
                    onConfirm={confirmTaskCompletion}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>

            <Portal>
                <TaskConfirmationModal
                    visible={!!false}
                    task={confirmationTask}
                    onCancel={handleConfirmationCancel}
                    onConfirm={confirmTaskCompletion}
                    styles={styles}
                    customColors={customColors}
                />
            </Portal>
        </View>
    );
}
