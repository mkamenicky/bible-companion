// ReadingStatsCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import {ThemeColors} from "@/services/(services)/theme/ThemeService";

interface Props {
    totalVersesRead: number;
    chaptersCompleted: number;
    bibleProgressPercentage: number;
    styles: any;
    customColors: ThemeColors;
}

export default function ReadingStatsCard({
                                             totalVersesRead,
                                             chaptersCompleted,
                                             bibleProgressPercentage,
                                             styles,
                                             customColors
                                         }: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reading Progress</Text>
                <Text style={styles.sectionSubtitle}>Your Bible journey statistics</Text>
            </View>

            {/* Main Progress */}
            <View style={{paddingHorizontal: 20, paddingVertical: 16}}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <Text style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: customColors.text,
                    }}>
                        Total Verses Read
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: customColors.accent,
                    }}>
                        {totalVersesRead}
                    </Text>
                </View>

                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <Text style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: customColors.text,
                    }}>
                        Chapters Completed
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: customColors.accent,
                    }}>
                        {chaptersCompleted}
                    </Text>
                </View>

                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <Text style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: customColors.text,
                    }}>
                        Bible Progress
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: customColors.completedGreen,
                    }}>
                        {bibleProgressPercentage}%
                    </Text>
                </View>

                {/* Overall Progress Bar */}
                <View style={{
                    marginTop: 16,
                    marginBottom: 8,
                }}>
                    <View style={styles.progressBar}>
                        <View style={[
                            styles.progressFill,
                            {
                                width: `${bibleProgressPercentage}%`,
                                backgroundColor: customColors.completedGreen,
                            }
                        ]} />
                    </View>
                </View>
            </View>
        </View>
    );
}
