import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {DailyReadingAssignment, EnhancedDailyReadingAssignment} from '@/models';

interface Props {
    dailyReadingAssignments: EnhancedDailyReadingAssignment[];
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
    const completedCount = dailyReadingAssignments.filter(item => item.is_completed).length;
    const progressPercentage = dailyReadingAssignments.length > 0 ? (completedCount / dailyReadingAssignments.length) * 100 : 100;
    const allDone = dailyReadingAssignments.length > 0 && dailyReadingAssignments.every(item => item.is_completed);

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
                        const isLast = index === dailyReadingAssignments.length - 1;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.listItem,
                                    isLast && styles.listItemLast,
                                    item.is_completed && { opacity: 0.6 }
                                ]}
                                onPress={() => onToggle(item)}
                            >
                                <View style={[
                                    styles.itemIcon,
                                    { backgroundColor: '#e3f2fd' }
                                ]}>
                                    <Text style={{ fontSize: 18 }}>📖</Text>
                                </View>

                                <View style={styles.itemContent}>
                                    <Text style={[
                                        styles.itemTitle,
                                        item.is_completed && {
                                            textDecorationLine: 'line-through',
                                            color: customColors?.subtleGray || '#8e8e8e'
                                        }
                                    ]}>
                                        {item.book_title} {item.chapter_title}:{item.start_verse_title} - {item.end_verse_title}
                                    </Text>
                                </View>

                                <View style={[
                                    styles.checkbox,
                                    item.is_completed && styles.checkboxChecked
                                ]}>
                                    {item.is_completed && (
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
                        🎉 Congratulations! You've completed today's reading.
                    </Text>
                </View>
            )}
        </View>
    );
}
