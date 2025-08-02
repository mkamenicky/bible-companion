import React, { useEffect, useState, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from '@/hooks';
import { ThemeService } from '@/services';
import type { ThemeVariant } from '@/services/(services)/theme/ThemeService';
import type * as Notifications from 'expo-notifications';

interface NotificationStatus {
    initialized: boolean;
    loading: boolean;
    error: string | null;
    permissions: { granted: boolean } | null;
    scheduledCount: number;
    lastRefresh: Date | null;
}

interface SettingsQuickStatusCardProps {
    dailyVerseGoal: number;
    scheduledNotifications: Notifications.NotificationRequest[];
    notificationStatus: NotificationStatus;
    styles: any;
    customColors: any;
}

interface StatusItem {
    icon: string;
    value: string | number;
    label: string;
    color: string;
    backgroundColor: string;
}

const SettingsQuickStatusCard: React.FC<SettingsQuickStatusCardProps> = ({
                                                                             dailyVerseGoal,
                                                                             scheduledNotifications,
                                                                             notificationStatus,
                                                                             styles,
                                                                             customColors,
                                                                         }) => {
    const t = useTranslation();
    const [themeVariant, setThemeVariant] = useState<ThemeVariant>(ThemeService.getCurrentVariant());

    // Theme icons mapping
    const getThemeIcon = (theme: ThemeVariant): string => {
        const iconMap: Record<ThemeVariant, string> = {
            rose: '📸',
            'dark-modern': '💜',
            minimal: '⚪',
            default: '🔄',
        };
        return iconMap[theme] || iconMap.default;
    };

    // Notification status calculation
    const notificationStatusInfo = useMemo(() => {
        if (!notificationStatus.initialized) {
            return { color: '#f44336', label: 'Not Setup' };
        }
        if (notificationStatus.loading) {
            return { color: '#ff9800', label: 'Loading' };
        }
        if (notificationStatus.error) {
            return { color: '#f44336', label: 'Error' };
        }
        if (!notificationStatus.permissions?.granted) {
            return { color: '#f44336', label: 'No Permission' };
        }
        if (scheduledNotifications.length === 0) {
            return { color: '#757575', label: 'Inactive' };
        }
        return { color: '#4caf50', label: 'Active' };
    }, [notificationStatus, scheduledNotifications.length]);

    // Status items configuration
    const statusItems = useMemo((): StatusItem[] => [
        {
            icon: '🎯',
            value: dailyVerseGoal,
            label: t('settings.quickStatus.dailyGoal'),
            color: 'white',
            backgroundColor: customColors.instagramBlue,
        },
        {
            icon: '🔔',
            value: scheduledNotifications.length,
            label: t('settings.quickStatus.notifications'),
            color: 'white',
            backgroundColor: notificationStatusInfo.color,
        },
        {
            icon: getThemeIcon(themeVariant),
            value: '',
            label: `${t('settings.quickStatus.theme')}: ${themeVariant}`,
            color: customColors.text,
            backgroundColor: customColors.surface,
        },
    ], [
        dailyVerseGoal,
        scheduledNotifications.length,
        themeVariant,
        customColors,
        notificationStatusInfo.color,
        t,
    ]);

    // Theme change listener
    useEffect(() => {
        const unsubscribe = ThemeService.addThemeChangeListener((newVariant: ThemeVariant) => {
            setThemeVariant(newVariant);
        });
        return unsubscribe;
    }, []);

    const renderStatusItem = (item: StatusItem, index: number) => {
        const isThemeItem = index === 2; // Theme item has different styling

        return (
            <React.Fragment key={index}>
                <View style={styles.quickStatusItem}>
                    <View style={[
                        isThemeItem ? styles.themeBadge : styles.goalBadge,
                        {
                            backgroundColor: item.backgroundColor,
                            ...(isThemeItem && {
                                borderWidth: 1,
                                borderColor: customColors.borderColor,
                            }),
                        }
                    ]}>
                        {isThemeItem ? (
                            <Text style={[
                                styles.goalBadgeText,
                                {
                                    color: item.color,
                                    fontSize: 35,
                                    backgroundColor: 'transparent',
                                }
                            ]}>
                                {item.icon}
                            </Text>
                        ) : (
                            <>
                                <Text style={[
                                    styles.goalBadgeText,
                                    { color: item.color, fontSize: 12, marginRight: 4 }
                                ]}>
                                    {item.icon}
                                </Text>
                                <Text style={[
                                    styles.goalBadgeText,
                                    { color: item.color }
                                ]}>
                                    {item.value}
                                </Text>
                            </>
                        )}
                    </View>
                    <Text style={[
                        styles.quickStatusLabel,
                        { marginTop: 8, textAlign: 'center' }
                    ]}>
                        {item.label}
                    </Text>
                </View>
                {index < statusItems.length - 1 && (
                    <View style={styles.quickStatusDivider} />
                )}
            </React.Fragment>
        );
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {t('settings.quickStatus.title')}
                </Text>
                <Text style={styles.sectionSubtitle}>
                    {t('settings.quickStatus.subtitle')}
                </Text>
            </View>

            {/* Status Items Row */}
            <View style={styles.quickStatusRow}>
                {statusItems.map(renderStatusItem)}
            </View>

            {/* Additional Status Details */}
            {notificationStatus.error && (
                <View style={[
                    styles.statusAlert,
                    {
                        backgroundColor: '#f44336' + '20',
                        borderColor: '#f44336',
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[
                        styles.statusAlertText,
                        { color: '#f44336', fontSize: 12 }
                    ]}>
                        ⚠️ Notification Error: {notificationStatus.error}
                    </Text>
                </View>
            )}

            {!notificationStatus.permissions?.granted && notificationStatus.initialized && (
                <View style={[
                    styles.statusAlert,
                    {
                        backgroundColor: '#ff9800' + '20',
                        borderColor: '#ff9800',
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[
                        styles.statusAlertText,
                        { color: '#ff9800', fontSize: 12 }
                    ]}>
                        📱 Enable notification permissions to receive reminders
                    </Text>
                </View>
            )}
        </View>
    );
};

export default SettingsQuickStatusCard;
