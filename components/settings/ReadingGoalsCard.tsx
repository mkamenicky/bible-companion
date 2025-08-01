// ReadingGoalsCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/hooks';

interface ReadingGoalsCardProps {
    dailyVerseGoal: number;
    onEditGoal: () => void;
    styles: any;
    customColors: any;
}

export default function ReadingGoalsCard({
                                             dailyVerseGoal,
                                             onEditGoal,
                                             styles,
                                             customColors,
                                         }: ReadingGoalsCardProps) {
    const t = useTranslation();

    // Calculate some motivational stats
    const weeklyGoal = dailyVerseGoal * 7;
    const monthlyGoal = dailyVerseGoal * 30;

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('settings.readingGoals')}</Text>
                <Text style={styles.sectionSubtitle}>{t('settings.readingGoalsSubtitle')}</Text>
            </View>

            {/* Daily goal setting */}
            <TouchableOpacity
                style={[styles.listItem, styles.listItemLast]}
                onPress={onEditGoal}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: '#e8f5e8' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🎯</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.dailyVerseGoal')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.currentTarget', { count: dailyVerseGoal })}
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <View style={[
                        styles.goalBadge,
                        { backgroundColor: customColors.instagramBlue }
                    ]}>
                        <Text style={[styles.goalBadgeText, { color: 'white' }]}>
                            {dailyVerseGoal}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Goal projections */}
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{t('settings.projectedReading')}</Text>
                </View>
                <View style={styles.goalProjections}>
                    <View style={styles.projectionItem}>
                        <Text style={styles.projectionValue}>{weeklyGoal}</Text>
                        <Text style={styles.projectionLabel}>{t('settings.perWeek')}</Text>
                    </View>
                    <View style={styles.projectionDivider} />
                    <View style={styles.projectionItem}>
                        <Text style={styles.projectionValue}>{monthlyGoal}</Text>
                        <Text style={styles.projectionLabel}>{t('settings.perMonth')}</Text>
                    </View>
                </View>
            </View>

            {/* Motivational message */}
            <View style={{
                padding: 16,
                alignItems: 'center',
                borderTopWidth: 0.5,
                borderTopColor: customColors?.borderColor || '#dbdbdb',
            }}>
                <Text style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: customColors?.instagramBlue || '#0095f6',
                    textAlign: 'center'
                }}>
                    {t('settings.motivationalMessage')}
                </Text>
            </View>
        </View>
    );
}
