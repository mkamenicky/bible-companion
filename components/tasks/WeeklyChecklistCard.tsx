import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
    items: string[];
    title: string;
    taskStatus: Record<string, boolean>;
    onConfirm: (task: string, status: boolean) => void;
    styles: any;
    customColors?: any; // Add this for color access
}

// Icon mapping for different task types
const getTaskIcon = (task: string) => {
    if (task.includes('Midweek')) return '⛪';
    if (task.includes('Weekend')) return '📚';
    if (task.includes('Family')) return '👨‍👩‍👧‍👦';
    if (task.includes('Bible Reading')) return '📖';
    return '📋';
};

const getTaskSubtitle = (task: string) => {
    if (task.includes('Midweek')) return 'Study materials';
    if (task.includes('Weekend')) return 'Watchtower study';
    if (task.includes('Family')) return 'Weekly family study';
    if (task.includes('Bible Reading')) return 'Weekly reading';
    return 'Complete this task';
};

export default function WeeklyChecklistCard({ items, title, taskStatus, onConfirm, styles, customColors }: Props) {
    const completedCount = items.filter(task => taskStatus[task]).length;
    const allDone = items.every(task => taskStatus[task]);
    const progressPercentage = (completedCount / items.length) * 100;

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionSubtitle}>Weekly activities</Text>
            </View>

            {/* Task list */}
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
                                isCompleted && { opacity: 0.6 }
                            ]}
                            onPress={() => onConfirm(task, !isCompleted)}
                        >
                            <View style={[
                                styles.itemIcon,
                                // Color-code different task types
                                task.includes('Midweek') && { backgroundColor: '#f3e5f5' },
                                task.includes('Weekend') && { backgroundColor: '#e8f5e8' },
                                task.includes('Family') && { backgroundColor: '#fff3e0' },
                                task.includes('Bible Reading') && { backgroundColor: '#e3f2fd' },
                            ]}>
                                <Text style={{ fontSize: 18 }}>{getTaskIcon(task)}</Text>
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

            {/* Progress section */}
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Weekly Progress</Text>
                    <Text style={styles.progressValue}>{completedCount}/{items.length}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[
                        styles.progressFill,
                        { width: `${progressPercentage}%` }
                    ]} />
                </View>
            </View>

            {/* Completion message */}
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
                        🎉 All tasks completed! Great work this week!
                    </Text>
                </View>
            )}
        </View>
    );
}
