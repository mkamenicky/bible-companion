// StreakCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from '@/hooks';
import {ThemeColors} from "@/services/(services)/theme/ThemeService";

interface Props {
    currentStreak: number;
    longestStreak: number;
    totalReadingDays: number;
    styles: any;
    customColors: ThemeColors;
}

export default function StreakCard({
                                       currentStreak,
                                       longestStreak,
                                       totalReadingDays,
                                       styles,
                                       customColors
                                   }: Props) {
    const t = useTranslation();

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('progress.readingStreak')}</Text>
                <Text style={styles.sectionSubtitle}>{t('progress.readingStreakSubtitle')}</Text>
            </View>

            {/* Current Streak Display */}
            <View style={{
                alignItems: 'center',
                paddingVertical: 24,
                borderBottomWidth: 0.5,
                borderBottomColor: customColors.borderColor,
            }}>
                <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: customColors.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: '700',
                        color: '#ffffff',
                    }}>
                        🔥
                    </Text>
                </View>

                <Text style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: customColors.text,
                    marginBottom: 4,
                }}>
                    {currentStreak}
                </Text>

                <Text style={{
                    fontSize: 16,
                    color: customColors.subtleGray,
                    textAlign: 'center',
                }}>
                    {t('progress.dayStreak', {
                        count: currentStreak,
                        days: currentStreak === 1 ? t('common.day') : t('common.days')
                    })}
                </Text>
            </View>

            {/* Streak Stats */}
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                paddingVertical: 16,
            }}>
                <View style={{flex: 1, alignItems: 'center'}}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: customColors.text,
                        marginBottom: 4,
                    }}>
                        {longestStreak}
                    </Text>
                    <Text style={{
                        fontSize: 13,
                        color: customColors.subtleGray,
                        textAlign: 'center',
                    }}>
                        {t('progress.longestStreak')}
                    </Text>
                </View>

                <View style={{
                    width: 0.5,
                    backgroundColor: customColors.borderColor,
                    marginHorizontal: 16,
                }} />

                <View style={{flex: 1, alignItems: 'center'}}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: customColors.text,
                        marginBottom: 4,
                    }}>
                        {totalReadingDays}
                    </Text>
                    <Text style={{
                        fontSize: 13,
                        color: customColors.subtleGray,
                        textAlign: 'center',
                    }}>
                        {t('progress.totalReadingDays')}
                    </Text>
                </View>
            </View>
        </View>
    );
}
