import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
    notifications: boolean;
    dailyReminder: boolean;
    reminderTime: string;
    theme: 'auto' | 'light' | 'dark';
    fontSize: 'small' | 'medium' | 'large';
    offlineMode: boolean;
}

const SETTINGS_KEY = '@app_settings';

const DEFAULT_SETTINGS: AppSettings = {
    notifications: true,
    dailyReminder: true,
    reminderTime: '08:00',
    theme: 'auto',
    fontSize: 'medium',
    offlineMode: false,
};

export class SettingsService {
    async getSettings(): Promise<AppSettings> {
        try {
            const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                return { ...DEFAULT_SETTINGS, ...settings };
            }
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error loading settings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    async updateSetting<K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ): Promise<void> {
        try {
            const currentSettings = await this.getSettings();
            const newSettings = { ...currentSettings, [key]: value };
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error saving setting:', error);
            throw error;
        }
    }

    async resetSettings(): Promise<void> {
        try {
            await AsyncStorage.removeItem(SETTINGS_KEY);
        } catch (error) {
            console.error('Error resetting settings:', error);
            throw error;
        }
    }

    async exportSettings(): Promise<string> {
        try {
            const settings = await this.getSettings();
            return JSON.stringify(settings, null, 2);
        } catch (error) {
            console.error('Error exporting settings:', error);
            throw error;
        }
    }

    async importSettings(settingsJson: string): Promise<void> {
        try {
            const settings = JSON.parse(settingsJson);
            const validatedSettings = { ...DEFAULT_SETTINGS, ...settings };
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(validatedSettings));
        } catch (error) {
            console.error('Error importing settings:', error);
            throw error;
        }
    }
}
