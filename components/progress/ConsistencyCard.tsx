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
 * How regularly each routine is kept. One compact row per routine: name and
 * current streak, below it a dot per recent day/week and the share of recent
 * days/weeks it was done. Daily and weekly routines are listed separately,
 * so the unit (days or weeks) is stated once per group instead of per row.
 */
export default function ConsistencyCard({overview, styles, customColors}: Props) {
    const t = useTranslation();
    const {done, total} = overview.thisWeek;
    const weekPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

    const renderHabit = (habit: HabitConsistency, isLast: boolean) => {
        const {icon, labelKey} = HABITS[habit.id];
        const isDaily = habit.cadence === 'daily';
        const streakAlive = habit.currentStreak > 0;

        return (
            <View
                key={habit.id}
                style={[local.row, !isLast && {borderBottomWidth: 0.5, borderBottomColor: customColors.borderColor}]}
            >
                <Text style={local.icon}>{icon}</Text>

                <View style={local.body}>
                    <View style={local.line}>
                        <Text style={[local.name, {color: customColors.text}]} numberOfLines={1}>{t(labelKey)}</Text>
                        <Text style={[local.streak, {color: streakAlive ? customColors.text : customColors.subtleGray}]}>
                            {streakAlive ? '🔥 ' : ''}{habit.currentStreak}
                        </Text>
                    </View>

                    <View style={[local.line, local.secondLine]}>
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
                                ? t('progress.consistency.rate', {
                                    percentage: Math.round(habit.recentRate * 100),
                                    best: habit.bestStreak,
                                })
                                : t('progress.consistency.notStarted')}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderGroup = (cadence: 'daily' | 'weekly', headerKey: string) => {
        const habits = overview.habits.filter(habit => habit.cadence === cadence);
        return (
            <View>
                <Text style={[local.groupHeader, {color: customColors.subtleGray}]}>{t(headerKey)}</Text>
                {habits.map((habit, index) => renderHabit(habit, index === habits.length - 1))}
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
                {renderGroup('daily', 'progress.consistency.dailyHeader')}
                {renderGroup('weekly', 'progress.consistency.weeklyHeader')}
            </View>
        </View>
    );
}

const local = StyleSheet.create({
    list: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    groupHeader: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 12,
        marginBottom: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    icon: {
        fontSize: 20,
        width: 32,
    },
    body: {
        flex: 1,
    },
    line: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    secondLine: {
        marginTop: 6,
    },
    name: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        marginRight: 8,
    },
    streak: {
        fontSize: 15,
        fontWeight: '700',
    },
    dots: {
        flexDirection: 'row',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        marginRight: 4,
    },
    weekDot: {
        borderRadius: 3,
    },
    rate: {
        fontSize: 12,
    },
});
