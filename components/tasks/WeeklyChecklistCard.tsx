// WeeklyChecklistCard.tsx
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from '@/hooks';

interface Props {
    items: string[];
    title: string;
    taskStatus: Record<string, boolean>;
    onConfirm: (task: string, status: boolean) => void;
    styles: any;
    customColors?: any;
}

const getTaskIcon = (task: string) => {
    if (task.includes('Midweek')) return '⛪';
    if (task.includes('Weekend')) return '📚';
    if (task.includes('Family')) return '👨‍👩‍👧‍👦';
    if (task.includes('Bible Reading')) return '📖';
    return '📋';
};

export default function WeeklyChecklistCard({items, title, taskStatus, onConfirm, styles, customColors}: Props) {
    const t = useTranslation();
    const completedCount = items.filter(task => taskStatus[task]).length;
    const allDone = items.every(task => taskStatus[task]);
    const progressPercentage = (completedCount / items.length) * 100;

    const getTaskSubtitle = (task: string) => {
        if (task.includes('Midweek')) return t('weeklyChecklist.midweekSubtitle');
        if (task.includes('Weekend')) return t('weeklyChecklist.weekendSubtitle');
        if (task.includes('Family')) return t('weeklyChecklist.familySubtitle');
        if (task.includes('Bible Reading')) return t('weeklyChecklist.readingSubtitle');
        return t('weeklyChecklist.defaultSubtitle');
    };

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionSubtitle}>{t('weeklyChecklist.subtitle')}</Text>
            </View>

            <View>
                {items.map((task, index) => {
                    const isCompleted = taskStatus[task];
                    const isLast = index === items.length - 1;

                    return (
                        <TouchableOpacity
                            key={task}
                            style={[
                                styles.listItem,
                                isLast && styles.listItemLast,
                                isCompleted && {opacity: 0.6}
                            ]}
                            onPress={() => onConfirm(task, !isCompleted)}
                        >
                            <View style={[
                                styles.itemIcon,
                                task.includes('Midweek') && {backgroundColor: '#f3e5f5'},
                                task.includes('Weekend') && {backgroundColor: '#e8f5e8'},
                                task.includes('Family') && {backgroundColor: '#fff3e0'},
                                task.includes('Bible Reading') && {backgroundColor: '#e3f2fd'},
                            ]}>
                                <Text style={{fontSize: 18}}>{getTaskIcon(task)}</Text>
                            </View>

                            <View style={styles.itemContent}>
                                <Text style={[
                                    styles.itemTitle,
                                    isCompleted && {
                                        textDecorationLine: 'line-through',
                                        color: customColors?.subtleGray || '#8e8e8e'
                                    }
                                ]}>
                                    {task}
                                </Text>
                                <Text style={styles.itemSubtitle}>
                                    {getTaskSubtitle(task)}
                                </Text>
                            </View>

                            <View style={[
                                styles.checkbox,
                                isCompleted && styles.checkboxChecked
                            ]}>
                                {isCompleted && (
                                    <Text style={styles.checkboxIcon}>✓</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{t('weeklyChecklist.weeklyProgress')}</Text>
                    <Text style={styles.progressValue}>{completedCount}/{items.length}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[
                        styles.progressFill,
                        {width: `${progressPercentage}%`}
                    ]}/>
                </View>
            </View>

            {allDone && (
                <View style={{
                    padding: 16,
                    alignItems: 'center',
                    borderTopWidth: 0.5,
                    borderTopColor: customColors?.borderColor || '#dbdbdb',
                }}>
                    <Text style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: customColors?.completedGreen || '#34d399',
                        textAlign: 'center'
                    }}>
                        {t('weeklyChecklist.allCompleted')}
                    </Text>
                </View>
            )}
        </View>
    );
}
