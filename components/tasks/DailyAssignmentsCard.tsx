// DailyAssignmentsCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import {DailyReadingAssignment, EnhancedDailyReadingAssignment} from '@/models';
import {useLocalization, useTranslation} from '@/hooks';

interface Props {
    dailyReadingAssignments: EnhancedDailyReadingAssignment[];
    onToggle: (item: DailyReadingAssignment) => void;
    onReadMore: () => Promise<void>;
    title: string;
    styles: any;
    customColors?: any;
}

export default function DailyAssignmentsCard({
                                                 dailyReadingAssignments,
                                                 onToggle,
                                                 onReadMore,
                                                 title,
                                                 styles,
                                                 customColors
                                             }: Props) {
    const { t, getLocalizedBookTitle } = useLocalization();
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const completedCount = dailyReadingAssignments.filter(item => item.is_completed).length;
    const progressPercentage = dailyReadingAssignments.length > 0 ? (completedCount / dailyReadingAssignments.length) * 100 : 100;
    const allDone = dailyReadingAssignments.length > 0 && dailyReadingAssignments.every(item => item.is_completed);

    const handleReadMore = async () => {
        setIsLoadingMore(true);
        try {
            await onReadMore();
        } catch (error) {
            console.error('Error loading more assignments:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionSubtitle}>{t('dailyAssignments.subtitle')}</Text>
            </View>

            <View>
                {dailyReadingAssignments.length === 0 ? (
                    <View style={[styles.listItem, { justifyContent: 'center' }]}>
                        <Text style={[styles.itemTitle, { textAlign: 'center', fontStyle: 'italic' }]}>
                            {t('dailyAssignments.noReading')}
                        </Text>
                    </View>
                ) : (
                    dailyReadingAssignments.map((item, index) => {
                        const isLast = index === dailyReadingAssignments.length - 1;
                        const localizedTitle = getLocalizedBookTitle(item);

                        return (
                            <TouchableOpacity
                                key={`${item.id}-${item.start_verse_id}-${item.end_verse_id}`}
                                style={[
                                    styles.listItem,
                                    isLast && styles.listItemLast,
                                    item.is_completed && { opacity: 0.6 }
                                ]}
                                onPress={() => {
                                    console.log('Assignment clicked:', {
                                        id: item.id,
                                        verses: `${item.start_verse_id}-${item.end_verse_id}`,
                                        current_status: item.is_completed,
                                        display_title: item.display_title,
                                        localized_title: localizedTitle
                                    });
                                    onToggle(item);
                                }}
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
                                        {localizedTitle}
                                    </Text>
                                    {/* Add additional info if available */}
                                    {item.verses_in_range && (
                                        <Text style={styles.itemSubtitle}>
                                            {item.verses_in_range} {t('common.verses')}
                                            {item.estimated_reading_time && (
                                                ` • ${Math.ceil(item.estimated_reading_time)} min`
                                            )}
                                        </Text>
                                    )}
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

            {dailyReadingAssignments.length > 0 && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>{t('dailyAssignments.todayProgress')}</Text>
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

            {/* Read More Button */}
            {dailyReadingAssignments.length > 0 && (
                <View style={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 8,
                }}>
                    <TouchableOpacity
                        style={[
                            styles.readMoreButton || {
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                backgroundColor: customColors?.lightGray || '#f3f4f6',
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: customColors?.borderColor || '#e5e7eb',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            },
                            isLoadingMore && { opacity: 0.7 }
                        ]}
                        onPress={handleReadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? (
                            <>
                                <ActivityIndicator
                                    size="small"
                                    color={customColors?.accent || '#0095f6'}
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={[
                                    styles.readMoreButtonText || {
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: customColors?.accent || '#0095f6',
                                    }
                                ]}>
                                    {t('dailyAssignments.loadingMore')}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={{ fontSize: 16, marginRight: 6 }}>📚</Text>
                                <Text style={[
                                    styles.readMoreButtonText || {
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: customColors?.accent || '#0095f6',
                                    }
                                ]}>
                                    {t('dailyAssignments.readMore')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

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
                        {t('dailyAssignments.congratulations')}
                    </Text>
                </View>
            )}
        </View>
    );
}
