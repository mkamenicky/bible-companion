// NotificationSettingsCard.tsx
import React from 'react';
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
    sendTestNotification: () => void
    notificationStatus: { status: string; color: string };
    onNotificationToggle: (value: boolean) => void;
    onDailyReminderToggle: (value: boolean) => void;
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
                                                     onTestNotification,
                                                     onShowTimePicker,
                                                     onCancelAllNotifications,
                                                     styles,
                                                     customColors,
                                                 }: NotificationSettingsCardProps) {
    return (
        <View style={styles.settingsSection}>
            <Card.Title
                title="Notifications"
                titleStyle={styles.settingsSectionTitle}
                subtitle={`${scheduledNotifications.length} active reminders`}
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
                            disabled={!settings.notifications}
                        />
                    </View>
                )}
            />

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

            <View style={[styles.settingsItem, !settings.notifications && { opacity: 0.5 }]}>
                <View style={styles.settingsItemIcon}>
                    <List.Icon
                        icon="clock-outline"
                        color={settings.notifications ? customColors.accent : customColors.subtleGray}
                    />
                </View>
                <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Daily Reading Reminder</Text>
                    <Text style={styles.settingsItemDescription}>
                        Get reminded to read your daily verses
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
                    <Text style={styles.settingsItemTitle}>Reminder Time</Text>
                    <Text style={styles.settingsItemDescription}>
                        Daily reminder scheduled for {settings.reminderTime}
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
        </View>
    );
}
