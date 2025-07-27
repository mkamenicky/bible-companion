// React imports
import React from 'react';
import { useColorScheme, View } from 'react-native';

// Third-party library imports
import { Appbar, Portal, useTheme } from 'react-native-paper';

// Local component imports
import ScreenContainer from '@/components/ScreenContainer';
import TaskConfirmationModal from '@/components/tasks/TaskConfirmationModal';
import WeeklyChecklistCard from '@/components/tasks/WeeklyChecklistCard';
import ReadingPlanCard from '@/components/tasks/ReadingPlanCard';
import DailyTextBanner from '@/components/tasks/DailyTextBanner';

// Service and utility imports
import { useHomeData } from '@/hooks/useHomeData';
import { DateFormattingService } from '@/services/date/DateFormattingService';
import { ThemeService } from '@/services/theme/ThemeService';

export default function HomeScreen() {
    // Custom hook for data management
    const {
        refreshing,
        readingPlan,
        taskStatus,
        confirmationTask,
        today,
        weeklyChecklistItems,
        dailyChecklistItems,
        onRefresh,
        handleToggleVerses,
        handleConfirmationTaskSet,
        handleConfirmationCancel,
        confirmTaskCompletion,
    } = useHomeData();

    // Theme and styling
    const { colors } = useTheme();
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    // Formatted date values
    const weekday = DateFormattingService.getWeekday(today);
    const weekRange = DateFormattingService.getFormattedWeekRange(today);

    // Render
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Home" />
            </Appbar.Header>

            <DailyTextBanner
                today={today}
                dailyChecklistItems={dailyChecklistItems}
                taskStatus={taskStatus}
                onConfirm={handleConfirmationTaskSet}
                styles={styles}
            />

            <ScreenContainer onRefresh={onRefresh}>
                <ReadingPlanCard
                    readingPlan={readingPlan}
                    readChapters={[]}
                    onToggle={handleToggleVerses}
                    title={`Reading Plan for ${weekday}`}
                    styles={styles}
                />
                <WeeklyChecklistCard
                    items={weeklyChecklistItems}
                    title={`Week: ${weekRange}`}
                    taskStatus={taskStatus}
                    onConfirm={handleConfirmationTaskSet}
                    styles={styles}
                />
            </ScreenContainer>

            <Portal>
                <TaskConfirmationModal
                    visible={!!confirmationTask}
                    task={confirmationTask}
                    onCancel={handleConfirmationCancel}
                    onConfirm={confirmTaskCompletion}
                    styles={styles}
                />
            </Portal>
        </View>
    );
}
