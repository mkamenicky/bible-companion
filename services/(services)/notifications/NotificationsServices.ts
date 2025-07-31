// NotificationService.ts - Fixed Implementation
import * as Notifications from 'expo-notifications';
import {PermissionStatus} from 'expo-notifications';
import {Platform} from 'react-native';

// Configure notification behavior
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
    time: string; // Format: "HH:MM"
    enabled: boolean;
    type?: 'daily_reminder' | 'streak_reminder' | 'goal_reminder';
    metadata?: Record<string, any>;
}

export interface NotificationPermissionStatus {
    granted: boolean;
    canAskAgain: boolean;
    status: Notifications.PermissionStatus;
}

export class NotificationService {
    private initialized = false;
    private permissionStatus: NotificationPermissionStatus | null = null;

    // Notification channels for Android
    private readonly CHANNELS = {
        REMINDERS: 'bible-reading-reminders',
        ACHIEVEMENTS: 'bible-reading-achievements',
        GENERAL: 'bible-reading-general',
    };

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
        } catch (error) {
            console.error('Failed to get permission status:', error);
            return { granted: false, canAskAgain: true, status: PermissionStatus.UNDETERMINED };
        }
    }

    async scheduleDailyReminder(schedule: NotificationSchedule): Promise<boolean> {
        if (!this.initialized) {
            const initialized = await this.initialize();
            if (!initialized) return false;
        }

        if (!schedule.enabled) {
            await this.cancelNotification(schedule.id);
            return true;
        }

        try {
            // Cancel existing notification first
            await this.cancelNotification(schedule.id);

            const [hours, minutes] = schedule.time.split(':').map(Number);

            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                throw new Error('Invalid time format');
            }

            // Use DAILY trigger type for repeating daily notifications
            const identifier = await Notifications.scheduleNotificationAsync({
                identifier: schedule.id,
                content: {
                    title: schedule.title,
                    body: schedule.message,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: {
                        type: schedule.type || 'daily_reminder',
                        id: schedule.id,
                        scheduledTime: schedule.time,
                        ...schedule.metadata,
                    },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: hours,
                    minute: minutes,
                    channelId: this.CHANNELS.REMINDERS,
                },
            });

            console.log(`✅ Scheduled daily notification: ${identifier} at ${schedule.time}`);
            return true;
        } catch (error) {
            console.error('Failed to schedule notification:', error);
            return false;
        }
    }

    async cancelNotification(notificationId: string): Promise<boolean> {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            console.log(`🗑️ Cancelled notification: ${notificationId}`);
            return true;
        } catch (error) {
            console.error('Failed to cancel notification:', error);
            return false;
        }
    }

    async cancelAllNotifications(): Promise<boolean> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log('🗑️ Cancelled all notifications');
            return true;
        } catch (error) {
            console.error('Failed to cancel all notifications:', error);
            return false;
        }
    }

    async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        try {
            return await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Failed to get scheduled notifications:', error);
            return [];
        }
    }

    // Fixed scheduleSmartReminders method
    async scheduleSmartReminders(
        settings: {
            notifications: boolean; // Master toggle
            dailyReminder: boolean;
            streakReminder: boolean;
            goalReminder: boolean;
            achievementNotifications: boolean;
            reminderTime: string;
        },
        userdata: {
            currentStreak: number;
            dailyGoal: number;
            todayProgress: number;
        }
    ): Promise<void> {
        try {
            // If master notifications are disabled, cancel all
            if (!settings.notifications) {
                await this.cancelAllNotifications();
                console.log('🔕 All notifications disabled - cancelled all scheduled notifications');
                return;
            }

            // Cancel all existing reminders first to avoid duplicates
            await this.cancelNotification('daily_bible_reading');
            await this.cancelNotification('streak_reminder');
            await this.cancelNotification('goal_reminder');

            let scheduledCount = 0;

            // Schedule daily reminder if enabled
            if (settings.dailyReminder) {
                const dailyReminder = this.getDailyReminderTemplate(userdata.dailyGoal);
                dailyReminder.time = settings.reminderTime;
                dailyReminder.enabled = true;

                const success = await this.scheduleDailyReminder(dailyReminder);
                if (success) {
                    scheduledCount++;
                    console.log('✅ Daily reminder scheduled for', settings.reminderTime);
                }
            }

            // Schedule streak reminder if enabled (evening reminder)
            if (settings.streakReminder) {
                const streakReminder = this.getStreakReminderTemplate(userdata.currentStreak);
                streakReminder.time = '20:00'; // 8 PM
                streakReminder.enabled = true;

                const success = await this.scheduleDailyReminder(streakReminder);
                if (success) {
                    scheduledCount++;
                    console.log('✅ Streak reminder scheduled for 20:00');
                }
            }

            // Schedule goal progress reminder if enabled and user hasn't completed today's goal
            if (settings.goalReminder && userdata.todayProgress < userdata.dailyGoal) {
                const goalReminder = this.getGoalReminderTemplate(userdata.todayProgress, userdata.dailyGoal);
                goalReminder.time = '18:00'; // 6 PM
                goalReminder.enabled = true;

                const success = await this.scheduleDailyReminder(goalReminder);
                if (success) {
                    scheduledCount++;
                    console.log('✅ Goal reminder scheduled for 18:00');
                }
            }

            // Achievement notifications are sent immediately when earned
            if (settings.achievementNotifications) {
                console.log('✅ Achievement notifications enabled - will be sent when earned');
            }

            console.log(`📅 Smart reminders configured: ${scheduledCount} notifications scheduled`);
        } catch (error) {
            console.error('Failed to schedule smart reminders:', error);
        }
    }

    // Template methods remain the same but with proper typing
    getDailyReminderTemplate(versesGoal: number = 10): NotificationSchedule {
        const messages = [
            `📖 Dive into your Bible reading! Goal: ${versesGoal} verses`,
            `🌟 Your daily dose of Scripture is ready. Target: ${versesGoal} verses`,
            `✨ Embrace today's wisdom. Read ${versesGoal} verses`,
            `🙏 Let the Word guide you. Goal: ${versesGoal} verses`,
            `📚 Your Bible reading awaits. Aim for ${versesGoal} verses`,
        ];

        return {
            id: 'daily_bible_reading',
            title: '📖 Daily Bible Reading',
            message: messages[Math.floor(Math.random() * messages.length)],
            time: '08:00',
            enabled: true,
            type: 'daily_reminder',
            metadata: { versesGoal },
        };
    }

    getStreakReminderTemplate(currentStreak: number): NotificationSchedule {
        const getStreakMessage = (streak: number) => {
            if (streak === 0) return "Start your reading journey today!";
            if (streak < 7) return `🔥 ${streak} day streak! Keep it going!`;
            if (streak < 30) return `🔥 Amazing ${streak} day streak! You're building a habit!`;
            if (streak < 100) return `🏆 Incredible ${streak} day streak! You're dedicated!`;
            return `💎 Legendary ${streak} day streak! You're an inspiration!`;
        };

        return {
            id: 'streak_reminder',
            title: currentStreak > 0 ? `🔥 ${currentStreak} Day Streak!` : '🌟 Start Your Streak',
            message: getStreakMessage(currentStreak),
            time: '20:00',
            enabled: true,
            type: 'streak_reminder',
            metadata: { currentStreak },
        };
    }

    getGoalReminderTemplate(progress: number, goal: number): NotificationSchedule {
        const percentage = Math.round((progress / goal) * 100);
        let message: string;
        let title: string;

        if (percentage === 0) {
            title = '🎯 Reading Goal Reminder';
            message = `You haven't started today's reading yet. Goal: ${goal} verses`;
        } else if (percentage < 50) {
            title = '📈 Keep Going!';
            message = `You're ${percentage}% towards your goal. ${goal - progress} verses to go!`;
        } else if (percentage < 100) {
            title = '🚀 Almost There!';
            message = `${percentage}% complete! Just ${goal - progress} more verses to reach your goal!`;
        } else {
            title = '🎉 Goal Achieved!';
            message = `Congratulations! You've read ${progress} verses today!`;
        }

        return {
            id: 'goal_reminder',
            title,
            message,
            time: '18:00',
            enabled: true,
            type: 'goal_reminder',
            metadata: { progress, goal, percentage },
        };
    }

    // Send immediate notifications
    async sendImmediateNotification(title: string, message: string, data?: any): Promise<boolean> {
        if (!this.initialized) {
            const initialized = await this.initialize();
            if (!initialized) return false;
        }

        try {
            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body: message,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: { type: 'immediate', timestamp: Date.now(), ...data },
                },
                trigger: null, // Send immediately
            });

            console.log(`📤 Sent immediate notification: ${identifier}`);
            return true;
        } catch (error) {
            console.error('Failed to send immediate notification:', error);
            return false;
        }
    }

    async sendAchievementNotification(achievement: string, description: string, data?: any): Promise<boolean> {
        return this.sendImmediateNotification(
            `🏆 Achievement Unlocked!`,
            `${achievement}: ${description}`,
            { type: 'achievement', achievement, ...data }
        );
    }

    async sendStreakMilestoneNotification(streakDays: number): Promise<boolean> {
        const milestones = {
            7: { emoji: '🎉', message: 'One week strong! You\'re building a great habit!' },
            30: { emoji: '🏆', message: '30 days! You\'re truly dedicated to God\'s word!' },
            50: { emoji: '⭐', message: '50 days! Your consistency is inspiring!' },
            100: { emoji: '💎', message: '100 days! You\'re a Bible reading champion!' },
            365: { emoji: '👑', message: 'One full year! You\'re a scripture scholar!' },
        };

        const milestone = milestones[streakDays as keyof typeof milestones];
        if (!milestone) return false;

        return this.sendAchievementNotification(
            `${milestone.emoji} ${streakDays} Day Streak!`,
            milestone.message,
            { type: 'streak_milestone', streakDays }
        );
    }

    async sendReadingCompletionNotification(
        versesRead: number,
        goal: number,
        achievementUnlocked?: string
    ): Promise<boolean> {
        const isGoalMet = versesRead >= goal;
        const title = isGoalMet ? '🎉 Daily Goal Complete!' : '📖 Great Progress!';

        let message = `You've read ${versesRead} verses today`;
        if (isGoalMet) {
            message += ` and reached your goal of ${goal}! 🎯`;
        } else {
            message += `. ${goal - versesRead} more to reach your goal.`;
        }

        if (achievementUnlocked) {
            message += ` 🏆 Achievement: ${achievementUnlocked}!`;
        }

        return this.sendImmediateNotification(title, message, {
            type: 'reading_complete',
            versesRead,
            goal,
            goalMet: isGoalMet,
            achievement: achievementUnlocked
        });
    }

    // Event listeners
    addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
        return Notifications.addNotificationResponseReceivedListener(listener);
    }

    addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
        return Notifications.addNotificationReceivedListener(listener);
    }

    async clearBadgeCount(): Promise<void> {
        try {
            await Notifications.setBadgeCountAsync(0);
        } catch (error) {
            console.error('Failed to clear badge count:', error);
        }
    }

    async openNotificationSettings(): Promise<void> {
        try {
            if (Platform.OS === 'ios') {
                const { Linking } = require('react-native');
                await Linking.openURL('app-settings:');
            } else {
                const IntentLauncher = require('expo-intent-launcher');
                await IntentLauncher.startActivityAsync(
                    IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
                    { data: 'package:com.yourapp.package' }
                );
            }
        } catch (error) {
            console.error('Failed to open notification settings:', error);
        }
    }

    // Get notification analytics
    async getNotificationAnalytics(): Promise<{
        scheduled: number;
        channels: string[];
        permissions: NotificationPermissionStatus;
        lastNotificationTime?: string;
    }> {
        const scheduled = await this.getScheduledNotifications();
        const permissions = await this.getPermissionStatus();

        return {
            scheduled: scheduled.length,
            channels: Object.values(this.CHANNELS),
            permissions,
        };
    }

    private async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus, canAskAgain, granted } = await Notifications.getPermissionsAsync();

            this.permissionStatus = { granted, canAskAgain, status: existingStatus };

            if (existingStatus !== 'granted') {
                if (!canAskAgain) {
                    console.warn('Cannot request notification permissions - user previously denied');
                    return false;
                }

                const { status, canAskAgain: newCanAskAgain, granted: newGranted } =
                    await Notifications.requestPermissionsAsync({
                        ios: {
                            allowAlert: true,
                            allowBadge: true,
                            allowSound: true,
                            allowProvisional: false,
                        },
                    });

                this.permissionStatus = { granted: newGranted, canAskAgain: newCanAskAgain, status };
                return status === 'granted';
            }

            return true;
        } catch (error) {
            console.error('Permission request failed:', error);
            return false;
        }
    }

    private async setupNotificationChannels(): Promise<void> {
        if (Platform.OS !== 'android') return;

        try {
            // Reminders channel
            await Notifications.setNotificationChannelAsync(this.CHANNELS.REMINDERS, {
                name: 'Daily Reading Reminders',
                description: 'Notifications to remind you of your daily Bible reading',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4F46E5',
                sound: 'default',
                enableLights: true,
                enableVibrate: true,
            });

            // Achievements channel
            await Notifications.setNotificationChannelAsync(this.CHANNELS.ACHIEVEMENTS, {
                name: 'Reading Achievements',
                description: 'Celebrate your reading milestones and streaks',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 150, 150, 150],
                lightColor: '#10B981',
                sound: 'default',
                enableLights: true,
                enableVibrate: true,
            });

            // General channel
            await Notifications.setNotificationChannelAsync(this.CHANNELS.GENERAL, {
                name: 'General Notifications',
                description: 'App updates and general information',
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: 'default',
            });
        } catch (error) {
            console.error('Failed to setup notification channels:', error);
        }
    }
}

// Singleton instance
export const notificationService = new NotificationService();
