import { useCallback, useRef, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Notifications from 'expo-notifications';
import { SettingsService, databaseBackupService, notificationService, progressService } from '@/services';
import { AppSettings } from '@/models';

export interface DialogStates {
    changeTheme: boolean;
    dailyGoal: boolean;
    fontSize: boolean;
    exportData: boolean;
    resetConfirm: boolean;
    timePicker: boolean;
    streakTimePicker: boolean;
    goalTimePicker: boolean;
}

export interface FormStates {
    dailyGoalInput: string;
    timePickerVisible: boolean;
    streakTimePickerVisible: boolean;
    goalTimePickerVisible: boolean;
    selectedTime: Date;
    selectedStreakTime: Date;
    selectedGoalTime: Date;
    currentTimePickerType: 'daily' | 'streak' | 'goal';
    refreshing: boolean;
}

export interface NotificationState {
    initialized: boolean;
    loading: boolean;
    error: string | null;
    permissions: any | null;
    scheduledCount: number;
    lastRefresh: Date | null;
}

export interface ExtendedAppSettings extends AppSettings {
    dailyReminder: boolean;
    streakReminder: boolean;
    goalReminder: boolean;
    achievementNotifications: boolean;
}

type NotificationToggleKey = 'dailyReminder' | 'streakReminder' | 'goalReminder' | 'achievementNotifications';

export function useSettingsData() {
    // State
    const [settings, setSettings] = useState<ExtendedAppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [dailyVerseGoal, setDailyVerseGoal] = useState<number>(10);
    const [notificationState, setNotificationState] = useState<NotificationState>({
        initialized: false,
        loading: false,
        error: null,
        permissions: null,
        scheduledCount: 0,
        lastRefresh: null,
    });
    const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);
    const [dialogs, setDialogs] = useState<DialogStates>({
        changeTheme: false,
        dailyGoal: false,
        fontSize: false,
        exportData: false,
        resetConfirm: false,
        timePicker: false,
        streakTimePicker: false,
        goalTimePicker: false,
    });

    const [formStates, setFormStates] = useState<FormStates>({
        dailyGoalInput: '10',
        timePickerVisible: false,
        streakTimePickerVisible: false,
        goalTimePickerVisible: false,
        selectedTime: new Date(),
        selectedStreakTime: new Date(),
        selectedGoalTime: new Date(),
        currentTimePickerType: 'daily',
        refreshing: false,
    });

    // Services
    const settingsService = useRef(new SettingsService()).current;

    // Helper function to get real user data for notifications
    const getUserDataForNotifications = useCallback(async () => {
        try {
            const stats = await progressService.getProgressStats();
            const periodStats = await progressService.calculatePeriodStats();

            return {
                currentStreak: stats.currentStreak,
                dailyGoal: dailyVerseGoal,
                todayProgress: periodStats.today, // Use actual today's progress
            };
        } catch (error) {
            console.warn('Failed to get progress data for notifications, using defaults:', error);
            return {
                currentStreak: 0,
                dailyGoal: dailyVerseGoal,
                todayProgress: 0,
            };
        }
    }, [dailyVerseGoal]);

    // Utilities
    const updateNotificationState = useCallback((updates: Partial<NotificationState>) => {
        setNotificationState(prev => ({ ...prev, ...updates }));
    }, []);

    const getDefaultExtendedSettings = useCallback((): ExtendedAppSettings => ({
        notifications: false,
        dailyReminder: false,
        streakReminder: false,
        goalReminder: false,
        achievementNotifications: false,
        reminderTime: '08:00',
        streakReminderTime: '20:00',
        goalReminderTime: '18:00',
        theme: 'auto',
        fontSize: 'medium',
        offlineMode: false,
    }), []);

    // Cache utilities
    const saveNotificationPreferencesToCache = useCallback(async (prefs: Partial<Pick<ExtendedAppSettings, NotificationToggleKey>>) => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const existing = await AsyncStorage.getItem('@notification_preferences');
            const existingPrefs = existing ? JSON.parse(existing) : {};
            const updatedPrefs = { ...existingPrefs, ...prefs };
            await AsyncStorage.setItem('@notification_preferences', JSON.stringify(updatedPrefs));
        } catch (error) {
            console.warn('Failed to save notification preferences to cache:', error);
        }
    }, []);

    const loadNotificationPreferencesFromCache = useCallback(async () => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const cached = await AsyncStorage.getItem('@notification_preferences');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Failed to load notification preferences from cache:', error);
            return null;
        }
    }, []);

    const loadScheduledNotifications = useCallback(async () => {
        try {
            const notifications = await notificationService.getScheduledNotifications();
            setScheduledNotifications(notifications);
            updateNotificationState({
                scheduledCount: notifications.length,
                lastRefresh: new Date(),
            });
        } catch (error) {
            updateNotificationState({ error: 'Failed to load notifications' });
        }
    }, [updateNotificationState]);

    // Data loaders
    const loadSettings = useCallback(async (): Promise<void> => {
        try {
            console.debug('🔄 Loading settings...');
            setLoading(true);

            const [baseSettings, goal, cachedNotificationPrefs] = await Promise.all([
                settingsService.getSettings(),
                settingsService.getDailyVerseGoal(),
                loadNotificationPreferencesFromCache(),
            ]);

            console.debug('📋 Settings loaded:', baseSettings);
            setDailyVerseGoal(goal);
            // Update form state with the loaded daily goal
            setFormStates(prev => ({ ...prev, dailyGoalInput: goal.toString() }));
            const extendedSettings: ExtendedAppSettings = {
                ...baseSettings,
                // Ensure new time fields have defaults if not present
                streakReminderTime: baseSettings.streakReminderTime ?? '20:00',
                goalReminderTime: baseSettings.goalReminderTime ?? '18:00',
                dailyReminder: cachedNotificationPrefs?.dailyReminder ?? false,
                streakReminder: cachedNotificationPrefs?.streakReminder ?? false,
                goalReminder: cachedNotificationPrefs?.goalReminder ?? false,
                achievementNotifications: cachedNotificationPrefs?.achievementNotifications ?? false,
            };
            setSettings(extendedSettings);
            console.debug('✅ Settings state updated');
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            const defaultSettings = getDefaultExtendedSettings();
            setSettings(defaultSettings);
            Alert.alert('Error', 'Failed to load settings, using defaults');
        } finally {
            console.debug('🏁 Setting loading to false');
            setLoading(false);
        }
    }, [settingsService, getDefaultExtendedSettings, loadNotificationPreferencesFromCache]);

    const initializeNotifications = useCallback(async () => {
        try {
            updateNotificationState({ loading: true, error: null });
            const [initialized, permissions] = await Promise.all([
                notificationService.initialize(),
                notificationService.getPermissionStatus(),
            ]);
            updateNotificationState({
                initialized,
                loading: false,
                permissions,
                error: initialized ? null : 'Failed to initialize notifications',
            });
            return initialized;
        } catch (error) {
            updateNotificationState({
                initialized: false,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }, [updateNotificationState]);

    // Schedule notifications based on current settings
    const scheduleNotificationsFromSettings = useCallback(async (currentSettings: ExtendedAppSettings) => {
        if (!notificationState.initialized || !currentSettings.notifications) {
            console.debug('⏭️ Skipping notification scheduling - not initialized or notifications disabled');
            return;
        }

        try {
            console.debug('📅 Scheduling notifications from current settings...');
            const userdata = await getUserDataForNotifications();
            await notificationService.scheduleSmartReminders(currentSettings, userdata);

            // Load scheduled notifications after scheduling
            await loadScheduledNotifications();
            console.debug('✅ Notifications scheduled and loaded');
        } catch (error) {
            console.error('❌ Error scheduling notifications:', error);
        }
    }, [notificationState.initialized, getUserDataForNotifications, loadScheduledNotifications]);

    // Auto-load settings on mount
    useEffect(() => {
        console.debug('🚀 useSettingsData mounted, loading settings...');
        loadSettings();
    }, []); // Empty dependency array means this runs once on mount

    // Auto-initialize notifications
    useEffect(() => {
        initializeNotifications();
    }, [initializeNotifications]);

    // Schedule notifications when settings and notification service are ready
    useEffect(() => {
        if (settings && notificationState.initialized && !loading) {
            console.debug('🔄 Settings and notifications ready, scheduling notifications...');
            scheduleNotificationsFromSettings(settings);
        }
    }, [settings, notificationState.initialized, loading, scheduleNotificationsFromSettings]);

    // Settings updaters
    const updateSetting = useCallback(async <K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ): Promise<ExtendedAppSettings | null> => {
        try {
            const result = await settingsService.updateSetting(key, value);
            if (result.success && settings) {
                const updatedSettings = { ...settings, [key]: value };
                setSettings(updatedSettings);
                return updatedSettings;
            }
            return null;
        } catch (error) {
            Alert.alert('Error', 'Failed to update setting');
            return null;
        }
    }, [settingsService, settings]);

    const updateNotificationPreference = useCallback(async <K extends NotificationToggleKey>(
        key: K,
        value: ExtendedAppSettings[K]
    ): Promise<ExtendedAppSettings | null> => {
        if (!settings) return null;
        try {
            const updatedSettings = { ...settings, [key]: value };
            setSettings(updatedSettings);
            await saveNotificationPreferencesToCache({ [key]: value });

            if (updatedSettings.notifications && notificationState.initialized) {
                const userdata = await getUserDataForNotifications();

                if (value) {
                    await notificationService.scheduleSpecificNotification(key, updatedSettings, userdata);
                } else {
                    await notificationService.cancelSpecificNotification(key);
                }
                await loadScheduledNotifications();
            }
            return updatedSettings;
        } catch (error) {
            setSettings(settings); // Revert on error
            return null;
        }
    }, [settings, saveNotificationPreferencesToCache, notificationState.initialized, getUserDataForNotifications, loadScheduledNotifications]);

    // Action handlers
    const handleMasterNotificationToggle = useCallback(async (value: boolean) => {
        try {
            const updatedSettings = await updateSetting('notifications', value);
            if (updatedSettings) {
                const userdata = await getUserDataForNotifications();

                if (!value) {
                    await notificationService.cancelAllNotifications();
                } else {
                    await notificationService.scheduleSmartReminders(updatedSettings, userdata);
                }
                await loadScheduledNotifications();
            }
        } catch (error) {
            console.error('Failed to toggle master notifications:', error);
        }
    }, [updateSetting, getUserDataForNotifications, loadScheduledNotifications]);

    const handleDailyReminderToggle = useCallback(
        (value: boolean) => updateNotificationPreference('dailyReminder', value),
        [updateNotificationPreference]
    );

    const handleStreakReminderToggle = useCallback(
        (value: boolean) => updateNotificationPreference('streakReminder', value),
        [updateNotificationPreference]
    );

    const handleGoalReminderToggle = useCallback(
        (value: boolean) => updateNotificationPreference('goalReminder', value),
        [updateNotificationPreference]
    );

    const handleAchievementNotificationToggle = useCallback(
        (value: boolean) => updateNotificationPreference('achievementNotifications', value),
        [updateNotificationPreference]
    );

    const handleTimeChange = useCallback(async (_event: any, selectedDate?: Date, type?: 'daily' | 'streak' | 'goal') => {
        const timeType = type || formStates.currentTimePickerType;

        if (Platform.OS === 'android') {
            const stateUpdate: Partial<FormStates> = {};
            if (timeType === 'daily') stateUpdate.timePickerVisible = false;
            else if (timeType === 'streak') stateUpdate.streakTimePickerVisible = false;
            else stateUpdate.goalTimePickerVisible = false;

            setFormStates(prev => ({ ...prev, ...stateUpdate }));
        }

        if (selectedDate && settings) {
            const timeString = selectedDate.toTimeString().slice(0, 5);
            const timeField = timeType === 'daily' ? 'reminderTime' :
                timeType === 'streak' ? 'streakReminderTime' : 'goalReminderTime';

            const stateUpdate: Partial<FormStates> = {};
            if (timeType === 'daily') stateUpdate.selectedTime = selectedDate;
            else if (timeType === 'streak') stateUpdate.selectedStreakTime = selectedDate;
            else stateUpdate.selectedGoalTime = selectedDate;

            setFormStates(prev => ({ ...prev, ...stateUpdate }));

            const updatedSettings = await updateSetting(timeField as keyof AppSettings, timeString);

            if (updatedSettings?.notifications && notificationState.initialized) {
                const userdata = await getUserDataForNotifications();
                await notificationService.scheduleSmartReminders(updatedSettings, userdata);
                await loadScheduledNotifications();
            }
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [settings, updateSetting, notificationState.initialized, getUserDataForNotifications, loadScheduledNotifications, formStates.currentTimePickerType]);

    const sendTestNotification = useCallback(async () => {
        if (!notificationState.initialized) {
            Alert.alert('Error', 'Notifications not initialized');
            return;
        }
        if (!notificationState.permissions?.granted) {
            Alert.alert('Permission Required', 'Please enable notifications in your device settings', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => notificationService.openNotificationSettings() }
            ]);
            return;
        }

        const success = await notificationService.sendImmediateNotification(
            '🧪 Test Notification',
            'Your notifications are working perfectly! 🎉',
            { type: 'test', timestamp: Date.now() }
        );

        if (success) {
            Alert.alert('Test Sent', 'Check your notification tray for the test notification');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Alert.alert('Error', 'Failed to send test notification');
        }
    }, [notificationState]);

    // Database operations
    const handleDatabaseBackup = useCallback(async () => {
        try {
            const result = await databaseBackupService.createDatabaseBackup();
            if (result.success) {
                const sizeText = result.size ? ` (${(result.size / 1024 / 1024).toFixed(1)} MB)` : '';

                Alert.alert(
                    'Backup Created',
                    `Database backup created successfully${sizeText}.`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Share Backup',
                            onPress: async () => {
                                if (result.filePath) {
                                    const shareResult = await databaseBackupService.shareBackup(result.filePath);
                                    if (!shareResult.success) {
                                        Alert.alert('Share Error', shareResult.error || 'Failed to share backup file');
                                    }
                                }
                            }
                        }
                    ]
                );

                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('Backup Failed', result.error || 'Failed to create database backup');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (error) {
            console.error('Database backup error:', error);
            Alert.alert('Backup Error', 'An unexpected error occurred while creating the backup');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, []);

    const handleDatabaseRestore = useCallback(async () => {
        Alert.alert('Restore Database', 'This will replace all your current data with the backup. This action cannot be undone. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Restore',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await databaseBackupService.restoreDatabaseBackup();
                        if (result.success) {
                            Alert.alert('Restore Complete', 'Database restored successfully! Please restart the app.');
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            Alert.alert('Restore Failed', result.error || 'Failed to restore database backup');
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    } catch (error) {
                        console.error('Database restore error:', error);
                        Alert.alert('Restore Error', 'An unexpected error occurred while restoring the backup');
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }
                }
            }
        ]);
    }, []);

    const handleExportSettings = useCallback(async () => {
        try {
            const result = await settingsService.exportSettings();
            if (result.success && result.data) {
                const shareResult = await databaseBackupService.shareTextData(result.data, 'settings-backup.json');
                if (shareResult.success) {
                    Alert.alert('Export Complete', 'Settings exported successfully!');
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    Alert.alert('Export Error', shareResult.error || 'Failed to share settings');
                }
            } else {
                Alert.alert('Export Failed', result.error || 'Failed to export settings');
            }
        } catch (error) {
            console.error('Settings export error:', error);
            Alert.alert('Export Error', 'An unexpected error occurred while exporting settings');
        }
    }, []);

    const resetSettings = useCallback(async () => {
        Alert.alert('Reset Settings', 'This will reset all settings to their default values. This action cannot be undone. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await settingsService.resetToDefaults();
                        if (result.success) {
                            await loadSettings();
                            Alert.alert('Reset Complete', 'All settings have been reset to their default values');
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            Alert.alert('Reset Failed', result.error || 'Failed to reset settings');
                        }
                    } catch (error) {
                        console.error('Settings reset error:', error);
                        Alert.alert('Reset Error', 'An unexpected error occurred while resetting settings');
                    }
                }
            }
        ]);
    }, [loadSettings]);

    // UI state handlers
    const handleToggleDialog = useCallback((dialogName: keyof DialogStates, visible?: boolean) => {
        setDialogs(prev => ({ ...prev, [dialogName]: visible ?? !prev[dialogName] }));
    }, []);

    const updateFormState = useCallback(<K extends keyof FormStates>(key: K, value: FormStates[K]) => {
        setFormStates(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleDailyGoalSave = useCallback(async () => {
        try {
            const goal = parseInt(formStates.dailyGoalInput, 10);
            if (isNaN(goal) || goal <= 0 || goal > 1000) {
                Alert.alert('Invalid Goal', 'Please enter a number between 1 and 1000 verses');
                return;
            }

            const result = await settingsService.updateDailyVerseGoal(goal);
            if (result.success) {
                setDailyVerseGoal(goal);
                // Keep form state in sync
                setFormStates(prev => ({ ...prev, dailyGoalInput: goal.toString() }));
                handleToggleDialog('dailyGoal', false);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('Error', result.error || 'Failed to update daily goal');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update daily goal');
        }
    }, [formStates.dailyGoalInput, settingsService, handleToggleDialog]);

    const showTimePicker = useCallback((type: 'daily' | 'streak' | 'goal' = 'daily') => {
        console.debug('🕐 showTimePicker called with type:', type, 'settings:', settings);
        if (settings) {
            const timeField = type === 'daily' ? 'reminderTime' :
                type === 'streak' ? 'streakReminderTime' : 'goalReminderTime';
            const timeValue = settings[timeField as keyof typeof settings];
            console.debug('🕐 timeField:', timeField, 'timeValue:', timeValue);

            // Use default time if timeValue is not available
            const finalTimeValue = <string> timeValue || (type === 'daily' ? '08:00' : type === 'streak' ? '20:00' : '18:00');
            console.debug('🕐 finalTimeValue:', finalTimeValue);

            const [hours, minutes] = finalTimeValue.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);

            const stateUpdate: Partial<FormStates> = {
                currentTimePickerType: type,
            };

            if (type === 'daily') {
                stateUpdate.selectedTime = date;
                stateUpdate.timePickerVisible = true;
            } else if (type === 'streak') {
                stateUpdate.selectedStreakTime = date;
                stateUpdate.streakTimePickerVisible = true;
            } else {
                stateUpdate.selectedGoalTime = date;
                stateUpdate.goalTimePickerVisible = true;
            }

            console.debug('🕐 Setting state update:', stateUpdate);
            setFormStates(prev => ({ ...prev, ...stateUpdate }));
        }
    }, [settings]);

    const showStreakTimePicker = useCallback(() => showTimePicker('streak'), [showTimePicker]);
    const showGoalTimePicker = useCallback(() => showTimePicker('goal'), [showTimePicker]);

    const onRefresh = useCallback(async () => {
        console.debug('🔄 Refreshing settings...');
        setFormStates(prev => ({ ...prev, refreshing: true }));
        try {
            await Promise.all([loadSettings(), loadScheduledNotifications()]);
        } finally {
            setFormStates(prev => ({ ...prev, refreshing: false }));
        }
    }, [loadSettings, loadScheduledNotifications]);

    return {
        // State
        settings,
        loading,
        dailyVerseGoal,
        notificationState,
        scheduledNotifications,
        dialogs,
        formStates,

        // Core actions
        onRefresh,
        updateSetting,
        resetSettings,

        // Dialog actions
        handleToggleDialog,
        updateFormState,

        // Daily goal actions
        handleDailyGoalSave,

        // Time picker actions
        handleTimeChange,
        showTimePicker,
        showStreakTimePicker,
        showGoalTimePicker,

        // Notification actions
        handleNotificationToggle: handleMasterNotificationToggle,
        handleDailyReminderToggle,
        handleStreakReminderToggle,
        handleGoalReminderToggle,
        handleAchievementNotificationToggle,
        handleTestNotification: sendTestNotification,

        // Database actions
        handleDatabaseBackup,
        handleDatabaseRestore,
        handleExportSettings,

        // Initialize notifications
        initializeNotifications,
    };
}
