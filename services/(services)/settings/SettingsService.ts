import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {readingPreferencesRepository} from '@/repository';
import type {AppSettings, CreateReadingPreferencesDto, ReadingPreferences, UpdateReadingPreferencesDto} from '@/models';

const DEFAULT_USER_ID = 1;
const SETTINGS_CACHE_KEY = '@app_settings_cache';
const SETTINGS_VERSION = '1.0.0';

export interface SettingsValidationError {
    field: string;
    message: string;
    value: any;
}

export interface SettingsBackup {
    version: string;
    timestamp: string;
    settings: AppSettings;
    dailyVerseGoal: number;
    metadata?: {
        deviceInfo?: string;
        appVersion?: string;
    };
}

export class SettingsService {
    private cache: AppSettings | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Updated validation schemas to include new notification preferences
    private readonly validationRules = {
        notifications: (value: any): boolean => typeof value === 'boolean',
        dailyReminder: (value: any): boolean => typeof value === 'boolean',
        streakReminder: (value: any): boolean => typeof value === 'boolean',
        goalReminder: (value: any): boolean => typeof value === 'boolean',
        achievementNotifications: (value: any): boolean => typeof value === 'boolean',
        reminderTime: (value: any): boolean => {
            if (typeof value !== 'string') return false;
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timeRegex.test(value);
        },
        theme: (value: any): boolean => ['light', 'dark', 'auto'].includes(value),
        fontSize: (value: any): boolean => ['small', 'medium', 'large'].includes(value),
        offlineMode: (value: any): boolean => typeof value === 'boolean',
    };

    // Main public methods
    async getSettings(): Promise<AppSettings> {
        try {
            // Return cached settings if valid
            if (this.isCacheValid()) {
                return this.cache!;
            }

            // Try to load from cache storage first
            const cachedSettings = await this.loadFromCache();
            if (cachedSettings) {
                this.updateCache(cachedSettings);
                return cachedSettings;
            }

            // Load from database
            let preferences = await readingPreferencesRepository.findByUserId(DEFAULT_USER_ID);

            // If no preferences exist, create default ones
            if (!preferences) {
                const defaultPrefs: CreateReadingPreferencesDto = {
                    userId: DEFAULT_USER_ID,
                    preferredReadingTime: 'morning',
                    dailyVerseGoal: 10,
                    streakGraceHours: 2,
                    notificationEnabled: true,
                    notificationTime: '08:00',
                    themePreference: 'auto',
                    fontSize: 'medium'
                };

                const createdPreferences = await readingPreferencesRepository.create(defaultPrefs);
                preferences = await readingPreferencesRepository.findById(createdPreferences.id);
            }

            const settings = preferences ? this.mapPreferencesToSettings(preferences) : this.getDefaultSettings();
            this.updateCache(settings);
            return settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            const defaultSettings = this.getDefaultSettings();
            this.updateCache(defaultSettings);
            return defaultSettings;
        }
    }

    async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<{
        success: boolean;
        errors?: SettingsValidationError[]
    }> {
        try {
            // Validate the setting
            const validationErrors = this.validateSetting(key, value);
            if (validationErrors.length > 0) {
                return {success: false, errors: validationErrors};
            }

            // Get or create preferences
            let preferences = await readingPreferencesRepository.findByUserId(DEFAULT_USER_ID);

            if (!preferences) {
                const defaultPrefs: CreateReadingPreferencesDto = {
                    userId: DEFAULT_USER_ID,
                    preferredReadingTime: 'morning',
                    dailyVerseGoal: 10,
                    streakGraceHours: 2,
                    notificationEnabled: true,
                    notificationTime: '08:00',
                    themePreference: 'auto',
                    fontSize: 'medium'
                };

                const createdPreferences = await readingPreferencesRepository.create(defaultPrefs);
                preferences = await readingPreferencesRepository.findById(createdPreferences.id);
            }
            if (preferences) {
                const settingsUpdate = {[key]: value} as Partial<AppSettings>;
                const preferencesUpdate = this.mapSettingsToPreferences(settingsUpdate);

                await readingPreferencesRepository.update({
                    id: preferences.id,
                    ...preferencesUpdate
                });

                // Update cache
                const currentSettings = await this.getSettings();
                const updatedSettings = {...currentSettings, [key]: value};
                this.updateCache(updatedSettings);
            }

            return {success: true};
        } catch (error) {
            console.error('Error updating setting:', error);
            return {
                success: false,
                errors: [{field: key, message: 'Failed to save setting', value}]
            };
        }
    }

    async updateMultipleSettings(updates: Partial<AppSettings>): Promise<{
        success: boolean;
        errors?: SettingsValidationError[]
    }> {
        try {
            // Validate all updates
            const validationErrors = this.validateAllSettings(updates);
            if (validationErrors.length > 0) {
                return {success: false, errors: validationErrors};
            }

            // Get or create preferences
            let preferences = await readingPreferencesRepository.findByUserId(DEFAULT_USER_ID);

            if (!preferences) {
                const defaultPrefs: CreateReadingPreferencesDto = {
                    userId: DEFAULT_USER_ID,
                    preferredReadingTime: 'morning',
                    dailyVerseGoal: 10,
                    streakGraceHours: 2,
                    notificationEnabled: true,
                    notificationTime: '08:00',
                    themePreference: 'auto',
                    fontSize: 'medium'
                };

                const createdPreferences = await readingPreferencesRepository.create(defaultPrefs);
                preferences = await readingPreferencesRepository.findById(createdPreferences.id);
            }

            if (preferences) {
                const preferencesUpdate = this.mapSettingsToPreferences(updates);

                await readingPreferencesRepository.update({
                    id: preferences.id,
                    ...preferencesUpdate
                });

                // Update cache
                const currentSettings = await this.getSettings();
                const updatedSettings = {...currentSettings, ...updates};
                this.updateCache(updatedSettings);
            }

            return {success: true};
        } catch (error) {
            console.error('Error updating multiple settings:', error);
            return {
                success: false,
                errors: [{field: 'general', message: 'Failed to save settings', value: updates}]
            };
        }
    }

    async resetSettings(): Promise<{ success: boolean; error?: string }> {
        try {
            const preferences = await readingPreferencesRepository.findByUserId(DEFAULT_USER_ID);

            if (preferences) {
                await readingPreferencesRepository.update({
                    id: preferences.id,
                    preferredReadingTime: 'morning',
                    dailyVerseGoal: 10,
                    streakGraceHours: 2,
                    notificationEnabled: true,
                    notificationTime: '08:00',
                    themePreference: 'auto',
                    fontSize: 'medium'
                });
            }

            // Clear cache and reload
            this.cache = null;
            this.cacheTimestamp = 0;
            await AsyncStorage.removeItem(SETTINGS_CACHE_KEY);

            return {success: true};
        } catch (error) {
            console.error('Error resetting settings:', error);
            return {success: false, error: 'Failed to reset settings'};
        }
    }

    async exportSettings(): Promise<{ success: boolean; data?: string; error?: string }> {
        try {
            const settings = await this.getSettings();
            const dailyGoal = await this.getDailyVerseGoal();

            const backup: SettingsBackup = {
                version: SETTINGS_VERSION,
                timestamp: new Date().toISOString(),
                settings,
                dailyVerseGoal: dailyGoal,
                metadata: {
                    appVersion: '1.0.0', // You would get this from your app config
                    deviceInfo: `${Platform.OS} ${Platform.Version}`,
                },
            };

            const exportData = JSON.stringify(backup, null, 2);
            return {success: true, data: exportData};
        } catch (error) {
            console.error('Error exporting settings:', error);
            return {success: false, error: 'Failed to export settings'};
        }
    }

    async importSettings(settingsJson: string): Promise<{ success: boolean; imported?: number; errors?: string[] }> {
        try {
            const backup: SettingsBackup = JSON.parse(settingsJson);
            const errors: string[] = [];

            // Validate backup format
            if (!backup.version || !backup.settings) {
                return {success: false, errors: ['Invalid backup format']};
            }

            // Check version compatibility
            if (backup.version !== SETTINGS_VERSION) {
                errors.push(`Version mismatch: backup is ${backup.version}, current is ${SETTINGS_VERSION}`);
            }

            // Validate settings
            const validationErrors = this.validateAllSettings(backup.settings);
            if (validationErrors.length > 0) {
                errors.push(...validationErrors.map(e => `${e.field}: ${e.message}`));
            }

            if (errors.length > 0) {
                return {success: false, errors};
            }

            // Import settings
            const updateResult = await this.updateMultipleSettings(backup.settings);
            if (!updateResult.success) {
                return {
                    success: false,
                    errors: updateResult.errors?.map(e => e.message) || ['Unknown import error']
                };
            }

            // Import daily goal if present
            if (backup.dailyVerseGoal) {
                await this.updateDailyVerseGoal(backup.dailyVerseGoal);
            }

            const importedCount = Object.keys(backup.settings).length + (backup.dailyVerseGoal ? 1 : 0);
            return {success: true, imported: importedCount};
        } catch (error) {
            console.error('Error importing settings:', error);
            return {success: false, errors: ['Failed to parse or import settings']};
        }
    }

    // Daily verse goal methods
    async getDailyVerseGoal(): Promise<number> {
        try {
            const preferences = await readingPreferencesRepository.findByUserId(DEFAULT_USER_ID);
            return preferences?.dailyVerseGoal ?? 10;
        } catch (error) {
            console.error('Error getting daily verse goal:', error);
            return 10;
        }
    }

    async updateDailyVerseGoal(goal: number): Promise<{ success: boolean; error?: string }> {
        try {
            // Validate goal
            if (!Number.isInteger(goal) || goal < 1 || goal > 1000) {
                return {success: false, error: 'Daily goal must be between 1 and 1000 verses'};
            }

            let preferences = await readingPreferencesRepository.findByUserId(DEFAULT_USER_ID);

            if (!preferences) {
                const defaultPrefs: CreateReadingPreferencesDto = {
                    userId: DEFAULT_USER_ID,
                    dailyVerseGoal: goal,
                    preferredReadingTime: 'morning',
                    streakGraceHours: 2,
                    notificationEnabled: true,
                    notificationTime: '08:00',
                    themePreference: 'auto',
                    fontSize: 'medium'
                };
                await readingPreferencesRepository.create(defaultPrefs);
            } else {
                await readingPreferencesRepository.update({
                    id: preferences.id,
                    dailyVerseGoal: goal
                });
            }

            return {success: true};
        } catch (error) {
            console.error('Error updating daily verse goal:', error);
            return {success: false, error: 'Failed to update daily verse goal'};
        }
    }

    // Utility methods
    async clearCache(): Promise<void> {
        this.cache = null;
        this.cacheTimestamp = 0;
        try {
            await AsyncStorage.removeItem(SETTINGS_CACHE_KEY);
        } catch (error) {
            console.warn('Failed to clear settings cache:', error);
        }
    }

    async getSettingsInfo(): Promise<{
        hasCache: boolean;
        cacheAge: number;
        lastModified?: string;
        version: string;
    }> {
        try {
            const cachedData = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
            const cacheInfo = cachedData ? JSON.parse(cachedData) : null;

            return {
                hasCache: this.cache !== null,
                cacheAge: Date.now() - this.cacheTimestamp,
                lastModified: cacheInfo?.timestamp ? new Date(cacheInfo.timestamp).toISOString() : undefined,
                version: SETTINGS_VERSION,
            };
        } catch (error) {
            return {
                hasCache: false,
                cacheAge: 0,
                version: SETTINGS_VERSION,
            };
        }
    }

    // Migrate settings from old versions (if needed)
    async migrateSettings(fromVersion: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Implement migration logic based on version
            switch (fromVersion) {
                case '0.9.0':
                    // Example migration from 0.9.0 to 1.0.0
                    const oldSettings = await this.getSettings();
                    // Perform any necessary transformations
                    await this.updateMultipleSettings(oldSettings);
                    break;
                default:
                    console.log(`No migration needed from version ${fromVersion}`);
            }

            return {success: true};
        } catch (error) {
            console.error('Settings migration failed:', error);
            return {success: false, error: 'Migration failed'};
        }
    }

    // Updated default settings to include new notification preferences
    private getDefaultSettings(): AppSettings {
        return {
            notifications: true,
            dailyReminder: true,
            streakReminder: true,
            goalReminder: true,
            achievementNotifications: true,
            reminderTime: '08:00',
            theme: 'auto',
            fontSize: 'medium',
            offlineMode: false,
        };
    }

    // Cache management
    private isCacheValid(): boolean {
        return this.cache !== null && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
    }

    private updateCache(settings: AppSettings): void {
        this.cache = {...settings};
        this.cacheTimestamp = Date.now();

        // Also cache to AsyncStorage for persistence across app restarts
        this.cacheToStorage(settings).catch(error => {
            console.warn('Failed to cache settings to storage:', error);
        });
    }

    private async cacheToStorage(settings: AppSettings): Promise<void> {
        try {
            const cacheData = {
                settings,
                timestamp: Date.now(),
                version: SETTINGS_VERSION,
            };
            await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Failed to cache settings to storage:', error);
        }
    }

    private async loadFromCache(): Promise<AppSettings | null> {
        try {
            const cached = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            // Cache valid for 1 hour in storage
            if (age < 60 * 60 * 1000 && cacheData.version === SETTINGS_VERSION) {
                return cacheData.settings;
            }
        } catch (error) {
            console.warn('Failed to load cached settings:', error);
        }
        return null;
    }

    // Validation methods
    private validateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): SettingsValidationError[] {
        const errors: SettingsValidationError[] = [];
        const validator = this.validationRules[key];

        if (!validator || !validator(value)) {
            errors.push({
                field: key,
                message: `Invalid value for ${key}`,
                value,
            });
        }

        // Additional specific validations
        if (key === 'reminderTime' && typeof value === 'string') {
            const [hours, minutes] = value.split(':').map(Number);
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                errors.push({
                    field: key,
                    message: 'Reminder time must be in 24-hour format (00:00-23:59)',
                    value,
                });
            }
        }

        return errors;
    }

    private validateAllSettings(settings: Partial<AppSettings>): SettingsValidationError[] {
        const errors: SettingsValidationError[] = [];

        for (const [key, value] of Object.entries(settings)) {
            const fieldErrors = this.validateSetting(key as keyof AppSettings, value as any);
            errors.push(...fieldErrors);
        }

        return errors;
    }

    // Updated data transformation methods to handle new notification preferences
    private mapPreferencesToSettings(prefs: ReadingPreferences): AppSettings {
        return {
            notifications: prefs.notificationEnabled ?? true,
            dailyReminder: prefs.notificationEnabled ?? true, // Default to enabled if master is enabled
            streakReminder: true, // Default to enabled (you might want to add these fields to your DB schema)
            goalReminder: true, // Default to enabled
            achievementNotifications: true, // Default to enabled
            reminderTime: prefs.notificationTime ?? '08:00',
            theme: (prefs.themePreference as 'light' | 'dark' | 'auto') ?? 'auto',
            fontSize: (prefs.fontSize as 'small' | 'medium' | 'large') ?? 'medium',
            offlineMode: false, // Not in DB schema, defaulting to false
        };
    }

    private mapSettingsToPreferences(settings: Partial<AppSettings>): Partial<UpdateReadingPreferencesDto> {
        const prefs: Partial<UpdateReadingPreferencesDto> = {};

        if (settings.notifications !== undefined) {
            prefs.notificationEnabled = settings.notifications;
        }
        if (settings.reminderTime !== undefined) {
            prefs.notificationTime = settings.reminderTime;
        }
        if (settings.theme !== undefined) {
            prefs.themePreference = settings.theme;
        }
        if (settings.fontSize !== undefined) {
            prefs.fontSize = settings.fontSize;
        }

        // Note: Individual notification preferences (dailyReminder, streakReminder, etc.)
        // might need additional database fields if you want to persist them separately
        // For now, they're stored in the settings cache but not in the database

        return prefs;
    }
}
