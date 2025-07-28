// React imports
import React from 'react';
import {useColorScheme, View} from 'react-native';

// Third-party library imports
import {Appbar, Portal, useTheme} from 'react-native-paper';

// Local component imports
import {
    DailyTextBanner,
    ReadingPlanCard,
    ScreenContainer,
    TaskConfirmationModal,
    WeeklyChecklistCard
} from '@/components';

// Service and utility imports
import {useHomeData} from '@/hooks';
import {DateFormattingService, ThemeService} from '@/services';
import {ThemeVariant} from "@/services/(services)/theme/ThemeService";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    // Theme and styling - Now using Instagram theme by default
    const {colors} = useTheme();
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
                    onConfirm={handleConfirmationTaskSet}
                    styles={styles}
                    customColors={customColors}
                />


                <ReadingPlanCard
                    readingPlan={readingPlan}
                    readChapters={[]}
                    onToggle={handleToggleVerses}
                    title={`Reading Plan for ${weekday}`}
                    styles={styles}
                    customColors={customColors}
                />
                <WeeklyChecklistCard
                    items={weeklyChecklistItems}
                    title={`Week: ${weekRange}`}
                    taskStatus={taskStatus}
                    onConfirm={handleConfirmationTaskSet}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>

            <Portal>
                <TaskConfirmationModal
                    visible={!!confirmationTask}
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
