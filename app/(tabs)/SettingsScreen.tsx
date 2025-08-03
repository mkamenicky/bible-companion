import React, { useCallback, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import {
    AppearanceCard,
    DataStorageCard,
    LanguageSelector,
    LoadingScreen,
    NotificationSettingsCard,
    ReadingGoalsCard,
    ScreenContainer,
    SettingsDialogs,
    SettingsQuickStatusCard,
    SettingsTimePicker
} from '@/components';
import { useSettingsData, useTranslation, useProgressData, ExtendedAppSettings, NotificationState } from '@/hooks';
import { ThemeService } from '@/services';

interface SettingsScreenProps {}

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
    const t = useTranslation();
    const colorScheme = useColorScheme();
    const progressData = useProgressData();

    const settingsData = useSettingsData();
    const {
        settings,
        loading,
        dailyVerseGoal,
        notificationState,
        scheduledNotifications,
        dialogs,
        formStates,
        onRefresh,
        updateSetting,
        resetSettings,
        handleToggleDialog,
        updateFormState,
        handleDailyGoalSave,
        handleTimeChange,
        showTimePicker,
        showStreakTimePicker,
        showGoalTimePicker,
        handleNotificationToggle,
        handleDailyReminderToggle,
        handleStreakReminderToggle,
        handleGoalReminderToggle,
        handleAchievementNotificationToggle,
        handleTestNotification,
        handleDatabaseBackup,
        handleDatabaseRestore,
        handleExportSettings,
    } = settingsData;

    // Memoized theme values
    const { customColors, styles } = useMemo(() => {
        const colors = ThemeService.getCustomColors(colorScheme);
        const styleSheet = ThemeService.getStyles(colors);
        return { customColors: colors, styles: styleSheet };
    }, [colorScheme]);

    // Combined refresh handler
    const handleRefresh = useCallback(async (): Promise<void> => {
        await Promise.all([
            onRefresh(),
            progressData.onRefresh(),
        ]);
    }, [onRefresh, progressData.onRefresh]);

    // Settings update handlers with proper typing
    const handleFontSizeChange = useCallback((size: ExtendedAppSettings['fontSize']) => {
        updateSetting('fontSize', size);
    }, [updateSetting]);

    const handleOfflineModeToggle = useCallback((value: boolean) => {
        updateSetting('offlineMode', value);
    }, [updateSetting]);

    const handleThemeChange = useCallback(() => {
        handleToggleDialog('changeTheme', true);
    }, [handleToggleDialog]);

    const handleEditDailyGoal = useCallback(() => {
        handleToggleDialog('dailyGoal', true);
    }, [handleToggleDialog]);

    const handleExportData = useCallback(() => {
        handleToggleDialog('exportData', true);
    }, [handleToggleDialog]);

    // Empty cancel all notifications handler (can be implemented later)
    const handleCancelAllNotifications = useCallback(async (): Promise<void> => {
        // Implementation can be added when needed
        console.log('Cancel all notifications requested');
    }, []);

    // Loading state
    if (loading) {
        return (
            <LoadingScreen
                message={t('settings.loadingMessage')}
                styles={styles}
                customColors={customColors}
            />
        );
    }

    // Error state
    if (!settings) {
        return (
            <LoadingScreen
                message={t('settings.failedToLoad')}
                styles={styles}
                customColors={customColors}
            />
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title={t('settings.title')}
                    titleStyle={{
                        color: customColors.color,
                        fontWeight: '600'
                    }}
                />
                <Appbar.Action
                    icon="refresh"
                    onPress={handleRefresh}
                    iconColor={customColors.color}
                />
            </Appbar.Header>

            {/* Main Content */}
            <ScreenContainer onRefresh={handleRefresh}>
                {/* Quick Status Card */}
                <SettingsQuickStatusCard
                    dailyVerseGoal={dailyVerseGoal}
                    scheduledNotifications={scheduledNotifications}
                    notificationStatus={notificationState}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Language Settings */}
                <LanguageSelector
                    styles={styles}
                    customColors={customColors}
                />

                {/* Reading Goals */}
                <ReadingGoalsCard
                    dailyVerseGoal={dailyVerseGoal}
                    onEditGoal={handleEditDailyGoal}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Appearance Settings */}
                <AppearanceCard
                    settings={settings}
                    onFontSizeChange={handleFontSizeChange}
                    onThemeChange={handleThemeChange}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Notification Settings */}
                <NotificationSettingsCard
                    settings={settings}
                    scheduledNotifications={scheduledNotifications}
                    notificationStatus={notificationState}
                    onNotificationToggle={handleNotificationToggle}
                    onDailyReminderToggle={handleDailyReminderToggle}
                    onStreakReminderToggle={handleStreakReminderToggle}
                    onGoalReminderToggle={handleGoalReminderToggle}
                    onAchievementNotificationToggle={handleAchievementNotificationToggle}
                    onTestNotification={handleTestNotification}
                    onShowTimePicker={showTimePicker}
                    onShowStreakTimePicker={showStreakTimePicker}
                    onShowGoalTimePicker={showGoalTimePicker}
                    onCancelAllNotifications={handleCancelAllNotifications}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Data Storage Settings */}
                <DataStorageCard
                    settings={settings}
                    onOfflineModeToggle={handleOfflineModeToggle}
                    onExportSettings={handleExportData}
                    onResetSettings={resetSettings}
                    onDatabaseBackup={handleDatabaseBackup}
                    onDatabaseRestore={handleDatabaseRestore}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>

            {/* Modals and Dialogs */}
            <SettingsTimePicker
                visible={formStates.timePickerVisible}
                selectedTime={formStates.selectedTime}
                onTimeChange={(event, selectedDate) => handleTimeChange(event, selectedDate, 'daily')}
            />

            <SettingsTimePicker
                visible={formStates.streakTimePickerVisible}
                selectedTime={formStates.selectedStreakTime}
                onTimeChange={(event, selectedDate) => handleTimeChange(event, selectedDate, 'streak')}
            />

            <SettingsTimePicker
                visible={formStates.goalTimePickerVisible}
                selectedTime={formStates.selectedGoalTime}
                onTimeChange={(event, selectedDate) => handleTimeChange(event, selectedDate, 'goal')}
            />

            <SettingsDialogs
                dialogs={dialogs}
                formStates={formStates}
                onToggleDialog={handleToggleDialog}
                onDailyGoalSave={handleDailyGoalSave}
                onExportSettings={handleExportSettings}
                onUpdateFormState={updateFormState}
                styles={styles}
                customColors={customColors}
            />
        </View>
    );
};

export default SettingsScreen;
