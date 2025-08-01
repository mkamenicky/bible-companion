// DailyTextBanner.tsx
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/hooks';

interface Props {
    today: Date;
    dailyChecklistItems: string[];
    taskStatus: Record<string, boolean>;
    onConfirm: (task: string, status: boolean) => void;
    styles: any;
    customColors?: any;
}

export default function DailyTextBanner({
                                            today,
                                            dailyChecklistItems,
                                            taskStatus,
                                            onConfirm,
                                            styles,
                                            customColors
                                        }: Props) {
    const t = useTranslation();
    const completedCount = dailyChecklistItems.filter(task => taskStatus[task]).length;
    const allDone = dailyChecklistItems.every(task => taskStatus[task]);
    const progressPercentage = (completedCount / dailyChecklistItems.length) * 100;

    const formattedDate = today.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('dailyText.title')}</Text>
                <Text style={styles.sectionSubtitle}>{t('dailyText.subtitle')}</Text>
            </View>

            <View>
                {dailyChecklistItems.map((task, index) => {
                    const isCompleted = taskStatus[task];
                    const isLast = index === dailyChecklistItems.length - 1;

                    return (
                        <TouchableOpacity
                            key={task}
                            style={[
                                styles.listItem,
                                isLast && styles.listItemLast,
                                isCompleted && { opacity: 0.6 }
                            ]}
                            onPress={() => onConfirm(task, !isCompleted)}
                        >
                            <View style={[
                                styles.itemIcon,
                                { backgroundColor: '#fff3e0' }
                            ]}>
                                <Text style={{ fontSize: 18 }}>📅</Text>
                            </View>

                            <View style={styles.itemContent}>
                                <Text style={[
                                    styles.itemTitle,
                                    isCompleted && {
                                        textDecorationLine: 'line-through',
                                        color: customColors?.subtleGray || '#8e8e8e'
                                    }
                                ]}>
                                    {formattedDate}
                                </Text>
                                <Text style={styles.itemSubtitle}>
                                    {t('dailyText.description')}
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
                    <Text style={styles.progressLabel}>{t('dailyText.dailyProgress')}</Text>
                    <Text style={styles.progressValue}>{completedCount}/{dailyChecklistItems.length}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[
                        styles.progressFill,
                        { width: `${progressPercentage}%` }
                    ]} />
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
                        {t('dailyText.completed')}
                    </Text>
                </View>
            )}
        </View>
    );
}
