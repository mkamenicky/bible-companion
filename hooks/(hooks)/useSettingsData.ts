import {useCallback, useEffect, useState} from 'react';
import {Alert, Platform} from 'react-native';
import * as Haptics from 'expo-haptics';
import type * as Notifications from 'expo-notifications';
import {databaseBackupService, notificationService, settingsService} from '@/services';
import type {NotificationPermissionStatus} from '@/services';
import type {AppSettings} from '@/models';
import {toTimeString} from '@/utils/(utils)/date.utils';
import {logger} from '@/utils/(utils)/logger';

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

type TimePickerType = 'daily' | 'streak' | 'goal';

export interface FormStates {
    dailyGoalInput: string;
    timePickerVisible: boolean;
    streakTimePickerVisible: boolean;
    goalTimePickerVisible: boolean;
    selectedTime: Date;
    selectedStreakTime: Date;
    selectedGoalTime: Date;
    currentTimePickerType: TimePickerType;
    refreshing: boolean;
}

export interface NotificationState {
    initialized: boolean;
    loading: boolean;
    error: string | null;
    permissions: NotificationPermissionStatus | null;
    scheduledCount: number;
    lastRefresh: Date | null;
}

/** Kept as an alias: all reminder fields are part of AppSettings itself. */
export type ExtendedAppSettings = AppSettings;

type ReminderToggleKey = 'dailyReminder' | 'streakReminder' | 'goalReminder' | 'achievementNotifications';

/** Per reminder type: which setting holds its time and which form fields belong to it. */
const TIME_PICKERS: Record<TimePickerType, {
    setting: 'reminderTime' | 'streakReminderTime' | 'goalReminderTime';
    visibleField: 'timePickerVisible' | 'streakTimePickerVisible' | 'goalTimePickerVisible';
    selectedField: 'selectedTime' | 'selectedStreakTime' | 'selectedGoalTime';
    fallback: string;
}> = {
    daily: {setting: 'reminderTime', visibleField: 'timePickerVisible', selectedField: 'selectedTime', fallback: '08:00'},
    streak: {setting: 'streakReminderTime', visibleField: 'streakTimePickerVisible', selectedField: 'selectedStreakTime', fallback: '20:00'},
    goal: {setting: 'goalReminderTime', visibleField: 'goalTimePickerVisible', selectedField: 'selectedGoalTime', fallback: '18:00'},
};

/**
 * One entry per reminder type. Goal and streak reminders are scheduled as
 * one notification per day, which would otherwise be counted seven times.
 */
function uniqueByType(requests: Notifications.NotificationRequest[]): Notifications.NotificationRequest[] {
    const seen = new Set<string>();
    return requests.filter(request => {
        const type = String(request.content?.data?.type ?? request.identifier);
        if (seen.has(type)) return false;
        seen.add(type);
        return true;
    });
}

/**
 * State and actions of the settings screen.
 *
 * Reminder scheduling itself lives in notificationService.syncReminders();
 * this hook only stores the settings and asks for a re-sync afterwards.
 */
export function useSettingsData() {
    const [settings, setSettings] = useState<ExtendedAppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [dailyVerseGoal, setDailyVerseGoal] = useState<number>(10);
    const [notificationState, setNotificationState] = useState<NotificationState>({
        initialized: false,
        loading: true,
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

    // ---------------------------------------------------------------------
    // Loading
    // ---------------------------------------------------------------------

    /** Reads permission and scheduled reminders for the status display. */
    const refreshNotificationState = useCallback(async () => {
        const [permissions, scheduled] = await Promise.all([
            notificationService.getPermissionStatus(),
            notificationService.getScheduledNotifications(),
        ]);
        const reminders = uniqueByType(scheduled);

        setScheduledNotifications(reminders);
        setNotificationState({
            initialized: true,
            loading: false,
            error: null,
            permissions,
            scheduledCount: reminders.length,
            lastRefresh: new Date(),
        });
    }, []);

    /** Re-schedules the reminders and refreshes the status display. */
    const syncReminders = useCallback(async () => {
        await notificationService.syncReminders();
        await refreshNotificationState();
    }, [refreshNotificationState]);

    const loadSettings = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const [loadedSettings, goal] = await Promise.all([
                settingsService.getSettings(),
                settingsService.getDailyVerseGoal(),
            ]);

            setSettings(loadedSettings);
            setDailyVerseGoal(goal);
            setFormStates(prev => ({...prev, dailyGoalInput: goal.toString()}));
        } catch (error) {
            logger.error('Error loading settings', error);
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
        refreshNotificationState().catch(error => logger.warn('Failed to load notification state', error));
    }, [loadSettings, refreshNotificationState]);

    // ---------------------------------------------------------------------
    // Settings
    // ---------------------------------------------------------------------

    const updateSetting = useCallback(async <K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ): Promise<ExtendedAppSettings | null> => {
        const result = await settingsService.updateSetting(key, value);
        if (!result.success) {
            Alert.alert('Error', 'Failed to update setting');
            return null;
        }

        const updated = await settingsService.getSettings();
        setSettings(updated);
        return updated;
    }, []);

    /**
     * Makes sure the app may show notifications; explains how to allow them
     * if the user has denied the permission before.
     */
    const ensurePermission = useCallback(async (): Promise<boolean> => {
        if (await notificationService.requestPermission()) return true;

        Alert.alert('Permission Required', 'Please enable notifications in your device settings', [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => notificationService.openNotificationSettings()},
        ]);
        return false;
    }, []);

    const handleNotificationToggle = useCallback(async (value: boolean) => {
        if (value) await ensurePermission();
        if (await updateSetting('notifications', value)) {
            await syncReminders();
        }
    }, [ensurePermission, updateSetting, syncReminders]);

    const toggleReminder = useCallback(async (key: ReminderToggleKey, value: boolean) => {
        if (value) await ensurePermission();
        if (await updateSetting(key, value)) {
            await syncReminders();
        }
    }, [ensurePermission, updateSetting, syncReminders]);

    const handleDailyReminderToggle = useCallback((value: boolean) => toggleReminder('dailyReminder', value), [toggleReminder]);
    const handleStreakReminderToggle = useCallback((value: boolean) => toggleReminder('streakReminder', value), [toggleReminder]);
    const handleGoalReminderToggle = useCallback((value: boolean) => toggleReminder('goalReminder', value), [toggleReminder]);
    const handleAchievementNotificationToggle = useCallback((value: boolean) => toggleReminder('achievementNotifications', value), [toggleReminder]);

    // ---------------------------------------------------------------------
    // Time pickers
    // ---------------------------------------------------------------------

    const showTimePicker = useCallback((type: TimePickerType = 'daily') => {
        if (!settings) return;

        const picker = TIME_PICKERS[type];
        const [hours, minutes] = (settings[picker.setting] || picker.fallback).split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        setFormStates(prev => ({
            ...prev,
            currentTimePickerType: type,
            [picker.selectedField]: date,
            [picker.visibleField]: true,
        }));
    }, [settings]);

    const showStreakTimePicker = useCallback(() => showTimePicker('streak'), [showTimePicker]);
    const showGoalTimePicker = useCallback(() => showTimePicker('goal'), [showTimePicker]);

    const handleTimeChange = useCallback(async (_event: unknown, selectedDate?: Date, type?: TimePickerType) => {
        const picker = TIME_PICKERS[type ?? formStates.currentTimePickerType];

        // The Android picker is a dialog that closes itself on every result.
        if (Platform.OS === 'android') {
            setFormStates(prev => ({...prev, [picker.visibleField]: false}));
        }
        if (!selectedDate) return; // dismissed

        setFormStates(prev => ({...prev, [picker.selectedField]: selectedDate}));

        if (await updateSetting(picker.setting, toTimeString(selectedDate))) {
            await syncReminders();
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [formStates.currentTimePickerType, updateSetting, syncReminders]);

    const handleTestNotification = useCallback(async () => {
        if (!await ensurePermission()) return;

        const sent = await notificationService.sendImmediateNotification(
            '🧪 Test Notification',
            'Your notifications are working perfectly! 🎉',
            {type: 'test'}
        );

        if (sent) {
            Alert.alert('Test Sent', 'Check your notification tray for the test notification');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Alert.alert('Error', 'Failed to send test notification');
        }
    }, [ensurePermission]);

    // ---------------------------------------------------------------------
    // Daily goal
    // ---------------------------------------------------------------------

    const handleToggleDialog = useCallback((dialogName: keyof DialogStates, visible?: boolean) => {
        setDialogs(prev => ({...prev, [dialogName]: visible ?? !prev[dialogName]}));
    }, []);

    const updateFormState = useCallback(<K extends keyof FormStates>(key: K, value: FormStates[K]) => {
        setFormStates(prev => ({...prev, [key]: value}));
    }, []);

    const handleDailyGoalSave = useCallback(async () => {
        const goal = parseInt(formStates.dailyGoalInput, 10);
        if (isNaN(goal) || goal <= 0 || goal > 1000) {
            Alert.alert('Invalid Goal', 'Please enter a number between 1 and 1000 verses');
            return;
        }

        const result = await settingsService.updateDailyVerseGoal(goal);
        if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to update daily goal');
            return;
        }

        setDailyVerseGoal(goal);
        setFormStates(prev => ({...prev, dailyGoalInput: goal.toString()}));
        handleToggleDialog('dailyGoal', false);
        await syncReminders(); // the reminder texts mention the goal
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [formStates.dailyGoalInput, handleToggleDialog, syncReminders]);

    // ---------------------------------------------------------------------
    // Backup, export, reset
    // ---------------------------------------------------------------------

    const handleDatabaseBackup = useCallback(async () => {
        const result = await databaseBackupService.createDatabaseBackup();
        if (!result.success) {
            Alert.alert('Backup Failed', result.error || 'Failed to create database backup');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        const sizeText = result.size ? ` (${(result.size / 1024 / 1024).toFixed(1)} MB)` : '';
        Alert.alert('Backup Created', `Database backup created successfully${sizeText}.`, [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Share Backup',
                onPress: async () => {
                    if (!result.filePath) return;
                    const shareResult = await databaseBackupService.shareBackup(result.filePath);
                    if (!shareResult.success) {
                        Alert.alert('Share Error', shareResult.error || 'Failed to share backup file');
                    }
                },
            },
        ]);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const handleDatabaseRestore = useCallback(() => {
        Alert.alert('Restore Database', 'This will replace all your current data with the backup. This action cannot be undone. Continue?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Restore',
                style: 'destructive',
                onPress: async () => {
                    const result = await databaseBackupService.restoreDatabaseBackup();
                    if (result.success) {
                        // The restored database brings its own settings.
                        settingsService.invalidateCache();
                        await loadSettings();
                        await syncReminders();
                        Alert.alert('Restore Complete', 'Database restored successfully!');
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else if (result.error !== 'Restore cancelled by user') {
                        Alert.alert('Restore Failed', result.error || 'Failed to restore database backup');
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }
                },
            },
        ]);
    }, [loadSettings, syncReminders]);

    const handleExportSettings = useCallback(async () => {
        const result = await settingsService.exportSettings();
        if (!result.success || !result.data) {
            Alert.alert('Export Failed', result.error || 'Failed to export settings');
            return;
        }

        const shareResult = await databaseBackupService.shareTextData(result.data, 'settings-backup.json');
        if (shareResult.success) {
            Alert.alert('Export Complete', 'Settings exported successfully!');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Alert.alert('Export Error', shareResult.error || 'Failed to share settings');
        }
    }, []);

    const resetSettings = useCallback(() => {
        Alert.alert('Reset Settings', 'This will reset all settings to their default values. This action cannot be undone. Continue?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    const result = await settingsService.resetToDefaults();
                    if (!result.success) {
                        Alert.alert('Reset Failed', result.error || 'Failed to reset settings');
                        return;
                    }
                    await loadSettings();
                    await syncReminders();
                    Alert.alert('Reset Complete', 'All settings have been reset to their default values');
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
            },
        ]);
    }, [loadSettings, syncReminders]);

    const onRefresh = useCallback(async () => {
        setFormStates(prev => ({...prev, refreshing: true}));
        try {
            settingsService.invalidateCache();
            await Promise.all([loadSettings(), syncReminders()]);
        } finally {
            setFormStates(prev => ({...prev, refreshing: false}));
        }
    }, [loadSettings, syncReminders]);

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
        handleNotificationToggle,
        handleDailyReminderToggle,
        handleStreakReminderToggle,
        handleGoalReminderToggle,
        handleAchievementNotificationToggle,
        handleTestNotification,

        // Database actions
        handleDatabaseBackup,
        handleDatabaseRestore,
        handleExportSettings,
    };
}
