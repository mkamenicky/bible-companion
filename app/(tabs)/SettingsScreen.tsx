// SettingsScreen.tsx
import React from 'react';
import {useColorScheme, View} from 'react-native';
import {Appbar} from 'react-native-paper';

// Import individual components (now with default exports)
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

// Service and utility imports
import {useNotifications, useSettingsData, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';

export default function SettingsScreen() {
    const t = useTranslation(); // Add translation hook

    // Separate the hooks to avoid circular dependency
    const settingsHook = useSettingsData();
    const notificationsHook = useNotifications();

    const {
        settings,
        loading,
        dailyVerseGoal,
        dialogs,
        formStates,
        onRefresh,
        handleToggleDialog,
        handleDailyGoalSave,
        handleTimeChange,
        handleNotificationToggle,
        handleTestNotification,
        handleExportSettings,
        resetSettings,
        showTimePicker,
        updateSetting,
        updateFormState,
    } = settingsHook;

    const {
        scheduledNotifications,
        updateNotificationSchedule,
        sendTestNotification,
        initialized: notificationsInitialized,
    } = notificationsHook;

    // Compute notification status locally
    const notificationStatus = React.useMemo(() => {
        if (!notificationsInitialized) return {status: t('settings.notificationStatus.initializing'), color: '#f59e0b'};
        if (!settings?.notifications) return {status: t('settings.notificationStatus.disabled'), color: '#ef4444'};

        // Check if any specific notification type is enabled
        const hasAnyEnabled = settings?.dailyReminder ||
            settings?.streakReminder ||
            settings?.goalReminder ||
            settings?.achievementNotifications;

        if (!hasAnyEnabled) return {status: t('settings.notificationStatus.disabled'), color: '#ef4444'};
        return {status: t('settings.notificationStatus.active'), color: '#10b981'};
    }, [notificationsInitialized, settings?.notifications, settings?.dailyReminder,
        settings?.streakReminder, settings?.goalReminder, settings?.achievementNotifications, t]);

    // Theme and styling
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    // Combine refresh functions
    const handleRefresh = React.useCallback(async () => {
        await Promise.all([
            onRefresh(),
            notificationsHook.loadScheduledNotifications(),
        ]);
    }, [onRefresh, notificationsHook.loadScheduledNotifications]);

    const handleTimeChangeInternal = React.useCallback(async (event: any, selectedDate?: Date) => {
        console.log("setting time to:", selectedDate);
        await handleTimeChange(event, selectedDate).then(updatedSettings => {
            if (updatedSettings) {
                updateNotificationSchedule(updatedSettings, dailyVerseGoal);
            }
        });
    }, [handleTimeChange, updateNotificationSchedule, dailyVerseGoal]);

    // Individual notification toggle handlers
    const handleDailyReminderToggle = React.useCallback(async (value: boolean) => {
        await updateSetting('dailyReminder', value).then(result => {
            if (result) {
                console.log('Daily reminder toggle', result);
                updateNotificationSchedule(result, dailyVerseGoal);
            }
        });
    }, [updateSetting, updateNotificationSchedule, dailyVerseGoal]);

    const handleStreakReminderToggle = React.useCallback(async (value: boolean) => {
        await updateSetting('streakReminder', value).then(result => {
            if (result) {
                console.log('Streak reminder toggle', result);
                updateNotificationSchedule(result, dailyVerseGoal);
            }
        });
    }, [updateSetting, updateNotificationSchedule, dailyVerseGoal]);

    const handleGoalReminderToggle = React.useCallback(async (value: boolean) => {
        await updateSetting('goalReminder', value).then(result => {
            if (result) {
                console.log('Goal reminder toggle', result);
                updateNotificationSchedule(result, dailyVerseGoal);
            }
        });
    }, [updateSetting, updateNotificationSchedule, dailyVerseGoal]);

    const handleAchievementNotificationToggle = React.useCallback(async (value: boolean) => {
        await updateSetting('achievementNotifications', value).then(result => {
            if (result) {
                console.log('Achievement notification toggle', result);
                updateNotificationSchedule(result, dailyVerseGoal);
            }
        });
    }, [updateSetting, updateNotificationSchedule, dailyVerseGoal]);

    // Show loading screen if data is still loading
    if (loading) {
        return (
            <LoadingScreen
                message={t('settings.loadingMessage')}
                styles={styles}
                customColors={customColors}
            />
        );
    }

    if (!settings) {
        return (
            <LoadingScreen
                message={t('settings.failedToLoad')}
                isError={true}
                onRetry={handleRefresh}
                styles={styles}
                customColors={customColors}
            />
        );
    }

    // Render
    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title={t('settings.title')}
                    titleStyle={{color: customColors.color, fontWeight: '600'}}
                />
                <Appbar.Action
                    icon="refresh"
                    onPress={handleRefresh}
                    iconColor={customColors.color}
                />
            </Appbar.Header>

            <ScreenContainer onRefresh={handleRefresh}>
                {/* Quick Status Overview */}
                <SettingsQuickStatusCard
                    dailyVerseGoal={dailyVerseGoal}
                    scheduledNotifications={scheduledNotifications}
                    notificationStatus={notificationStatus}
                    styles={styles}
                    customColors={customColors}
                />

                <LanguageSelector
                    styles={styles}
                    customColors={customColors}/>

                {/* Reading Goals Section */}
                <ReadingGoalsCard
                    dailyVerseGoal={dailyVerseGoal}
                    onEditGoal={() => handleToggleDialog('dailyGoal', true)}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Language Selection Section */}
                <LanguageSelector
                    styles={styles}
                    customColors={customColors}
                />

                {/* Appearance Section */}
                <AppearanceCard
                    settings={settings}
                    onFontSizeChange={(size: any) => updateSetting('fontSize', size)}
                    onThemeChange={() => {
                        handleToggleDialog('changeTheme', true)
                    }} // Will be implemented
                    styles={styles}
                    customColors={customColors}
                />

                {/* Notifications Section */}
                <NotificationSettingsCard
                    settings={settings}
                    scheduledNotifications={scheduledNotifications}
                    sendTestNotification={sendTestNotification}
                    notificationStatus={notificationStatus}
                    onNotificationToggle={handleNotificationToggle}
                    onDailyReminderToggle={handleDailyReminderToggle}
                    onStreakReminderToggle={handleStreakReminderToggle}
                    onGoalReminderToggle={handleGoalReminderToggle}
                    onAchievementNotificationToggle={handleAchievementNotificationToggle}
                    onTestNotification={handleTestNotification}
                    onShowTimePicker={showTimePicker}
                    onCancelAllNotifications={notificationsHook.cancelAllNotifications}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Data & Storage Section */}
                <DataStorageCard
                    settings={settings}
                    onOfflineModeToggle={(value: any) => updateSetting('offlineMode', value)}
                    onExportSettings={() => handleToggleDialog('exportData', true)}
                    onResetSettings={resetSettings}
                    styles={styles}
                    customColors={customColors}
                />
            </ScreenContainer>

            {/* Time Picker Component */}
            <SettingsTimePicker
                visible={formStates.timePickerVisible}
                selectedTime={formStates.selectedTime}
                onTimeChange={handleTimeChangeInternal}
            />

            {/* All Dialogs */}
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
}
