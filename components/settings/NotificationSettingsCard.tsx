// NotificationSettingsCard.tsx
import React, {useEffect} from 'react';
import {
    Card,
    List,
    Switch,
    Button,
    Divider,
    Surface,
    IconButton
} from 'react-native-paper';
import { View } from "react-native";
import { Text } from './TextProps';

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
        <View style={styles.settingsSection}>
            <Card.Title
                title="Notifications"
                titleStyle={styles.settingsSectionTitle}
                subtitle={`${notificationCounts.total} active reminders`}
                subtitleStyle={{ color: customColors.subtleGray, paddingHorizontal: 16 }}
                left={(props) => (
                    <Surface {...props} style={[styles.settingsItemIcon, { marginLeft: 16 }]} elevation={1}>
                        <List.Icon icon="bell-outline" color={notificationStatus.color} />
                    </Surface>
                )}
                right={(props) => (
                    <View style={{ flexDirection: 'row', marginRight: 16 }}>
                        <IconButton
                            {...props}
                            icon="test-tube"
                            mode="outlined"
                            size={20}
                            onPress={sendTestNotification}
                            disabled={!settings.notifications || !hasAnyNotificationsEnabled}
                        />
                    </View>
                )}
            />

            {/* Master Enable Notifications Toggle */}
            <View style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                    <List.Icon icon="toggle-switch-outline" />
                </View>
                <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Enable Notifications</Text>
                    <Text style={styles.settingsItemDescription}>
                        Allow the app to send you reminders and updates
                    </Text>
                </View>
                <Switch
                    value={settings.notifications}
                    onValueChange={onNotificationToggle}
                    color={customColors.accent}
                />
            </View>

            <Divider style={{ marginHorizontal: 16 }} />

            {/* Daily Reading Reminder */}
            <View style={[styles.settingsItem, !settings.notifications && { opacity: 0.5 }]}>
                <View style={styles.settingsItemIcon}>
                    <List.Icon
                        icon="clock-outline"
                        color={settings.notifications && settings.dailyReminder ? customColors.accent : customColors.subtleGray}
                    />
                </View>
                <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Daily Reading Reminder</Text>
                    <Text style={styles.settingsItemDescription}>
                        Get reminded to read your daily verses
                        {notificationCounts.daily > 0 && ` • ${notificationCounts.daily} scheduled`}
                    </Text>
                </View>
                <Switch
                    value={settings.dailyReminder && settings.notifications}
                    onValueChange={onDailyReminderToggle}
                    disabled={!settings.notifications}
                    color={customColors.accent}
                />
            </View>

            <Divider style={{ marginHorizontal: 16 }} />

            {/* Streak Reminder */}
            <View style={[styles.settingsItem, !settings.notifications && { opacity: 0.5 }]}>
                <View style={styles.settingsItemIcon}>
                    <List.Icon
                        icon="fire"
                        color={settings.notifications && settings.streakReminder ? customColors.accent : customColors.subtleGray}
                    />
                </View>
                <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Reading Streak Reminders</Text>
                    <Text style={styles.settingsItemDescription}>
                        Get motivated to maintain your reading streak
                        {notificationCounts.streak > 0 && ` • ${notificationCounts.streak} scheduled`}
                    </Text>
                </View>
                <Switch
                    value={settings.streakReminder && settings.notifications}
                    onValueChange={onStreakReminderToggle}
                    disabled={!settings.notifications}
                    color={customColors.accent}
                />
            </View>

            <Divider style={{ marginHorizontal: 16 }} />

            {/* Goal Progress Reminder */}
            <View style={[styles.settingsItem, !settings.notifications && { opacity: 0.5 }]}>
                <View style={styles.settingsItemIcon}>
                    <List.Icon
                        icon="target"
                        color={settings.notifications && settings.goalReminder ? customColors.accent : customColors.subtleGray}
                    />
                </View>
                <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Goal Progress Reminders</Text>
                    <Text style={styles.settingsItemDescription}>
                        Get notified about your daily reading progress
                        {notificationCounts.goal > 0 && ` • ${notificationCounts.goal} scheduled`}
                    </Text>
                </View>
                <Switch
                    value={settings.goalReminder && settings.notifications}
                    onValueChange={onGoalReminderToggle}
                    disabled={!settings.notifications}
                    color={customColors.accent}
                />
            </View>

            <Divider style={{ marginHorizontal: 16 }} />

            {/* Achievement Notifications */}
            <View style={[styles.settingsItem, !settings.notifications && { opacity: 0.5 }]}>
                <View style={styles.settingsItemIcon}>
                    <List.Icon
                        icon="trophy"
                        color={settings.notifications && settings.achievementNotifications ? customColors.accent : customColors.subtleGray}
                    />
                </View>
                <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Achievement Notifications</Text>
                    <Text style={styles.settingsItemDescription}>
                        Celebrate milestones and accomplishments
                        {notificationCounts.achievement > 0 && ` • ${notificationCounts.achievement} scheduled`}
                    </Text>
                </View>
                <Switch
                    value={settings.achievementNotifications && settings.notifications}
                    onValueChange={onAchievementNotificationToggle}
                    disabled={!settings.notifications}
                    color={customColors.accent}
                />
            </View>

            <Divider style={{ marginHorizontal: 16 }} />

            {/* Reminder Time Setting */}
            <View style={[
                styles.settingsItem,
                styles.settingsItemLast,
                (!settings.notifications || !settings.dailyReminder) && { opacity: 0.5 }
            ]}>
                <View style={styles.settingsItemIcon}>
                    <List.Icon
                        icon="alarm"
                        color={
                            settings.notifications && settings.dailyReminder
                                ? customColors.accent
                                : customColors.subtleGray
                        }
                    />
                </View>
                <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Daily Reminder Time</Text>
                    <Text style={styles.settingsItemDescription}>
                        {settings.notifications && settings.dailyReminder
                            ? `Daily reminder scheduled for ${settings.reminderTime}`
                            : 'Enable daily reminders to set a time'
                        }
                    </Text>
                </View>
                <Button
                    mode="outlined"
                    compact
                    onPress={onShowTimePicker}
                    disabled={!settings.notifications || !settings.dailyReminder}
                    buttonColor={customColors.surface}
                    textColor={customColors.accent}
                    style={{ marginLeft: 8 }}
                >
                    Change
                </Button>
            </View>

            {/* Cancel All Notifications Button - only show if there are scheduled notifications */}
            {notificationCounts.total > 0 && (
                <>
                    <Divider style={{ marginHorizontal: 16, marginTop: 8 }} />
                    <View style={[styles.settingsItem, { paddingVertical: 12 }]}>
                        <View style={styles.settingsItemIcon}>
                            <List.Icon
                                icon="bell-cancel"
                                color={customColors.subtleGray}
                            />
                        </View>
                        <View style={styles.settingsItemContent}>
                            <Text style={[styles.settingsItemTitle, { color: customColors.subtleGray }]}>
                                Cancel All Scheduled Notifications
                            </Text>
                            <Text style={styles.settingsItemDescription}>
                                Remove all {notificationCounts.total} scheduled notifications
                            </Text>
                        </View>
                        <Button
                            mode="outlined"
                            compact
                            onPress={onCancelAllNotifications}
                            buttonColor={customColors.surface}
                            textColor={customColors.error || '#ef4444'}
                            style={{ marginLeft: 8 }}
                        >
                            Cancel All
                        </Button>
                    </View>
                </>
            )}
        </View>
    );
}
