// useSettingsData.ts
import { useCallback, useEffect, useState, useRef } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as IntentLauncher from 'expo-intent-launcher';
import { SettingsService } from '@/services';
import { AppSettings } from "@/models";

export interface DialogStates {
    changeTheme: boolean;
    dailyGoal: boolean;
    fontSize: boolean;
    exportData: boolean;
    resetConfirm: boolean;
}

export interface FormStates {
    dailyGoalInput: string;
    timePickerVisible: boolean;
    selectedTime: Date;
    refreshing: boolean;
}

export function useSettingsData() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [dailyVerseGoal, setDailyVerseGoal] = useState<number>(10);

    // Create a stable reference to the service
    const settingsServiceRef = useRef(new SettingsService());
    const settingsService = settingsServiceRef.current;

    // Dialog states
    const [dialogs, setDialogs] = useState<DialogStates>({
        changeTheme: false,
        dailyGoal: false,
        fontSize: false,
        exportData: false,
        resetConfirm: false,
    });

    // Form states
    const [formStates, setFormStates] = useState<FormStates>({
        dailyGoalInput: '10',
        timePickerVisible: false,
        selectedTime: new Date(),
        refreshing: false,
    });

    // Update form input when dailyVerseGoal changes
    useEffect(() => {
        setFormStates(prev => ({
            ...prev,
            dailyGoalInput: dailyVerseGoal.toString()
        }));
    }, [dailyVerseGoal]);

    // Fixed: Remove settingsService from dependency array to prevent infinite loop
    const loadSettings = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const appSettings = await settingsService.getSettings();
            setSettings(appSettings);

            // Load daily verse goal separately
            const goal = await settingsService.getDailyVerseGoal();
            setDailyVerseGoal(goal);
        } catch (error) {
            console.error('Error loading settings:', error);
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, []); // Remove settingsService from dependencies

    const onRefresh = useCallback(async () => {
        setFormStates(prev => ({ ...prev, refreshing: true }));
        await loadSettings();
        setFormStates(prev => ({ ...prev, refreshing: false }));
    }, [loadSettings]);

    // Fixed: Remove settingsService from dependency array
    const updateSetting = useCallback(async <K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ): Promise<void> => {
        try {
            await settingsService.updateSetting(key, value);
            setSettings(prev => prev ? { ...prev, [key]: value } : null);
        } catch (error) {
            console.error('Error updating setting:', error);
            Alert.alert('Error', 'Failed to update setting');
        }
    }, []); // Remove settingsService from dependencies

    // Fixed: Remove settingsService from dependency array
    const updateDailyVerseGoal = useCallback(async (goal: number): Promise<void> => {
        try {
            await settingsService.updateDailyVerseGoal(goal);
            setDailyVerseGoal(goal);
        } catch (error) {
            console.error('Error updating daily verse goal:', error);
            Alert.alert('Error', 'Failed to update daily verse goal');
        }
    }, []); // Remove settingsService from dependencies

    // Dialog management
    const handleToggleDialog = useCallback((dialogName: keyof DialogStates, visible?: boolean) => {
        setDialogs(prev => ({
            ...prev,
            [dialogName]: visible ?? !prev[dialogName]
        }));
    }, []);

    // Daily goal handlers
    const handleDailyGoalSave = useCallback(async () => {
        try {
            const goal = parseInt(formStates.dailyGoalInput, 10);
            if (isNaN(goal) || goal <= 0 || goal > 100) {
                Alert.alert('Invalid Goal', 'Please enter a number between 1 and 100');
                return;
            }

            await updateDailyVerseGoal(goal);
            handleToggleDialog('dailyGoal', false);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Error updating daily goal:', error);
            Alert.alert('Error', 'Failed to update daily goal');
        }
    }, [formStates.dailyGoalInput, updateDailyVerseGoal, handleToggleDialog]);

    // Time picker handlers
    const handleTimeChange = useCallback((event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setFormStates(prev => ({ ...prev, timePickerVisible: false }));
        }

        if (selectedDate) {
            setFormStates(prev => ({ ...prev, selectedTime: selectedDate }));
            const timeString = selectedDate.toTimeString().slice(0, 5);
            updateSetting('reminderTime', timeString);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [updateSetting]);

    const showTimePicker = useCallback(() => {
        if (settings?.reminderTime) {
            const [hours, minutes] = settings.reminderTime.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            setFormStates(prev => ({ ...prev, selectedTime: date }));
        }
        setFormStates(prev => ({ ...prev, timePickerVisible: true }));
    }, [settings?.reminderTime]);

    // Notification settings helpers
    const openNotificationSettings = useCallback(async () => {
        try {
            if (Platform.OS === 'ios') {
                await Linking.openURL('app-settings:');
            } else {
                await IntentLauncher.startActivityAsync(
                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                    {
                        data: 'package:' + 'your.app.package.name', // Replace with actual package name
                    }
                );
            }
        } catch (error) {
            console.error('Failed to open settings:', error);
            await Linking.openSettings();
        }
    }, []);

    const checkNotificationPermissions = async (): Promise<boolean> => {
        // You would implement this with expo-notifications
        return true; // Placeholder
    };

    const handleNotificationToggle = useCallback(async (value: boolean) => {
        if (value) {
            const hasPermission = await checkNotificationPermissions();
            if (!hasPermission) {
                Alert.alert(
                    'Permission Required',
                    'Please enable notifications in your device settings to use this feature.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: openNotificationSettings }
                    ]
                );
                return;
            }
        }

        await updateSetting('notifications', value);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [updateSetting, openNotificationSettings]);

    // Test notification handler - removed direct call to sendTestNotification
    const handleTestNotification = useCallback(async () => {
        try {
            // This will be handled by the notifications hook in the component
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, []);

    // Export/Import handlers
    const handleExportSettings = useCallback(async () => {
        try {
            const exportData = await exportSettings();
            if (exportData) {
                Alert.alert('Export Successful', 'Settings have been exported');
                console.log(exportData);
                handleToggleDialog('exportData', false);
            }
        } catch (error) {
            Alert.alert('Export Failed', 'Could not export settings');
        }
    }, [handleToggleDialog]);

    // Fixed: Remove settingsService from dependency array
    const resetSettings = useCallback(async (): Promise<void> => {
        Alert.alert(
            'Reset All Settings',
            'This will restore all settings to their default values. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await settingsService.resetSettings();
                            await loadSettings();
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    },
                },
            ]
        );
    }, [loadSettings]); // Only keep loadSettings dependency

    const handleResetSettings = useCallback(() => {
        resetSettings();
    }, [resetSettings]);

    // Fixed: Remove settingsService from dependency array
    const exportSettings = useCallback(async (): Promise<{ success: boolean; data?: string; error?: string }> => {
        try {
            return await settingsService.exportSettings();
        } catch (error) {
            Alert.alert('Error', 'Failed to export settings');
            return Promise.reject(error);
        }
    }, []); // Remove settingsService from dependencies

    // Fixed: Remove settingsService from dependency array
    const importSettings = useCallback(async (settingsJson: string): Promise<void> => {
        try {
            await settingsService.importSettings(settingsJson);
            await loadSettings();
            Alert.alert('Success', 'Settings have been imported');
        } catch (error) {
            Alert.alert('Error', 'Failed to import settings. Please check the format.');
        }
    }, [loadSettings]); // Only keep loadSettings dependency

    // Form state updaters
    const updateFormState = useCallback(<K extends keyof FormStates>(
        key: K,
        value: FormStates[K]
    ) => {
        setFormStates(prev => ({ ...prev, [key]: value }));
    }, []);

    // Fixed: Add explicit dependency array to prevent infinite loop
    useEffect(() => {
        loadSettings();
    }, []); // Empty dependency array - only run once on mount

    return {
        // Core settings data
        settings,
        loading,
        dailyVerseGoal,

        // UI states
        dialogs,
        formStates,

        // Core actions
        onRefresh,
        updateSetting,
        updateDailyVerseGoal,
        resetSettings: handleResetSettings,
        exportSettings,
        importSettings,

        // Dialog actions
        handleToggleDialog,

        // Form handlers
        handleDailyGoalSave,
        handleTimeChange,
        showTimePicker,
        updateFormState,

        // Notification actions
        handleNotificationToggle,
        handleTestNotification,
        openNotificationSettings,

        // Export/import actions
        handleExportSettings,
    };
}
