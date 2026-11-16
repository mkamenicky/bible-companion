import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import Constants from 'expo-constants';
import {readingPreferencesRepository} from '@/repository';
import type {AppSettings, ReadingPreferences} from '@/models';
import {parseTime} from '@/utils/(utils)/date.utils';
import {logger} from '@/utils/(utils)/logger';

const USER_ID = 1;
const SETTINGS_VERSION = '1.1.0';
const DEFAULT_DAILY_VERSE_GOAL = 10;
const MAX_DAILY_VERSE_GOAL = 1000;

/** Reminder switches and the two extra reminder times live in AsyncStorage. */
const REMINDER_PREFERENCES_KEY = '@notification_preferences';
/** Obsolete: a 5-minute settings cache that made saved times revert. */
const LEGACY_SETTINGS_CACHE_KEY = '@app_settings_cache';

/** The part of the settings that is not stored in the reading_preferences table. */
type ReminderPreferences = Pick<AppSettings,
    'dailyReminder' | 'streakReminder' | 'goalReminder' | 'achievementNotifications'
    | 'streakReminderTime' | 'goalReminderTime'>;

const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
    dailyReminder: false,
    streakReminder: false,
    goalReminder: false,
    achievementNotifications: false,
    streakReminderTime: '20:00',
    goalReminderTime: '18:00',
};

const DEFAULT_SETTINGS: AppSettings = {
    notifications: true,
    reminderTime: '08:00',
    theme: 'auto',
    fontSize: 'medium',
    ...DEFAULT_REMINDER_PREFERENCES,
};

const REMINDER_KEYS = Object.keys(DEFAULT_REMINDER_PREFERENCES) as Array<keyof ReminderPreferences>;

export interface SettingsValidationError {
    field: string;
    message: string;
    value: unknown;
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

const isBoolean = (value: unknown): boolean => typeof value === 'boolean';
const isTime = (value: unknown): boolean => typeof value === 'string' && parseTime(value) !== null;

const VALIDATORS: Record<keyof AppSettings, (value: unknown) => boolean> = {
    notifications: isBoolean,
    dailyReminder: isBoolean,
    streakReminder: isBoolean,
    goalReminder: isBoolean,
    achievementNotifications: isBoolean,
    reminderTime: isTime,
    streakReminderTime: isTime,
    goalReminderTime: isTime,
    theme: value => ['light', 'dark', 'auto'].includes(value as string),
    fontSize: value => ['small', 'medium', 'large'].includes(value as string),
};

/**
 * User settings.
 *
 * Stored in two places for historical reasons: the reading_preferences table
 * (master notification switch, daily reminder time, theme, font size, daily
 * verse goal) and AsyncStorage (the individual reminder switches and times).
 * This service hides that split behind one AppSettings object.
 */
export class SettingsService {
    private cache: AppSettings | null = null;

    async getSettings(): Promise<AppSettings> {
        if (this.cache) return this.cache;

        try {
            const [preferences, reminders] = await Promise.all([
                this.getOrCreatePreferences(),
                this.loadReminderPreferences(),
            ]);

            this.cache = {
                ...DEFAULT_SETTINGS,
                ...reminders,
                notifications: preferences.notificationEnabled ?? true,
                reminderTime: isTime(preferences.notificationTime) ? preferences.notificationTime : DEFAULT_SETTINGS.reminderTime,
                theme: VALIDATORS.theme(preferences.themePreference) ? preferences.themePreference as AppSettings['theme'] : 'auto',
                fontSize: VALIDATORS.fontSize(preferences.fontSize) ? preferences.fontSize as AppSettings['fontSize'] : 'medium',
            };
            return this.cache;
        } catch (error) {
            logger.error('Error loading settings, using defaults', error);
            return {...DEFAULT_SETTINGS};
        }
    }

    async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<{
        success: boolean;
        errors?: SettingsValidationError[]
    }> {
        if (!VALIDATORS[key](value)) {
            return {success: false, errors: [{field: key, message: `Invalid value for ${key}`, value}]};
        }

        try {
            const current = await this.getSettings();
            const updated: AppSettings = {...current, [key]: value};

            if ((REMINDER_KEYS as string[]).includes(key)) {
                await this.saveReminderPreferences(updated);
            } else {
                const preferences = await this.getOrCreatePreferences();
                await readingPreferencesRepository.update({
                    id: preferences.id,
                    notificationEnabled: updated.notifications,
                    notificationTime: updated.reminderTime,
                    themePreference: updated.theme,
                    fontSize: updated.fontSize,
                });
            }

            this.cache = updated;
            return {success: true};
        } catch (error) {
            logger.error('Error updating setting', error);
            return {success: false, errors: [{field: key, message: 'Failed to save setting', value}]};
        }
    }

    async getDailyVerseGoal(): Promise<number> {
        try {
            const preferences = await this.getOrCreatePreferences();
            return preferences.dailyVerseGoal > 0 ? preferences.dailyVerseGoal : DEFAULT_DAILY_VERSE_GOAL;
        } catch (error) {
            logger.error('Error getting daily verse goal', error);
            return DEFAULT_DAILY_VERSE_GOAL;
        }
    }

    async updateDailyVerseGoal(goal: number): Promise<{ success: boolean; error?: string }> {
        if (!Number.isInteger(goal) || goal < 1 || goal > MAX_DAILY_VERSE_GOAL) {
            return {success: false, error: `Daily goal must be between 1 and ${MAX_DAILY_VERSE_GOAL} verses`};
        }

        try {
            const preferences = await this.getOrCreatePreferences();
            await readingPreferencesRepository.update({id: preferences.id, dailyVerseGoal: goal});
            return {success: true};
        } catch (error) {
            logger.error('Error updating daily verse goal', error);
            return {success: false, error: 'Failed to update daily verse goal'};
        }
    }

    async exportSettings(): Promise<{ success: boolean; data?: string; error?: string }> {
        try {
            const backup: SettingsBackup = {
                version: SETTINGS_VERSION,
                timestamp: new Date().toISOString(),
                settings: await this.getSettings(),
                dailyVerseGoal: await this.getDailyVerseGoal(),
                metadata: {
                    appVersion: Constants.expoConfig?.version ?? 'unknown',
                    deviceInfo: `${Platform.OS} ${Platform.Version}`,
                },
            };
            return {success: true, data: JSON.stringify(backup, null, 2)};
        } catch (error) {
            logger.error('Error exporting settings', error);
            return {success: false, error: 'Failed to export settings'};
        }
    }

    async resetToDefaults(): Promise<{ success: boolean; error?: string }> {
        try {
            const preferences = await this.getOrCreatePreferences();
            await readingPreferencesRepository.update({
                id: preferences.id,
                preferredReadingTime: 'morning',
                dailyVerseGoal: DEFAULT_DAILY_VERSE_GOAL,
                notificationEnabled: DEFAULT_SETTINGS.notifications,
                notificationTime: DEFAULT_SETTINGS.reminderTime,
                themePreference: DEFAULT_SETTINGS.theme,
                fontSize: DEFAULT_SETTINGS.fontSize,
            });
            await AsyncStorage.removeItem(REMINDER_PREFERENCES_KEY);

            this.cache = null;
            return {success: true};
        } catch (error) {
            logger.error('Error resetting settings', error);
            return {success: false, error: 'Failed to reset settings'};
        }
    }

    /** Forces the next getSettings() to read from storage again. */
    invalidateCache(): void {
        this.cache = null;
    }

    private async getOrCreatePreferences(): Promise<ReadingPreferences> {
        const existing = await readingPreferencesRepository.findByUserId(USER_ID);
        if (existing) return existing;

        return readingPreferencesRepository.create({
            userId: USER_ID,
            preferredReadingTime: 'morning',
            dailyVerseGoal: DEFAULT_DAILY_VERSE_GOAL,
            notificationEnabled: DEFAULT_SETTINGS.notifications,
            notificationTime: DEFAULT_SETTINGS.reminderTime,
            themePreference: DEFAULT_SETTINGS.theme,
            fontSize: DEFAULT_SETTINGS.fontSize,
        });
    }

    private async loadReminderPreferences(): Promise<ReminderPreferences> {
        try {
            AsyncStorage.removeItem(LEGACY_SETTINGS_CACHE_KEY).catch(() => undefined);

            const stored = await AsyncStorage.getItem(REMINDER_PREFERENCES_KEY);
            const parsed: Record<string, unknown> = stored ? JSON.parse(stored) : {};

            // Take only known keys with valid values; anything else falls back.
            const result: Record<string, unknown> = {...DEFAULT_REMINDER_PREFERENCES};
            for (const key of REMINDER_KEYS) {
                if (key in parsed && VALIDATORS[key](parsed[key])) {
                    result[key] = parsed[key];
                }
            }
            return result as ReminderPreferences;
        } catch (error) {
            logger.warn('Failed to load reminder preferences', error);
            return {...DEFAULT_REMINDER_PREFERENCES};
        }
    }

    private async saveReminderPreferences(settings: AppSettings): Promise<void> {
        const toStore: Record<string, unknown> = {};
        for (const key of REMINDER_KEYS) {
            toStore[key] = settings[key];
        }
        await AsyncStorage.setItem(REMINDER_PREFERENCES_KEY, JSON.stringify(toStore));
    }
}

export const settingsService = new SettingsService();
