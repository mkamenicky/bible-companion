// NotificationSettingsCard.tsx (Fixed with rounded corners)
import React, {useEffect} from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './TextProps';
import { useTranslation } from '@/hooks';

interface NotificationSettingsCardProps {
    settings: any;
    scheduledNotifications: any[];
    sendTestNotification: () => void;
    notificationStatus: { status: string; color: string };
    onNotificationToggle: (value: boolean) => void;
    onDailyReminderToggle: (value: boolean) => void;
    onStreakReminderToggle: (value: boolean) => void;
    onGoalReminderToggle: (value: boolean) => void;
    onAchievementNotificationToggle: (value: boolean) => void;
    onTestNotification: () => void;
    onShowTimePicker: () => void;
    onCancelAllNotifications: () => void;
    styles: any;
    customColors: any;
}

export default function NotificationSettingsCard({
                                                     settings,
                                                     scheduledNotifications,
                                                     sendTestNotification,
                                                     notificationStatus,
                                                     onNotificationToggle,
                                                     onDailyReminderToggle,
                                                     onStreakReminderToggle,
                                                     onGoalReminderToggle,
                                                     onAchievementNotificationToggle,
                                                     onTestNotification,
                                                     onShowTimePicker,
                                                     onCancelAllNotifications,
                                                     styles,
                                                     customColors,
                                                 }: NotificationSettingsCardProps) {
    const t = useTranslation();

    useEffect(() => {
        if (scheduledNotifications.length > 0) {
            console.log('✅ Active notifications:', scheduledNotifications.map(n => ({
                id: n.identifier,
                title: n.content.title,
                trigger: n.trigger
            })));
        } else {
            console.log('❌ No notifications scheduled');
        }
    }, [scheduledNotifications]);

    // Calculate notification counts by type
    const notificationCounts = React.useMemo(() => {
        const counts = {
            daily: 0,
            streak: 0,
            goal: 0,
            achievement: 0,
            total: scheduledNotifications.length
        };

        scheduledNotifications.forEach(notification => {
            const type = notification.content?.data?.type;
            switch (type) {
                case 'daily_reminder':
                    counts.daily++;
                    break;
                case 'streak_reminder':
                    counts.streak++;
                    break;
                case 'goal_reminder':
                    counts.goal++;
                    break;
                case 'achievement':
                    counts.achievement++;
                    break;
            }
        });

        return counts;
    }, [scheduledNotifications]);

    // Check if any notifications are enabled
    const hasAnyNotificationsEnabled = settings?.notifications && (
        settings?.dailyReminder ||
        settings?.streakReminder ||
        settings?.goalReminder ||
        settings?.achievementNotifications
    );

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('settings.notifications.title')}</Text>
                <Text style={styles.sectionSubtitle}>
                    {t('settings.notifications.activeReminders', { count: notificationCounts.total })}
                </Text>
            </View>

            {/* Master Enable Notifications Toggle */}
            <TouchableOpacity
                style={styles.listItem}
                onPress={() => onNotificationToggle(!settings.notifications)}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: settings.notifications ? '#e8f5e8' : '#ffebee' }
                ]}>
                    <Text style={{ fontSize: 18 }}>
                        {settings.notifications ? '🔔' : '🔕'}
                    </Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.notifications.enable')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.notifications.enableDescription')}
                    </Text>
                </View>

                <View style={[
                    styles.checkbox,
                    settings.notifications && styles.checkboxChecked
                ]}>
                    {settings.notifications && (
                        <Text style={styles.checkboxIcon}>✓</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Daily Reading Reminder */}
            <TouchableOpacity
                style={[styles.listItem, !settings.notifications && { opacity: 0.5 }]}
                onPress={() => settings.notifications && onDailyReminderToggle(!settings.dailyReminder)}
                disabled={!settings.notifications}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: settings.notifications && settings.dailyReminder ? '#e3f2fd' : '#f5f5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🕐</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.dailyReminder')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.notifications.dailyDescription')}
                        {notificationCounts.daily > 0 && ` • ${t('settings.notifications.scheduled', { count: notificationCounts.daily })}`}
                    </Text>
                </View>

                <View style={[
                    styles.checkbox,
                    settings.dailyReminder && settings.notifications && styles.checkboxChecked
                ]}>
                    {settings.dailyReminder && settings.notifications && (
                        <Text style={styles.checkboxIcon}>✓</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Streak Reminder */}
            <TouchableOpacity
                style={[styles.listItem, !settings.notifications && { opacity: 0.5 }]}
                onPress={() => settings.notifications && onStreakReminderToggle(!settings.streakReminder)}
                disabled={!settings.notifications}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: settings.notifications && settings.streakReminder ? '#fff3e0' : '#f5f5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🔥</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.streakReminder')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.notifications.streakDescription')}
                        {notificationCounts.streak > 0 && ` • ${t('settings.notifications.scheduled', { count: notificationCounts.streak })}`}
                    </Text>
                </View>

                <View style={[
                    styles.checkbox,
                    settings.streakReminder && settings.notifications && styles.checkboxChecked
                ]}>
                    {settings.streakReminder && settings.notifications && (
                        <Text style={styles.checkboxIcon}>✓</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Goal Progress Reminder */}
            <TouchableOpacity
                style={[styles.listItem, !settings.notifications && { opacity: 0.5 }]}
                onPress={() => settings.notifications && onGoalReminderToggle(!settings.goalReminder)}
                disabled={!settings.notifications}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: settings.notifications && settings.goalReminder ? '#e8f5e8' : '#f5f5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🎯</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.goalReminder')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.notifications.goalDescription')}
                        {notificationCounts.goal > 0 && ` • ${t('settings.notifications.scheduled', { count: notificationCounts.goal })}`}
                    </Text>
                </View>

                <View style={[
                    styles.checkbox,
                    settings.goalReminder && settings.notifications && styles.checkboxChecked
                ]}>
                    {settings.goalReminder && settings.notifications && (
                        <Text style={styles.checkboxIcon}>✓</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Achievement Notifications */}
            <TouchableOpacity
                style={[styles.listItem, !settings.notifications && { opacity: 0.5 }]}
                onPress={() => settings.notifications && onAchievementNotificationToggle(!settings.achievementNotifications)}
                disabled={!settings.notifications}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: settings.notifications && settings.achievementNotifications ? '#fff3e0' : '#f5f5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🏆</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.achievementNotifications')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.notifications.achievementDescription')}
                        {notificationCounts.achievement > 0 && ` • ${t('settings.notifications.scheduled', { count: notificationCounts.achievement })}`}
                    </Text>
                </View>

                <View style={[
                    styles.checkbox,
                    settings.achievementNotifications && settings.notifications && styles.checkboxChecked
                ]}>
                    {settings.achievementNotifications && settings.notifications && (
                        <Text style={styles.checkboxIcon}>✓</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Reminder Time Setting */}
            <TouchableOpacity
                style={[styles.listItem, (!settings.notifications || !settings.dailyReminder) && { opacity: 0.5 }]}
                onPress={() => settings.notifications && settings.dailyReminder && onShowTimePicker()}
                disabled={!settings.notifications || !settings.dailyReminder}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: settings.notifications && settings.dailyReminder ? '#e3f2fd' : '#f5f5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>⏰</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.notifications.reminderTime')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {settings.notifications && settings.dailyReminder
                            ? t('settings.notifications.reminderTimeSet', { time: settings.reminderTime })
                            : t('settings.notifications.reminderTimeDisabled')
                        }
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[
                        styles.actionText,
                        { color: settings.notifications && settings.dailyReminder ? customColors.instagramBlue : customColors.subtleGray }
                    ]}>
                        {t('settings.change')}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Test Notification */}
            <TouchableOpacity
                style={[styles.listItem, (!settings.notifications || !hasAnyNotificationsEnabled) && { opacity: 0.5 }]}
                onPress={() => hasAnyNotificationsEnabled && sendTestNotification()}
                disabled={!settings.notifications || !hasAnyNotificationsEnabled}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: hasAnyNotificationsEnabled ? '#e8f5e8' : '#f5f5f5' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🧪</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.notifications.testNotification')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.notifications.testNotificationDescription')}
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[
                        styles.actionText,
                        { color: hasAnyNotificationsEnabled ? customColors.instagramBlue : customColors.subtleGray }
                    ]}>
                        {t('settings.notifications.test')}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Cancel All Notifications - only show if there are scheduled notifications */}
            {notificationCounts.total > 0 && (
                <TouchableOpacity
                    style={[styles.listItem, styles.listItemLast]}
                    onPress={onCancelAllNotifications}
                >
                    <View style={[
                        styles.itemIcon,
                        { backgroundColor: '#ffebee' }
                    ]}>
                        <Text style={{ fontSize: 18 }}>🚫</Text>
                    </View>

                    <View style={styles.itemContent}>
                        <Text style={[styles.itemTitle, { color: customColors.error || '#ef4444' }]}>
                            {t('settings.notifications.cancelAll')}
                        </Text>
                        <Text style={styles.itemSubtitle}>
                            {t('settings.notifications.cancelAllDescription', { count: notificationCounts.total })}
                        </Text>
                    </View>

                    <View style={styles.itemAction}>
                        <Text style={[styles.actionText, { color: customColors.error || '#ef4444' }]}>
                            {t('settings.notifications.cancelAllButton')}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Status info */}
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{t('settings.notifications.status')}</Text>
                    <Text style={[styles.progressValue, { color: notificationStatus.color }]}>
                        {notificationStatus.status}
                    </Text>
                </View>
            </View>
        </View>
    );
}
