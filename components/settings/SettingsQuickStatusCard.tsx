// SettingsQuickStatusCard.tsx
import React from 'react';
import { View } from 'react-native';
import { Badge, Chip } from 'react-native-paper';
import { Text } from './TextProps';
import { useTranslation } from '@/hooks';

interface SettingsQuickStatusCardProps {
    dailyVerseGoal: number;
    scheduledNotifications: any[];
    notificationStatus: { status: string; color: string };
    styles: any;
    customColors: any;
}

export default function SettingsQuickStatusCard({
                                                    dailyVerseGoal,
                                                    scheduledNotifications,
                                                    notificationStatus,
                                                    styles,
                                                    customColors,
                                                }: SettingsQuickStatusCardProps) {
    const t = useTranslation();

    return (
        <View style={styles.quickStatusCard}>
            <View style={styles.quickStatusRow}>
                <View style={styles.quickStatusItem}>
                    <Text style={styles.quickStatusValue}>{dailyVerseGoal}</Text>
                    <Text style={styles.quickStatusLabel}>{t('settings.quickStatus.dailyGoal')}</Text>
                </View>

                <View style={styles.quickStatusDivider} />

                <View style={styles.quickStatusItem}>
                    <Badge
                        size={24}
                        style={{ backgroundColor: notificationStatus.color }}
                    >
                        {scheduledNotifications.length}
                    </Badge>
                    <Text style={[styles.quickStatusLabel, { marginTop: 4 }]}>
                        {t('settings.quickStatus.notifications')}
                    </Text>
                </View>

                <View style={styles.quickStatusDivider} />

                <View style={styles.quickStatusItem}>
                    <Chip
                        icon="palette"
                        compact
                        textStyle={{ fontSize: 10 }}
                        style={styles.chip}
                    >
                        {t('settings.quickStatus.theme')}
                    </Chip>
                </View>
            </View>
        </View>
    );
}
