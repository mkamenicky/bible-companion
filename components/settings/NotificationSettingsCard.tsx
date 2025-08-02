
import React, { useMemo } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components';
import { useTranslation } from '@/hooks';
import type * as Notifications from 'expo-notifications';

interface NotificationSettingsCardProps {
    settings: {
        notifications: boolean;
        dailyReminder: boolean;
        streakReminder: boolean;
        goalReminder: boolean;
        achievementNotifications: boolean;
        reminderTime: string;
        streakReminderTime: string;
        goalReminderTime: string;
    };
    scheduledNotifications: Notifications.NotificationRequest[];
    notificationStatus: {
        initialized: boolean;
        loading: boolean;
        error: string | null;
        permissions: { granted: boolean } | null;
        scheduledCount: number;
        lastRefresh: Date | null;
    };
    onNotificationToggle: (value: boolean) => void;
    onDailyReminderToggle: (value: boolean) => void;
    onStreakReminderToggle: (value: boolean) => void;
    onGoalReminderToggle: (value: boolean) => void;
    onAchievementNotificationToggle: (value: boolean) => void;
    onTestNotification: () => void;
    onShowTimePicker: () => void;
    onShowStreakTimePicker: () => void;
    onShowGoalTimePicker: () => void;
    onCancelAllNotifications: () => void;
    styles: any;
    customColors: any;
}

interface NotificationConfig {
    key: keyof Pick<NotificationSettingsCardProps['settings'], 'dailyReminder' | 'streakReminder' | 'goalReminder' | 'achievementNotifications'>;
    icon: string;
    color: string;
    translationKey: string;
    description: string;
    hasTimeSelector?: boolean;
    timeField?: keyof Pick<NotificationSettingsCardProps['settings'], 'reminderTime' | 'streakReminderTime' | 'goalReminderTime'>;
    identifierPattern: string;
}

export default function NotificationSettingsCard({
                                                     settings,
                                                     scheduledNotifications,
                                                     notificationStatus,
                                                     onNotificationToggle,
                                                     onDailyReminderToggle,
                                                     onStreakReminderToggle,
                                                     onGoalReminderToggle,
                                                     onAchievementNotificationToggle,
                                                     onTestNotification,
                                                     onShowTimePicker,
                                                     onShowStreakTimePicker,
                                                     onShowGoalTimePicker,
                                                     onCancelAllNotifications,
                                                     styles,
                                                     customColors,
                                                 }: NotificationSettingsCardProps) {
    const t = useTranslation();

    const notificationConfigs: NotificationConfig[] = [
        {
            key: 'dailyReminder',
            icon: '📖',
            color: '#e3f2fd',
            translationKey: 'settings.dailyReminder',
            description: 'Get reminded to read Scripture daily',
            hasTimeSelector: true,
            timeField: 'reminderTime',
            identifierPattern: 'daily_bible_reading',
        },
        {
            key: 'streakReminder',
            icon: '🔥',
            color: '#fff3e0',
            translationKey: 'settings.streakReminder',
            description: 'Evening reminder to protect your streak',
            hasTimeSelector: true,
            timeField: 'streakReminderTime',
            identifierPattern: 'streak_reminder',
        },
        {
            key: 'goalReminder',
            icon: '🎯',
            color: '#e8f5e8',
            translationKey: 'settings.goalReminder',
            description: 'Evening check on your reading progress',
            hasTimeSelector: true,
            timeField: 'goalReminderTime',
            identifierPattern: 'goal_reminder',
        },
        {
            key: 'achievementNotifications',
            icon: '🏆',
            color: '#fff3e0',
            translationKey: 'settings.achievementNotifications',
            description: 'Celebrate reading milestones and streaks',
            identifierPattern: 'achievement',
        },
    ];

    const statusInfo = useMemo(() => {
        if (!notificationStatus.initialized) {
            return { status: 'Not initialized', color: '#f44336' };
        }
        if (notificationStatus.loading) {
            return { status: 'Loading...', color: '#ff9800' };
        }
        if (notificationStatus.error) {
            return { status: 'Error', color: '#f44336' };
        }
        if (!notificationStatus.permissions?.granted) {
            return { status: 'Permission denied', color: '#f44336' };
        }
        if (scheduledNotifications.length === 0) {
            return { status: 'No active reminders', color: '#757575' };
        }
        return { status: 'Active', color: '#4caf50' };
    }, [notificationStatus, scheduledNotifications.length]);

    const isNotificationActive = (identifierPattern: string): boolean => {
        return scheduledNotifications.some(n =>
            n.identifier?.includes(identifierPattern) ||
            n.content?.data?.type?.toString().includes(identifierPattern)
        );
    };

    const handleMasterToggle = (): void => {
        if (settings.notifications) {
            Alert.alert(
                'Turn Off Notifications?',
                'This will disable all Bible reading reminders.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Turn Off', style: 'destructive', onPress: () => onNotificationToggle(false) }
                ]
            );
        } else {
            onNotificationToggle(true);
        }
    };

    const handleIndividualToggle = (
        config: NotificationConfig,
        toggleFunction: (value: boolean) => void
    ): void => {
        if (!settings.notifications) {
            Alert.alert(
                'Enable Notifications First',
                'Please enable the main notifications setting first.',
                [{ text: 'OK' }]
            );
            return;
        }
        toggleFunction(!settings[config.key]);
    };

    const handleTestNotification = (): void => {
        if (!settings.notifications) {
            Alert.alert(
                'Enable Notifications First',
                'Please enable notifications to test them.',
                [{ text: 'OK' }]
            );
            return;
        }
        onTestNotification();
    };

    const formatTime = (time: string): string => {
        if (!time) return '08:00';
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return time;
        }
    };

    const renderNotificationItem = (config: NotificationConfig) => {
        const isEnabled = settings[config.key] && settings.notifications;
        const isActive = isNotificationActive(config.identifierPattern);
        const toggleFunction = {
            dailyReminder: onDailyReminderToggle,
            streakReminder: onStreakReminderToggle,
            goalReminder: onGoalReminderToggle,
            achievementNotifications: onAchievementNotificationToggle,
        }[config.key];

        return (
            <TouchableOpacity
                key={config.key}
                style={[styles.listItem, !settings.notifications && { opacity: 0.5 }]}
                onPress={() => handleIndividualToggle(config, toggleFunction)}
                disabled={!settings.notifications}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: isEnabled ? config.color : '#f5f5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>{config.icon}</Text>
                </View>

                <View style={styles.itemContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.itemTitle, { marginRight: 8 }]}>
                            {t(config.translationKey)}
                        </Text>
                        {isActive && (
                            <Text style={{ fontSize: 12, color: '#4caf50', fontWeight: '600' }}>
                                ● Active
                            </Text>
                        )}
                        {isEnabled && !isActive && config.key !== 'achievementNotifications' && (
                            <Text style={{ fontSize: 12, color: '#ff9800', fontWeight: '600' }}>
                                ● Scheduled
                            </Text>
                        )}
                        {isEnabled && config.key === 'achievementNotifications' && (
                            <Text style={{ fontSize: 12, color: '#4caf50', fontWeight: '600' }}>
                                ● Enabled
                            </Text>
                        )}
                    </View>
                    <Text style={styles.itemSubtitle}>
                        {config.hasTimeSelector && isEnabled && config.timeField
                            ? `${config.key === 'dailyReminder' ? 'Daily' : config.key === 'streakReminder' ? 'Streak' : 'Goal'} reminder at ${formatTime(settings[config.timeField])}`
                            : config.description
                        }
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {config.hasTimeSelector && isEnabled && config.timeField && (
                        <TouchableOpacity
                            style={[
                                styles.itemAction,
                                {
                                    backgroundColor: customColors.instagramBlue + '15',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    minWidth: 80,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: customColors.instagramBlue + '30',
                                }
                            ]}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={(e) => {
                                e.stopPropagation();
                                if (config.key === 'dailyReminder') {
                                    onShowTimePicker();
                                } else if (config.key === 'streakReminder') {
                                    onShowStreakTimePicker();
                                } else if (config.key === 'goalReminder') {
                                    onShowGoalTimePicker();
                                }
                            }}
                        >
                            <Text style={[
                                styles.actionText, 
                                { 
                                    color: customColors.instagramBlue,
                                    fontWeight: '600',
                                    fontSize: 13,
                                }
                            ]}>
                                ⏰ {settings[config.timeField] || '08:00'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <View style={[
                        styles.checkbox,
                        isEnabled && styles.checkboxChecked
                    ]}>
                        {isEnabled && (
                            <Text style={styles.checkboxIcon}>✓</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.card}>
            {/* Header Section */}
            <View style={styles.sectionHeader}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8
                }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sectionTitle}>
                            {t('settings.notifications.title')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.checkbox,
                            settings.notifications && styles.checkboxChecked,
                            { marginLeft: 16 }
                        ]}
                        onPress={handleMasterToggle}
                    >
                        {settings.notifications && (
                            <Text style={styles.checkboxIcon}>✓</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.sectionSubtitle}>
                    {settings.notifications
                        ? `${scheduledNotifications.length} active reminders • ${statusInfo.status}`
                        : 'Get reminders for your daily reading goals'
                    }
                </Text>
            </View>

            {/* Notification Items */}
            {notificationConfigs.map(renderNotificationItem)}
        </View>
    );
}
