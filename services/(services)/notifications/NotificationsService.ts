import * as Notifications from 'expo-notifications';
import {Linking, Platform} from 'react-native';
import {localizationService} from '@/services/(services)/localization/localization.service';
import {progressService} from '@/services/(services)/progress/ProgressService';
import {settingsService} from '@/services/(services)/settings/SettingsService';
import {
    buildDailyReminder,
    buildGoalReminder,
    buildStreakReminder,
    ReminderProgress,
    ReminderText
} from '@/services/(services)/notifications/reminderContent';
import {addDays, parseTime, startOfDay, toLocalDateString} from '@/utils/(utils)/date.utils';
import {logger} from '@/utils/(utils)/logger';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export interface NotificationPermissionStatus {
    granted: boolean;
    canAskAgain: boolean;
    status: Notifications.PermissionStatus;
}

const REMINDER_CHANNEL_ID = 'bible-reading-reminders';
const DAILY_REMINDER_ID = 'daily_bible_reading';

/**
 * Goal and streak reminders are scheduled individually for this many days
 * ahead (see reminderContent.ts for why). Opening the app renews them.
 */
const DAYS_SCHEDULED_AHEAD = 7;

/**
 * Local reminder notifications.
 *
 * `syncReminders()` is the single entry point that brings the scheduled
 * notifications in line with the current settings *and* the current reading
 * progress. It is called on app start, when the app returns to the
 * foreground, after every progress change and after every settings change.
 */
export class NotificationService {
    private channelReady = false;
    private syncQueue: Promise<void> = Promise.resolve();

    /** Asks for notification permission if needed. Returns whether it is granted. */
    async requestPermission(): Promise<boolean> {
        try {
            const current = await Notifications.getPermissionsAsync();
            if (current.granted) return true;
            if (!current.canAskAgain) return false;

            const requested = await Notifications.requestPermissionsAsync({
                ios: {allowAlert: true, allowBadge: false, allowSound: true},
            });
            return requested.granted;
        } catch (error) {
            logger.error('Failed to request notification permission', error);
            return false;
        }
    }

    async getPermissionStatus(): Promise<NotificationPermissionStatus> {
        try {
            const {status, canAskAgain, granted} = await Notifications.getPermissionsAsync();
            return {granted, canAskAgain, status};
        } catch {
            return {granted: false, canAskAgain: true, status: Notifications.PermissionStatus.UNDETERMINED};
        }
    }

    /**
     * Reschedules all reminders from the current settings and progress.
     * Never prompts for permission; without permission nothing is scheduled.
     * Calls are queued so that two syncs cannot interleave.
     */
    syncReminders(): Promise<void> {
        this.syncQueue = this.syncQueue
            .then(() => this.rescheduleAll())
            .catch(error => logger.error('Failed to sync reminders', error));
        return this.syncQueue;
    }

    async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        try {
            return await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
            logger.warn('Failed to read scheduled notifications', error);
            return [];
        }
    }

    async cancelAllNotifications(): Promise<boolean> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            return true;
        } catch {
            return false;
        }
    }

    async sendImmediateNotification(title: string, body: string, data: Record<string, unknown> = {}): Promise<boolean> {
        try {
            await this.ensureChannel();
            await Notifications.scheduleNotificationAsync({
                content: {title, body, data, sound: 'default'},
                trigger: Platform.OS === 'android' ? {channelId: REMINDER_CHANNEL_ID} : null,
            });
            return true;
        } catch (error) {
            logger.warn('Failed to send notification', error);
            return false;
        }
    }

    /** Opens the system settings page of the app. */
    openNotificationSettings(): void {
        Linking.openSettings().catch(error => logger.warn('Could not open settings', error));
    }

    // ---------------------------------------------------------------------

    private async rescheduleAll(): Promise<void> {
        if (Platform.OS === 'web') return;

        const [settings, permission] = await Promise.all([
            settingsService.getSettings(),
            Notifications.getPermissionsAsync(),
        ]);

        // Start from a clean slate; this app is the only source of scheduled
        // notifications, so nothing else can get lost.
        await Notifications.cancelAllScheduledNotificationsAsync();

        if (!settings.notifications || !permission.granted) return;
        if (!settings.dailyReminder && !settings.goalReminder && !settings.streakReminder) return;

        await this.ensureChannel();

        const progress = await this.loadProgress();
        const t = (key: string, options?: Record<string, unknown>) => localizationService.t(key, options);

        if (settings.dailyReminder) {
            await this.scheduleRepeatingDaily(DAILY_REMINDER_ID, settings.reminderTime, buildDailyReminder(progress, t));
        }

        for (let dayOffset = 0; dayOffset < DAYS_SCHEDULED_AHEAD; dayOffset++) {
            if (settings.goalReminder) {
                await this.scheduleOnDay('goal_reminder', dayOffset, settings.goalReminderTime,
                    buildGoalReminder(dayOffset, progress, t));
            }
            if (settings.streakReminder) {
                await this.scheduleOnDay('streak_reminder', dayOffset, settings.streakReminderTime,
                    buildStreakReminder(dayOffset, progress, t));
            }
        }
    }

    private async loadProgress(): Promise<ReminderProgress> {
        const [periods, streak, dailyVerseGoal] = await Promise.all([
            progressService.getPeriodStats(),
            progressService.getStreak(),
            settingsService.getDailyVerseGoal(),
        ]);

        return {
            versesReadToday: periods.today,
            dailyVerseGoal,
            currentStreak: streak.currentStreak,
            readToday: streak.readToday,
        };
    }

    private async scheduleRepeatingDaily(identifier: string, time: string, text: ReminderText): Promise<void> {
        const parsed = parseTime(time);
        if (!parsed) {
            logger.warn(`Skipping reminder with invalid time "${time}"`);
            return;
        }

        await Notifications.scheduleNotificationAsync({
            identifier,
            content: {title: text.title, body: text.body, sound: 'default', data: {type: identifier}},
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: parsed.hour,
                minute: parsed.minute,
                channelId: REMINDER_CHANNEL_ID,
            },
        });
    }

    /** Schedules a one-off notification `dayOffset` days from today at `time`. */
    private async scheduleOnDay(type: string, dayOffset: number, time: string, text: ReminderText | null): Promise<void> {
        const parsed = parseTime(time);
        if (!text || !parsed) return;

        const fireAt = addDays(startOfDay(), dayOffset);
        fireAt.setHours(parsed.hour, parsed.minute, 0, 0);
        if (fireAt.getTime() <= Date.now()) return; // today's time has already passed

        await Notifications.scheduleNotificationAsync({
            identifier: `${type}_${toLocalDateString(fireAt)}`,
            content: {title: text.title, body: text.body, sound: 'default', data: {type}},
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: fireAt,
                channelId: REMINDER_CHANNEL_ID,
            },
        });
    }

    private async ensureChannel(): Promise<void> {
        if (Platform.OS !== 'android' || this.channelReady) return;

        await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
            name: 'Daily Reading Reminders',
            description: 'Notifications to remind you of your daily Bible reading',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4F46E5',
        });
        this.channelReady = true;
    }
}

export const notificationService = new NotificationService();
