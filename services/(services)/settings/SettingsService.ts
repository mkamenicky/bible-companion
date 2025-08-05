import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { readingPreferencesRepository } from '@/repository';
import type { AppSettings, CreateReadingPreferencesDto, ReadingPreferences } from '@/models';

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
    private isLoading = false; // Prevent concurrent loads

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
        streakReminderTime: (value: any): boolean => {
            if (typeof value !== 'string') return false;
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timeRegex.test(value);
        },
        goalReminderTime: (value: any): boolean => {
            if (typeof value !== 'string') return false;
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timeRegex.test(value);
        },
        theme: (value: any): boolean => ['light', 'dark', 'auto'].includes(value),
        fontSize: (value: any): boolean => ['small', 'medium', 'large'].includes(value),
        offlineMode: (value: any): boolean => typeof value === 'boolean',
    };

    async getSettings(): Promise<AppSettings> {
        console.log('📋 SettingsService.getSettings() called');

        // Prevent concurrent loading
        if (this.isLoading) {
            console.log('⏳ Settings already loading, waiting...');
            // Wait for existing load to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            if (this.cache) return this.cache;
        }

        try {
            this.isLoading = true;

            // Return cached settings if valid
            if (this.isCacheValid()) {
                console.log('✅ Using cached settings');
                return this.cache!;
            }

            console.log('💾 Loading settings from AsyncStorage cache...');
            // Try to load from AsyncStorage cache first
            const cachedSettings = await this.loadFromCache();
            if (cachedSettings) {
                console.log('✅ Loaded from AsyncStorage cache');
                this.updateCacheInMemory(cachedSettings); // Fixed: don't call getSettings() again
                return cachedSettings;
            }

            console.log('🗄️ Loading settings from database...');
            // Load from database with timeout
            const settings = await Promise.race([
                this.loadFromDatabase(),
                new Promise<AppSettings>((_, reject) =>
                    setTimeout(() => reject(new Error('Database timeout')), 10000)
                )
            ]);

            console.log('✅ Settings loaded from database');
            this.updateCacheInMemory(settings);
            await this.saveToCache(settings); // Save to AsyncStorage
            return settings;

        } catch (error) {
            console.error('❌ Error loading settings:', error);
            const defaultSettings = this.getDefaultSettings();
            this.updateCacheInMemory(defaultSettings);
            return defaultSettings;
        } finally {
            this.isLoading = false;
        }
    }

    private async loadFromDatabase(): Promise<AppSettings> {
        try {
            let preferences = await readingPreferencesRepository.findByUserId(DEFAULT_USER_ID);

            if (!preferences) {
                console.log('🆕 Creating default preferences');
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

            return preferences ? this.mapPreferencesToSettings(preferences) : this.getDefaultSettings();
        } catch (error) {
            console.error('❌ Database load failed:', error);
            throw error;
        }
    }

    async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<{
        success: boolean;
        errors?: SettingsValidationError[]
    }> {
        try {
            const validationErrors = this.validateSetting(key, value);
            if (validationErrors.length > 0) {
                return { success: false, errors: validationErrors };
            }

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
                const settingsUpdate = { [key]: value } as Partial<AppSettings>;
                const preferencesUpdate = this.mapSettingsToPreferences(settingsUpdate);

                await readingPreferencesRepository.update({
                    id: preferences.id,
                    ...preferencesUpdate
                });

                // Update cache directly without calling getSettings()
                if (this.cache) {
                    const updatedSettings = { ...this.cache, [key]: value };
                    this.updateCacheInMemory(updatedSettings);
                    await this.saveToCache(updatedSettings);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating setting:', error);
            return {
                success: false,
                errors: [{ field: key, message: 'Failed to save setting', value }]
            };
        }
    }

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
            if (!Number.isInteger(goal) || goal < 1 || goal > 1000) {
                return { success: false, error: 'Daily goal must be between 1 and 1000 verses' };
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

            return { success: true };
        } catch (error) {
            console.error('Error updating daily verse goal:', error);
            return { success: false, error: 'Failed to update daily verse goal' };
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
                    appVersion: '1.0.0',
                    deviceInfo: `${Platform.OS} ${Platform.Version}`,
                },
            };

            const exportData = JSON.stringify(backup, null, 2);
            return { success: true, data: exportData };
        } catch (error) {
            console.error('Error exporting settings:', error);
            return { success: false, error: 'Failed to export settings' };
        }
    }

    async resetToDefaults(): Promise<{ success: boolean; error?: string }> {
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

            // Clear all caches
            this.cache = null;
            this.cacheTimestamp = 0;
            await AsyncStorage.removeItem(SETTINGS_CACHE_KEY);

            return { success: true };
        } catch (error) {
            console.error('Error resetting settings:', error);
            return { success: false, error: 'Failed to reset settings' };
        }
    }

    // Private helper methods
    private isCacheValid(): boolean {
        return this.cache !== null &&
            this.cacheTimestamp > 0 &&
            (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
    }

    private updateCacheInMemory(settings: AppSettings): void {
        this.cache = settings;
        this.cacheTimestamp = Date.now();
    }

    private async loadFromCache(): Promise<AppSettings | null> {
        try {
            const cached = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.settings && parsed.timestamp) {
                    const age = Date.now() - parsed.timestamp;
                    if (age < this.CACHE_DURATION) {
                        return parsed.settings;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load from cache:', error);
        }
        return null;
    }

    private async saveToCache(settings: AppSettings): Promise<void> {
        try {
            const cacheData = {
                settings,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save to cache:', error);
        }
    }

    private getDefaultSettings(): AppSettings {
        return {
            notifications: true,
            dailyReminder: true,
            streakReminder: true,
            goalReminder: true,
            achievementNotifications: true,
            reminderTime: '08:00',
            streakReminderTime: '20:00',
            goalReminderTime: '18:00',
            theme: 'auto',
            fontSize: 'medium',
            offlineMode: false,
        };
    }

    private mapPreferencesToSettings(prefs: ReadingPreferences): AppSettings {
        return {
            goalReminderTime: "", streakReminderTime: "",
            notifications: prefs.notificationEnabled ?? true,
            dailyReminder: prefs.notificationEnabled ?? true,
            streakReminder: true,
            goalReminder: true,
            achievementNotifications: true,
            reminderTime: prefs.notificationTime ?? '08:00',
            theme: (prefs.themePreference as 'light' | 'dark' | 'auto') ?? 'auto',
            fontSize: (prefs.fontSize as 'small' | 'medium' | 'large') ?? 'medium',
            offlineMode: false
        };
    }

    private mapSettingsToPreferences(settings: Partial<AppSettings>): Partial<ReadingPreferences> {
        const mapped: any = {};

        if ('notifications' in settings) mapped.notificationEnabled = settings.notifications;
        if ('reminderTime' in settings) mapped.notificationTime = settings.reminderTime;
        if ('theme' in settings) mapped.themePreference = settings.theme;
        if ('fontSize' in settings) mapped.fontSize = settings.fontSize;

        return mapped;
    }

    private validateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): SettingsValidationError[] {
        const rule = this.validationRules[key];
        if (rule && !rule(value)) {
            return [{ field: key, message: `Invalid value for ${key}`, value }];
        }
        return [];
    }

    private validateAllSettings(settings: Partial<AppSettings>): SettingsValidationError[] {
        const errors: SettingsValidationError[] = [];
        for (const [key, value] of Object.entries(settings)) {
            errors.push(...this.validateSetting(key as keyof AppSettings, value));
        }
        return errors;
    }
}
