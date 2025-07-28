import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {DailyReadingAssignment} from '@/models';

interface Props {
    dailyReadingAssignments: DailyReadingAssignment[];
    onToggle: (item: DailyReadingAssignment) => void;
    title: string;
    styles: any;
    customColors?: any;
}

export default function DailyAssignmentsCard({
                                            dailyReadingAssignments,
                                            onToggle,
                                            title,
                                            styles,
                                            customColors
                                        }: Props) {
    const isRead = (item: DailyReadingAssignment) =>
        dailyReadingAssignments.some(dailyReadingAssignment => dailyReadingAssignment.is_completed);

    const completedCount = dailyReadingAssignments.filter(isRead).length;
    const allDone = dailyReadingAssignments.length === 0 || dailyReadingAssignments.every(isRead);
    const progressPercentage = dailyReadingAssignments.length > 0 ? (completedCount / dailyReadingAssignments.length) * 100 : 100;

    // Estimate reading time (roughly 1 minute per chapter)
    const getReadingTime = (item: DailyReadingAssignment) => {
        // @ts-ignore
        const verseCount = item.end_verse_id - item.start_verse_id;
        const minutes = Math.max(1, Math.round(verseCount / 6)); // Rough estimate: 6 verses per minute
        return `${minutes} min`;
    };

    const getVerseCount = (item: DailyReadingAssignment) => {
        // @ts-ignore
        const count = item.end_verse_id - item.start_verse_id;
        return `${count} verses`;
    };

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionSubtitle}>Daily scripture reading</Text>
            </View>

            {/* Reading list */}
            <View>
                {dailyReadingAssignments.length === 0 ? (
                    <View style={[styles.listItem, { justifyContent: 'center' }]}>
                        <Text style={[styles.itemTitle, { textAlign: 'center', fontStyle: 'italic' }]}>
                            No reading plan available for today
                        </Text>
                    </View>
                ) : (
                    dailyReadingAssignments.map((item, index) => {
                        const isCompleted = isRead(item);
                        const isLast = index === dailyReadingAssignments.length - 1;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.listItem,
                                    isLast && styles.listItemLast,
                                    isCompleted && { opacity: 0.6 }
                                ]}
                                onPress={() => onToggle(item)}
                            >
                                <View style={[
                                    styles.itemIcon,
                                    { backgroundColor: '#e3f2fd' } // Bible book color
                                ]}>
                                    <Text style={{ fontSize: 18 }}>📖</Text>
                                </View>

                                <View style={styles.itemContent}>
                                    <Text style={[
                                        styles.itemTitle,
                                        isCompleted && {
                                            textDecorationLine: 'line-through',
                                            color: customColors?.subtleGray || '#8e8e8e'
                                        }
                                    ]}>
                                        {item.display_title}
                                    </Text>
                                    <Text style={styles.itemSubtitle}>
                                        {getReadingTime(item)} • {getVerseCount(item)}
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
                    })
                )}
            </View>

            {/* Progress section - only show if there are items */}
            {dailyReadingAssignments.length > 0 && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Today's Progress</Text>
                        <Text style={styles.progressValue}>{completedCount}/{dailyReadingAssignments.length}</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[
                            styles.progressFill,
                            { width: `${progressPercentage}%` }
                        ]} />
                    </View>
                </View>
            )}

            {/* Completion message */}
            {allDone && dailyReadingAssignments.length > 0 && (
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
                        🎉 Congratulations! You've completed today's reading.
                    </Text>
                </View>
            )}
        </View>
    );
}
