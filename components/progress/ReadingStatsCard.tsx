import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from '@/hooks';
import type {ProgressStats} from '@/models';
import type {ThemeColors} from '@/services/(services)/theme/ThemeService';

interface Props {
    stats: ProgressStats;
    styles: any;
    customColors: ThemeColors;
}

/**
 * All Bible reading numbers in one card: overall progress as a bar, the
 * rest as a grid of small tiles.
 */
export default function ReadingStatsCard({stats, styles, customColors}: Props) {
    const t = useTranslation();

    const tiles: Array<{ label: string; value: number }> = [
        {label: t('progress.totalVersesRead'), value: stats.totalVersesRead},
        {label: t('progress.chaptersCompleted'), value: stats.chaptersCompleted},
        {label: t('progress.totalReadingDays'), value: stats.totalReadingDays},
        // Short labels: the long "Weekly Verses Read" does not fit a tile.
        {label: `${t('progress.thisWeek')} · ${t('common.verses')}`, value: stats.weeklyVersesRead},
        {label: `${t('progress.thisMonth')} · ${t('common.verses')}`, value: stats.monthlyVersesRead},
        {label: t('progress.longestStreak'), value: stats.longestStreak},
    ];

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('progress.readingProgress')}</Text>
                <Text style={styles.sectionSubtitle}>{t('progress.readingProgressSubtitle')}</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{t('progress.bibleProgress')}</Text>
                    <Text style={styles.progressValue}>{stats.bibleProgressPercentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[
                        styles.progressFill,
                        {width: `${stats.bibleProgressPercentage}%`, backgroundColor: customColors.completedGreen},
                    ]}/>
                </View>
            </View>

            <View style={local.grid}>
                {tiles.map(tile => (
                    <View key={tile.label} style={local.cell}>
                        <View style={[local.tile, {backgroundColor: customColors.lightGray}]}>
                            <Text style={[local.value, {color: customColors.text}]}>{tile.value}</Text>
                            <Text style={[local.label, {color: customColors.subtleGray}]} numberOfLines={2}>
                                {tile.label}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const local = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cell: {
        width: '33.333%',
        padding: 4,
    },
    tile: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 6,
        alignItems: 'center',
        minHeight: 76,
        justifyContent: 'center',
    },
    value: {
        fontSize: 20,
        fontWeight: '700',
    },
    label: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 4,
    },
});
