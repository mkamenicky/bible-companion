// SettingsQuickStatusCard.tsx (Fixed - keeping side-by-side layout with rounded card)
import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {useTranslation} from '@/hooks';
import {ThemeService} from "@/services";
import {ThemeVariant} from "@/services/(services)/theme/ThemeService";

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
    const [themeVariant, setThemeVariant] = useState(ThemeService.getCurrentVariant());

    const getThemeIcon = (theme: ThemeVariant | string): string => {
        switch (theme) {
            case 'instagram':
                return '📸';
            case 'dark-modern':
                return '💜';
            case 'minimal':
                return '⚪'
            case 'default':
            default:
                return '🔄';
        }};

        useEffect(() => {
            return ThemeService.addThemeChangeListener((newVariant) => {
                setThemeVariant(newVariant);
            }); // Cleanup listener on unmount
        }, []);

        return (
            <View style={styles.card}>
                {/* Section header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('settings.quickStatus.title')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('settings.quickStatus.subtitle')}</Text>
                </View>

                {/* Quick status row - side by side */}
                <View style={styles.quickStatusRow}>
                    {/* Daily Goal */}
                    <View style={[styles.quickStatusItem, {marginTop: 12}]}>
                        <View style={[
                            styles.goalBadge,
                            {backgroundColor: customColors.instagramBlue}
                        ]}>
                            <Text style={[styles.goalBadgeText, {color: 'white'}]}>
                                {dailyVerseGoal}
                            </Text>
                        </View>
                        <Text
                            style={[styles.quickStatusLabel, {marginBottom: 12}]}>{t('settings.quickStatus.dailyGoal')}</Text>
                    </View>

                    <View style={styles.quickStatusDivider}/>

                    {/* Notifications */}
                    <View style={[styles.quickStatusItem, {marginTop: 12}]}>
                        <View style={[
                            styles.goalBadge,
                            {backgroundColor: notificationStatus.color}
                        ]}>
                            <Text style={[styles.goalBadgeText, {color: 'white'}]}>
                                {scheduledNotifications.length}
                            </Text>
                        </View>
                        <Text
                            style={[styles.quickStatusLabel, {marginBottom: 12}]}>{t('settings.quickStatus.notifications')}</Text>
                    </View>

                    <View style={styles.quickStatusDivider}/>

                    {/* Theme */}
                    <View style={styles.quickStatusItem}>
                        <View style={[
                            styles.themeBadge,
                            {
                                backgroundColor: customColors.surface,
                                borderWidth: 1,
                                borderColor: customColors.borderColor
                            }
                        ]}>
                            <Text style={[styles.goalBadgeText, {color: customColors.text, fontSize: 35, backgroundColor: 'transparent'}]}>
                                {getThemeIcon(themeVariant)}
                            </Text>
                        </View>
                        <Text style={styles.quickStatusLabel}>{t('settings.quickStatus.theme')}: {themeVariant}</Text>
                    </View>
                </View>
            </View>
        );
    }
