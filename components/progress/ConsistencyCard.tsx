import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from '@/hooks';
import type {ConsistencyOverview, HabitConsistency, HabitId} from '@/models';
import type {ThemeColors} from '@/services/(services)/theme/ThemeService';

interface Props {
    overview: ConsistencyOverview;
    styles: any;
    customColors: ThemeColors;
}

/** Icon and translation key of each routine. */
const HABITS: Record<HabitId, { icon: string; labelKey: string }> = {
    bibleReading: {icon: '📖', labelKey: 'progress.consistency.bibleReading'},
    dailyText: {icon: '📅', labelKey: 'tasks.dailyText'},
    weeklyBibleReading: {icon: '📘', labelKey: 'tasks.weeklyBibleReading'},
    midweekPreparation: {icon: '⛪', labelKey: 'tasks.midweekMeeting'},
    weekendPreparation: {icon: '📚', labelKey: 'tasks.weekendMeeting'},
    familyWorship: {icon: '👨‍👩‍👧‍👦', labelKey: 'tasks.familyWorship'},
};

/**
 * How regularly each routine is kept: current and best streak, the share of
 * recent days/weeks it was done, and a dot per recent day/week.
 */
export default function ConsistencyCard({overview, styles, customColors}: Props) {
    const t = useTranslation();
    const {done, total} = overview.thisWeek;
    const weekPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

    const renderHabit = (habit: HabitConsistency) => {
        const {icon, labelKey} = HABITS[habit.id];
        const isDaily = habit.cadence === 'daily';
        const streakAlive = habit.currentStreak > 0;

        return (
            <View key={habit.id} style={[local.row, {backgroundColor: customColors.lightGray}]}>
                <View style={local.rowHeader}>
                    <Text style={local.icon}>{icon}</Text>
                    <View style={local.titleBlock}>
                        <Text style={[local.name, {color: customColors.text}]} numberOfLines={1}>{t(labelKey)}</Text>
                        <Text style={[local.caption, {color: customColors.subtleGray}]}>
                            {t(isDaily ? 'progress.consistency.daily' : 'progress.consistency.weekly')}
                        </Text>
                    </View>
                    <View style={local.streakBlock}>
                        <Text style={[local.streak, {color: streakAlive ? customColors.text : customColors.subtleGray}]}>
                            {streakAlive ? '🔥 ' : ''}{habit.currentStreak}
                        </Text>
                        <Text style={[local.caption, {color: customColors.subtleGray}]}>
                            {t('progress.consistency.best', {count: habit.bestStreak})}
                        </Text>
                    </View>
                </View>

                <View style={local.rowFooter}>
                    <View style={local.dots}>
                        {habit.recent.map((wasDone, index) => {
                            const isCurrent = index === habit.recent.length - 1;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        local.dot,
                                        !isDaily && local.weekDot,
                                        {
                                            backgroundColor: wasDone ? customColors.completedGreen : 'transparent',
                                            borderColor: wasDone
                                                ? customColors.completedGreen
                                                : isCurrent ? customColors.primary : customColors.borderColor,
                                        },
                                    ]}
                                />
                            );
                        })}
                    </View>
                    <Text style={[local.rate, {color: customColors.subtleGray}]}>
                        {habit.recentWindow > 0
                            ? t(isDaily ? 'progress.consistency.rateDays' : 'progress.consistency.rateWeeks', {
                                percentage: Math.round(habit.recentRate * 100),
                                count: habit.recentWindow,
                            })
                            : t('progress.consistency.notStarted')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('progress.consistency.title')}</Text>
                <Text style={styles.sectionSubtitle}>{t('progress.consistency.subtitle')}</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                        {t('progress.consistency.thisWeek', {done, total})}
                    </Text>
                    <Text style={styles.progressValue}>{weekPercentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {width: `${weekPercentage}%`}]}/>
                </View>
            </View>

            <View style={local.list}>
                {overview.habits.map(renderHabit)}
                <Text style={[local.legend, {color: customColors.subtleGray}]}>
                    {t('progress.consistency.legend')}
                </Text>
            </View>
        </View>
    );
}

const local = StyleSheet.create({
    list: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 16,
    },
    row: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 22,
        width: 34,
    },
    titleBlock: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
    },
    caption: {
        fontSize: 12,
        marginTop: 1,
    },
    streakBlock: {
        alignItems: 'flex-end',
    },
    streak: {
        fontSize: 18,
        fontWeight: '700',
    },
    rowFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginLeft: 34,
    },
    dots: {
        flexDirection: 'row',
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
        marginRight: 5,
    },
    weekDot: {
        borderRadius: 4,
    },
    rate: {
        fontSize: 12,
    },
    legend: {
        fontSize: 12,
        marginTop: 4,
    },
});
