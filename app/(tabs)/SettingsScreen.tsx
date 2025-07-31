// SettingsScreen.tsx
import React from 'react';
import {useColorScheme, View} from 'react-native';
import {Appbar} from 'react-native-paper';

// Import individual components (now with default exports)
import {
    AppearanceCard,
    DataStorageCard,
    LoadingScreen,
    NotificationSettingsCard,
    ReadingGoalsCard,
    ScreenContainer,
    SettingsDialogs,
    SettingsQuickStatusCard,
    SettingsTimePicker
} from '@/components';
// Service and utility imports
import {useNotifications, useSettingsData} from '@/hooks';
import {ThemeService} from '@/services';

export default function SettingsScreen() {
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
        sendTestNotification,
        initialized: notificationsInitialized,
    } = notificationsHook;

    // Compute notification status locally
    const notificationStatus = React.useMemo(() => {
        if (!notificationsInitialized) return {status: 'initializing', color: '#f59e0b'};
        if (!settings?.notifications) return {status: 'disabled', color: '#ef4444'};
        return {status: 'active', color: '#10b981'};
    }, [notificationsInitialized, settings?.notifications]);

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

    // Show loading screen if data is still loading
    if (loading) {
        return (
            <LoadingScreen
                message="Loading settings..."
                styles={styles}
                customColors={customColors}
            />
        );
    }

    if (!settings) {
        return (
            <LoadingScreen
                message="Failed to load settings"
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
                    title="Settings"
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

                {/* Notifications Section */}
                <NotificationSettingsCard
                    settings={settings}
                    scheduledNotifications={scheduledNotifications}
                    sendTestNotification={sendTestNotification}
                    notificationStatus={notificationStatus}
                    onNotificationToggle={handleNotificationToggle}
                    onDailyReminderToggle={(value: any) => updateSetting('dailyReminder', value)}
                    onTestNotification={handleTestNotification}
                    onShowTimePicker={showTimePicker}
                    onCancelAllNotifications={notificationsHook.cancelAllNotifications}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Reading Goals Section */}
                <ReadingGoalsCard
                    dailyVerseGoal={dailyVerseGoal}
                    onEditGoal={() => handleToggleDialog('dailyGoal', true)}
                    styles={styles}
                    customColors={customColors}
                />

                {/* Appearance Section */}
                <AppearanceCard
                    settings={settings}
                    onFontSizeChange={(size: any) => updateSetting('fontSize', size)}
                    onThemeChange={() => { handleToggleDialog('changeTheme', true) }} // Will be implemented
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
                onTimeChange={handleTimeChange}
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
