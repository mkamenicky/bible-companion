import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

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
    const completedCount = dailyChecklistItems.filter(task => taskStatus[task]).length;
    const allDone = dailyChecklistItems.every(task => taskStatus[task]);
    const progressPercentage = (completedCount / dailyChecklistItems.length) * 100;

    // Format the date nicely
    const formattedDate = today.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Text</Text>
                <Text style={styles.sectionSubtitle}>Your daily spiritual reflection</Text>
            </View>

            {/* Task list */}
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
                                { backgroundColor: '#fff3e0' } // Calendar/daily color
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
                                    Daily scripture and reflection
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
                    <Text style={styles.progressLabel}>Daily Progress</Text>
                    <Text style={styles.progressValue}>{completedCount}/{dailyChecklistItems.length}</Text>
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
                        🎉 Daily text completed! Great start to your day!
                    </Text>
                </View>
            )}
        </View>
    );
}
