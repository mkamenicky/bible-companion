// useNotifications.ts
import { useCallback, useEffect, useState, useRef } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
    notificationService,
    NotificationSchedule,
    NotificationPermissionStatus
} from '@/services';

export interface NotificationState {
    initialized: boolean;
    loading: boolean;
    error: string | null;
    permissions: NotificationPermissionStatus | null;
    scheduledCount: number;
    lastRefresh: Date | null;
}

export interface NotificationAnalytics {
    totalSent: number;
    totalReceived: number;
    totalClicked: number;
    averageResponseTime: number;
    mostActiveHour: number;
}

export function useNotifications() {
    const appState = useRef(AppState.currentState);

    const [state, setState] = useState<NotificationState>({
        initialized: false,
        loading: true,
        error: null,
        permissions: null,
        scheduledCount: 0,
        lastRefresh: null,
    });

    const [scheduledNotifications, setScheduledNotifications] = useState<
        Notifications.NotificationRequest[]
    >([]);

    const [analytics, setAnalytics] = useState<NotificationAnalytics>({
        totalSent: 0,
        totalReceived: 0,
        totalClicked: 0,
        averageResponseTime: 0,
        mostActiveHour: 8,
    });

    // Update state helper
    const updateState = useCallback((updates: Partial<NotificationState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Initialize notifications
    const initializeNotifications = useCallback(async () => {
        try {
            updateState({ loading: true, error: null });

            const initialized = await notificationService.initialize();
            const permissions = await notificationService.getPermissionStatus();

            updateState({
                initialized,
                loading: false,
                permissions,
                error: initialized ? null : 'Failed to initialize notifications',
            });

            return initialized;
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
            updateState({
                initialized: false,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }, [updateState]);

    // Load scheduled notifications
    const loadScheduledNotifications = useCallback(async () => {
        try {
            const notifications = await notificationService.getScheduledNotifications();
            setScheduledNotifications(notifications);
            updateState({
                scheduledCount: notifications.length,
                lastRefresh: new Date(),
            });

            // Load analytics
            const notificationAnalytics = await notificationService.getNotificationAnalytics();
            // Update analytics state if you have additional data

        } catch (error) {
            console.error('Failed to load scheduled notifications:', error);
            updateState({ error: 'Failed to load notifications' });
        }
    }, [updateState]);

    // Update notification schedule based on external settings
    const updateNotificationSchedule = useCallback(async (
        settings: any,
        dailyVerseGoal: number
    ) => {
        if (!state.initialized || !settings) return;

        try {
            updateState({ loading: true });

            if (settings.notifications && settings.dailyReminder) {
                const dailyReminder = notificationService.getDailyReminderTemplate(dailyVerseGoal);
                dailyReminder.time = settings.reminderTime;
                dailyReminder.enabled = true;

                const success = await notificationService.scheduleDailyReminder(dailyReminder);
                if (!success) {
                    throw new Error('Failed to schedule daily reminder');
                }
            } else {
                // Cancel daily reminder if disabled
                await notificationService.cancelNotification('daily_bible_reading');
            }

            // Schedule smart reminders based on user behavior
            await notificationService.scheduleSmartReminders(
                {
                    dailyReminderEnabled: settings.notifications && settings.dailyReminder,
                    reminderTime: settings.reminderTime,
                    streakRemindersEnabled: settings.notifications,
                    goalRemindersEnabled: settings.notifications,
                },
                {
                    currentStreak: 0, // You would get this from your data
                    dailyGoal: dailyVerseGoal,
                    todayProgress: 0, // You would get this from your data
                }
            );

            await loadScheduledNotifications();
            updateState({ loading: false, error: null });
        } catch (error) {
            console.error('Failed to update notification schedule:', error);
            updateState({
                loading: false,
                error: 'Failed to update notifications'
            });
        }
    }, [state.initialized, loadScheduledNotifications, updateState]);

    // Handle notification response
    const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
        try {
            const data = response.notification.request.content.data;

            // Update analytics
            setAnalytics(prev => ({
                ...prev,
                totalClicked: prev.totalClicked + 1,
            }));

            // Handle different notification types
            switch (data?.type) {
                case 'daily_reminder':
                    console.log('User tapped daily reminder');
                    // Navigate to reading screen
                    break;
                case 'streak_reminder':
                    console.log('User tapped streak reminder');
                    // Show streak information
                    break;
                case 'achievement':
                    console.log('User tapped achievement notification');
                    // Show achievement details
                    break;
                case 'goal_reminder':
                    console.log('User tapped goal reminder');
                    // Navigate to progress screen
                    break;
                default:
                    console.log('User tapped notification:', data?.type);
            }
        } catch (error) {
            console.error('Error handling notification response:', error);
        }
    }, []);

    // Handle notification received
    const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
        try {
            console.log('Notification received:', notification.request.content.title);

            // Update analytics
            setAnalytics(prev => ({
                ...prev,
                totalReceived: prev.totalReceived + 1,
            }));

            // Handle notification based on app state
            if (appState.current === 'active') {
                // App is in foreground - maybe show in-app notification
                console.log('Received notification while app is active');
            }
        } catch (error) {
            console.error('Error handling received notification:', error);
        }
    }, []);

    // Open notification settings helper
    const openNotificationSettings = useCallback(async () => {
        try {
            await notificationService.openNotificationSettings();
        } catch (error) {
            console.error('Failed to open notification settings:', error);
        }
    }, []);

    // Send test notification
    const sendTestNotification = useCallback(async () => {
        try {
            if (!state.initialized) {
                Alert.alert('Error', 'Notifications not initialized');
                return;
            }

            if (!state.permissions?.granted) {
                Alert.alert(
                    'Permission Required',
                    'Please enable notifications in your device settings',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: openNotificationSettings }
                    ]
                );
                return;
            }

            const success = await notificationService.sendImmediateNotification(
                '🧪 Test Notification',
                'Your notifications are working perfectly! 🎉',
                { type: 'test', timestamp: Date.now() }
            );

            if (success) {
                setAnalytics(prev => ({ ...prev, totalSent: prev.totalSent + 1 }));
                Alert.alert('Test Sent', 'Check your notification tray');
            } else {
                Alert.alert('Error', 'Failed to send test notification');
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
            Alert.alert('Error', 'Failed to send test notification');
        }
    }, [state.initialized, state.permissions, openNotificationSettings]);

    // Send reading completion notification
    const sendReadingCompletionNotification = useCallback(async (
        versesRead: number,
        dailyVerseGoal: number,
        achievementUnlocked?: string
    ) => {
        try {
            if (!state.initialized || !state.permissions?.granted) return;

            const success = await notificationService.sendReadingCompletionNotification(
                versesRead,
                dailyVerseGoal,
                achievementUnlocked
            );

            if (success) {
                setAnalytics(prev => ({ ...prev, totalSent: prev.totalSent + 1 }));
            }
        } catch (error) {
            console.error('Failed to send completion notification:', error);
        }
    }, [state.initialized, state.permissions]);

    // Send streak notification
    const sendStreakNotification = useCallback(async (streakDays: number) => {
        try {
            if (!state.initialized || !state.permissions?.granted) return;

            const success = await notificationService.sendStreakMilestoneNotification(streakDays);

            if (success) {
                setAnalytics(prev => ({ ...prev, totalSent: prev.totalSent + 1 }));
            }
        } catch (error) {
            console.error('Failed to send streak notification:', error);
        }
    }, [state.initialized, state.permissions]);

    // Cancel all notifications with confirmation
    const cancelAllNotifications = useCallback(async () => {
        Alert.alert(
            'Cancel All Notifications',
            'Are you sure you want to cancel all scheduled notifications? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Cancel All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            updateState({ loading: true });
                            const success = await notificationService.cancelAllNotifications();

                            if (success) {
                                await loadScheduledNotifications();
                                Alert.alert('Success', 'All notifications have been cancelled');
                            } else {
                                Alert.alert('Error', 'Failed to cancel some notifications');
                            }
                        } catch (error) {
                            console.error('Failed to cancel all notifications:', error);
                            Alert.alert('Error', 'Failed to cancel notifications');
                        } finally {
                            updateState({ loading: false });
                        }
                    },
                },
            ]
        );
    }, [updateState, loadScheduledNotifications]);

    // Request permission with user-friendly flow
    const requestPermissions = useCallback(async () => {
        try {
            const currentStatus = await notificationService.getPermissionStatus();

            if (currentStatus.granted) {
                updateState({ permissions: currentStatus });
                return true;
            }

            if (!currentStatus.canAskAgain) {
                Alert.alert(
                    'Notifications Disabled',
                    'Notifications are disabled for this app. You can enable them in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: openNotificationSettings }
                    ]
                );
                return false;
            }

            Alert.alert(
                'Enable Notifications',
                'Get reminders for your daily Bible reading and celebrate your progress with achievement notifications.',
                [
                    { text: 'Not Now', style: 'cancel' },
                    {
                        text: 'Enable',
                        onPress: async () => {
                            const initialized = await initializeNotifications();
                            if (!initialized) {
                                // If initialization failed, offer to open settings
                                Alert.alert(
                                    'Permission Denied',
                                    'You can enable notifications manually in your device settings.',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Open Settings', onPress: openNotificationSettings }
                                    ]
                                );
                            }
                            return initialized;
                        }
                    }
                ]
            );

            return false;
        } catch (error) {
            console.error('Failed to request permissions:', error);
            return false;
        }
    }, [updateState, initializeNotifications, openNotificationSettings]);

    // Clear all notification badge counts
    const clearBadgeCount = useCallback(async () => {
        try {
            await notificationService.clearBadgeCount();
        } catch (error) {
            console.error('Failed to clear badge count:', error);
        }
    }, []);

    // Handle app state changes
    const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // App has come to the foreground
            loadScheduledNotifications();
            clearBadgeCount();
        }
        appState.current = nextAppState;
    }, [loadScheduledNotifications, clearBadgeCount]);

    // Initialize on mount
    useEffect(() => {
        initializeNotifications();

        // Set up app state listener
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [initializeNotifications, handleAppStateChange]);

    // Set up notification listeners
    useEffect(() => {
        if (!state.initialized) return;

        const responseSubscription = notificationService.addNotificationResponseListener(
            handleNotificationResponse
        );

        const receivedSubscription = notificationService.addNotificationReceivedListener(
            handleNotificationReceived
        );

        return () => {
            responseSubscription?.remove();
            receivedSubscription?.remove();
        };
    }, [state.initialized, handleNotificationResponse, handleNotificationReceived]);

    // Auto-refresh scheduled notifications periodically
    useEffect(() => {
        if (!state.initialized) return;

        const interval = setInterval(() => {
            loadScheduledNotifications();
        }, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, [state.initialized, loadScheduledNotifications]);

    return {
        // State
        ...state,
        scheduledNotifications,
        analytics,

        // Actions
        initializeNotifications,
        loadScheduledNotifications,
        updateNotificationSchedule,
        sendTestNotification,
        sendReadingCompletionNotification,
        sendStreakNotification,
        cancelAllNotifications,
        requestPermissions,
        clearBadgeCount,

        // Utilities
        isPermissionGranted: state.permissions?.granted ?? false,
        canRequestPermission: state.permissions?.canAskAgain ?? true,
        notificationCount: scheduledNotifications.length,
    };
}
