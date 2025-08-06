import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: false,
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export interface NotificationSchedule {
    id: string;
    title: string;
    message: string;
    time: string;
    enabled: boolean;
    type?: 'daily_reminder' | 'streak_reminder' | 'goal_reminder';
    metadata?: Record<string, unknown>;
}

export interface NotificationPermissionStatus {
    granted: boolean;
    canAskAgain: boolean;
    status: Notifications.PermissionStatus;
}

export interface UserData {
    currentStreak: number;
    dailyGoal: number;
    todayProgress: number;
}

export interface NotificationSettings {
    notifications: boolean;
    dailyReminder: boolean;
    streakReminder: boolean;
    goalReminder: boolean;
    achievementNotifications: boolean;
    reminderTime: string;
    streakReminderTime: string;
    goalReminderTime: string;
}

export type NotificationType = 'dailyReminder' | 'streakReminder' | 'goalReminder' | 'achievementNotifications';

export class NotificationService {
    private initialized = false;
    private permissionStatus: NotificationPermissionStatus | null = null;

    private readonly CHANNELS = {
        REMINDERS: 'bible-reading-reminders',
        ACHIEVEMENTS: 'bible-reading-achievements',
        GENERAL: 'bible-reading-general',
    } as const;

    private readonly NOTIFICATION_IDS = {
        dailyReminder: 'daily_bible_reading',
        streakReminder: 'streak_reminder',
        goalReminder: 'goal_reminder',
        achievementNotifications: 'achievement_notifications',
    } as const;

    async initialize(): Promise<boolean> {
        if (this.initialized) return true;
        try {
            const hasPermission = await this.requestPermissions();
            if (hasPermission) {
                await this.setupNotificationChannels();
                this.initialized = true;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
            return false;
        }
    }

    async getPermissionStatus(): Promise<NotificationPermissionStatus> {
        try {
            const { status, canAskAgain, granted } = await Notifications.getPermissionsAsync();
            this.permissionStatus = { granted, canAskAgain, status };
            return this.permissionStatus;
        } catch {
            return { granted: false, canAskAgain: true, status: Notifications.PermissionStatus.UNDETERMINED };
        }
    }

    private async requestPermissions(): Promise<boolean> {
        const { status, canAskAgain, granted } = await Notifications.getPermissionsAsync();
        this.permissionStatus = { granted, canAskAgain, status };

        if (status !== 'granted' && canAskAgain) {
            const { status: newStatus, canAskAgain: newCanAskAgain, granted: newGranted } =
                await Notifications.requestPermissionsAsync({
                    ios: { allowAlert: true, allowBadge: true, allowSound: true },
                });
            this.permissionStatus = { granted: newGranted, canAskAgain: newCanAskAgain, status: newStatus };
            return newStatus === 'granted';
        }
        return granted;
    }

    private async setupNotificationChannels(): Promise<void> {
        if (Platform.OS !== 'android') return;

        const channels = [
            {
                id: this.CHANNELS.REMINDERS,
                name: 'Daily Reading Reminders',
                description: 'Notifications to remind you of your daily Bible reading',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4F46E5',
            },
            {
                id: this.CHANNELS.ACHIEVEMENTS,
                name: 'Reading Achievements',
                description: 'Celebrate your reading milestones and streaks',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 150, 150, 150],
                lightColor: '#10B981',
            },
            {
                id: this.CHANNELS.GENERAL,
                name: 'General Notifications',
                description: 'App updates and general information',
                importance: Notifications.AndroidImportance.DEFAULT,
            },
        ];

        await Promise.all(
            channels.map(channel => Notifications.setNotificationChannelAsync(channel.id, channel))
        );
    }

    async scheduleSmartReminders(settings: NotificationSettings, userdata: UserData): Promise<void> {
        if (!await this.ensureInitialized()) return;

        if (!settings.notifications) {
            await this.cancelAllNotifications();
            return;
        }

        await this.clearAllScheduledReminders();

        const types: NotificationType[] = ['dailyReminder', 'streakReminder', 'goalReminder', 'achievementNotifications'];
        await Promise.all(
            types
                .filter(type => settings[type])
                .map(type => this.scheduleSpecificNotification(type, settings, userdata))
        );
    }

    async scheduleSpecificNotification(type: NotificationType, settings: NotificationSettings, userdata: UserData): Promise<boolean> {
        if (!await this.ensureInitialized()) return false;

        // Helper function to get streak reminder content
        const getStreakReminderContent = () => {
            if (userdata.currentStreak === 0) {
                return {
                    title: 'Start Your Reading Streak!',
                    message: 'Begin building a daily Bible reading habit. Every journey starts with a single step!'
                };
            } else if (userdata.currentStreak === 1) {
                return {
                    title: 'Keep Going!',
                    message: 'You started yesterday! Keep your momentum going with day 2 of reading.'
                };
            } else if (userdata.currentStreak < 7) {
                return {
                    title: 'Build Your Streak!',
                    message: `You're on day ${userdata.currentStreak}! Keep building your reading habit.`
                };
            } else {
                return {
                    title: 'Protect Your Streak!',
                    message: `Amazing ${userdata.currentStreak}-day streak! Don't break it now.`
                };
            }
        };

        const streakContent = getStreakReminderContent();

        const schedules = {
            dailyReminder: {
                id: this.NOTIFICATION_IDS.dailyReminder,
                title: 'Daily Bible Reading',
                message: `Time to read your ${userdata.dailyGoal} verses today!`,
                time: settings.reminderTime || '08:00',
                enabled: true,
                type: 'daily_reminder' as const,
            },
            streakReminder: {
                id: this.NOTIFICATION_IDS.streakReminder,
                title: streakContent.title,
                message: streakContent.message,
                time: settings.streakReminderTime || '20:00',
                enabled: true,
                type: 'streak_reminder' as const,
            },
            goalReminder: {
                id: this.NOTIFICATION_IDS.goalReminder,
                title: 'Daily Goal Check',
                message: userdata.todayProgress >= userdata.dailyGoal 
                    ? `Great job! You've completed your daily goal of ${userdata.dailyGoal} verses! 🎉`
                    : `You've read ${userdata.todayProgress}/${userdata.dailyGoal} verses today. You're getting there!`,
                time: settings.goalReminderTime || '18:00',
                enabled: true,
                type: 'goal_reminder' as const,
            },
            achievementNotifications: null, // Immediate notifications only
        };

        const schedule = schedules[type];
        if (!schedule) return true; // Achievement notifications are handled elsewhere

        return this.scheduleDailyReminder(schedule);
    }

    async cancelSpecificNotification(type: NotificationType): Promise<boolean> {
        if (type === 'achievementNotifications') return true;

        const notificationId = this.NOTIFICATION_IDS[type];
        return this.cancelNotification(notificationId);
    }

    private async scheduleDailyReminder(schedule: NotificationSchedule): Promise<boolean> {
        if (!schedule.enabled) {
            await this.cancelNotification(schedule.id);
            return true;
        }

        await this.cancelNotification(schedule.id);
        const [hour, minute] = schedule.time.split(':').map(Number);

        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            throw new Error(`Invalid time format: ${schedule.time}`);
        }

        const data: Record<string, unknown> = {
            type: schedule.type,
            id: schedule.id,
            scheduledTime: schedule.time,
            ...(schedule.metadata || {}),
        };

        const identifier = await Notifications.scheduleNotificationAsync({
            identifier: schedule.id,
            content: {
                title: schedule.title,
                body: schedule.message,
                sound: 'default',
                data,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
                channelId: this.CHANNELS.REMINDERS,
            },
        });

        return Boolean(identifier);
    }

    private async ensureInitialized(): Promise<boolean> {
        return this.initialized || await this.initialize();
    }

    async clearAllScheduledReminders(): Promise<void> {
        const scheduled = await this.getScheduledNotifications();
        await Promise.all(scheduled.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    }

    async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        return Notifications.getAllScheduledNotificationsAsync();
    }

    async cancelAllNotifications(): Promise<boolean> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            return true;
        } catch {
            return false;
        }
    }

    async cancelNotification(notificationId: string): Promise<boolean> {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            return true;
        } catch {
            return false;
        }
    }

    async sendImmediateNotification(title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
        try {
            await Notifications.scheduleNotificationAsync({
                content: { title, body, data: data ?? {}, sound: 'default' },
                trigger: null,
            });
            return true;
        } catch {
            return false;
        }
    }

    async sendReadingCompletionNotification(versesRead: number, dailyGoal: number, achievement?: string): Promise<boolean> {
        const message = achievement
            ? `Great job! You read ${versesRead} verses and unlocked: ${achievement}!`
            : `Excellent! You've read ${versesRead}/${dailyGoal} verses today.`;

        return this.sendImmediateNotification('Reading Complete!', message, {
            versesRead, dailyGoal, achievement, type: 'reading_complete'
        });
    }

    async sendStreakMilestoneNotification(streakDays: number): Promise<boolean> {
        return this.sendImmediateNotification(
            'Streak Milestone!',
            `Amazing! You've reached a ${streakDays}-day reading streak!`,
            { streakDays, type: 'streak_milestone' }
        );
    }

    openNotificationSettings(): void {
        // Platform-specific implementation would go here
        console.debug('Opening notification settings...');
    }
}

export const notificationService = new NotificationService();
