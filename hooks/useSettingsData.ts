import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AppSettings, SettingsService } from '@/services/settings/SettingsService';

export function useSettingsData() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const settingsService = new SettingsService();

    const loadSettings = useCallback(async (): Promise<void> => {
        try {
            const appSettings = await settingsService.getSettings();
            setSettings(appSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, [settingsService]);

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
    }, [settingsService]);

    const resetSettings = useCallback(async (): Promise<void> => {
        Alert.alert(
            'Reset Settings',
            'Are you sure you want to reset all settings to default?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await settingsService.resetSettings();
                            await loadSettings();
                            Alert.alert('Success', 'Settings have been reset');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reset settings');
                        }
                    },
                },
            ]
        );
    }, [settingsService, loadSettings]);

    const exportSettings = useCallback(async (): Promise<string | null> => {
        try {
            return await settingsService.exportSettings();
        } catch (error) {
            Alert.alert('Error', 'Failed to export settings');
            return null;
        }
    }, [settingsService]);

    const importSettings = useCallback(async (settingsJson: string): Promise<void> => {
        try {
            await settingsService.importSettings(settingsJson);
            await loadSettings();
            Alert.alert('Success', 'Settings have been imported');
        } catch (error) {
            Alert.alert('Error', 'Failed to import settings. Please check the format.');
        }
    }, [settingsService, loadSettings]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        settings,
        loading,
        updateSetting,
        resetSettings,
        exportSettings,
        importSettings,
    };
}
