import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ReadingPlan } from '@/models';

interface Props {
    readingPlan: ReadingPlan[];
    readChapters: ReadingPlan[];
    onToggle: (item: ReadingPlan) => void;
    title: string;
    styles: any;
    customColors?: any;
}

export default function ReadingPlanCard({
                                            readingPlan,
                                            readChapters,
                                            onToggle,
                                            title,
                                            styles,
                                            customColors
                                        }: Props) {
    const isRead = (item: ReadingPlan) =>
        readChapters.some(read => read.bibleChapter.BibleChapterId === item.bibleChapter.BibleChapterId);

    const completedCount = readingPlan.filter(isRead).length;
    const allDone = readingPlan.length === 0 || readingPlan.every(isRead);
    const progressPercentage = readingPlan.length > 0 ? (completedCount / readingPlan.length) * 100 : 100;

    // Estimate reading time (roughly 1 minute per chapter)
    const getReadingTime = (item: ReadingPlan) => {
        // @ts-ignore
        const verseCount = item.bibleChapter?.LastVerseId - item.bibleChapter?.FirstVerseId + 1;
        const minutes = Math.max(1, Math.round(verseCount / 6)); // Rough estimate: 6 verses per minute
        return `${minutes} min`;
    };

    const getVerseCount = (item: ReadingPlan) => {
        // @ts-ignore
        const count = item.bibleChapter?.LastVerseId -  item.bibleChapter?.FirstVerseId + 1;
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
                {readingPlan.length === 0 ? (
                    <View style={[styles.listItem, { justifyContent: 'center' }]}>
                        <Text style={[styles.itemTitle, { textAlign: 'center', fontStyle: 'italic' }]}>
                            No reading plan available for today
                        </Text>
                    </View>
                ) : (
                    readingPlan.map((item, index) => {
                        const isCompleted = isRead(item);
                        const isLast = index === readingPlan.length - 1;

                        return (
                            <TouchableOpacity
                                key={item.bibleChapter.BibleChapterId}
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
                                        {item.bibleBook.BookDisplayTitle} {item.bibleChapter.ChapterNumber}:{item.bibleChapter.FirstVerseId}-{item.bibleChapter.LastVerseId}
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
            {readingPlan.length > 0 && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Today's Progress</Text>
                        <Text style={styles.progressValue}>{completedCount}/{readingPlan.length}</Text>
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
            {allDone && readingPlan.length > 0 && (
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
