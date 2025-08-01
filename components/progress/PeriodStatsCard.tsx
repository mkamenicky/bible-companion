// PeriodStatsCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from '@/hooks';
import {ThemeColors} from "@/services/(services)/theme/ThemeService";

interface Props {
    weeklyVersesRead: number;
    monthlyVersesRead: number;
    styles: any;
    customColors: ThemeColors;
}

export default function PeriodStatsCard({
                                            weeklyVersesRead,
                                            monthlyVersesRead,
                                            styles,
                                            customColors
                                        }: Props) {
    const t = useTranslation();

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('progress.readingActivity')}</Text>
                <Text style={styles.sectionSubtitle}>{t('progress.readingActivitySubtitle')}</Text>
            </View>

            {/* Period Stats Grid */}
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 20,
            }}>
                {/* This Week */}
                <View style={{flex: 1, marginRight: 8}}>
                    <View style={{
                        backgroundColor: customColors.lightGray,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 13,
                            color: customColors.subtleGray,
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            {t('progress.thisWeek')}
                        </Text>

                        <Text style={{
                            fontSize: 24,
                            fontWeight: '700',
                            color: customColors.text,
                            marginBottom: 4,
                        }}>
                            {weeklyVersesRead}
                        </Text>

                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray,
                            textAlign: 'center',
                        }}>
                            {t('progress.versesRead')}
                        </Text>

                        {/* Weekly Progress Bar */}
                        <View style={{
                            width: '100%',
                            marginTop: 12,
                        }}>
                            <View style={[styles.progressBar, {height: 4}]}>
                                <View style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min(weeklyVersesRead / 50 * 100, 100)}%`,
                                        height: 4,
                                    }
                                ]} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* This Month */}
                <View style={{flex: 1, marginLeft: 8}}>
                    <View style={{
                        backgroundColor: customColors.lightGray,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 13,
                            color: customColors.subtleGray,
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            {t('progress.thisMonth')}
                        </Text>

                        <Text style={{
                            fontSize: 24,
                            fontWeight: '700',
                            color: customColors.text,
                            marginBottom: 4,
                        }}>
                            {monthlyVersesRead}
                        </Text>

                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray,
                            textAlign: 'center',
                        }}>
                            {t('progress.versesRead')}
                        </Text>

                        {/* Monthly Progress Bar */}
                        <View style={{
                            width: '100%',
                            marginTop: 12,
                        }}>
                            <View style={[styles.progressBar, {height: 4}]}>
                                <View style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min(monthlyVersesRead / 200 * 100, 100)}%`,
                                        height: 4,
                                    }
                                ]} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}
