import React from 'react';
import { View, Text } from 'react-native';

interface Props {
    currentStreak: number;
    longestStreak: number;
    totalReadingDays: number;
    styles: any;
    customColors: any;
}

export default function StreakCard({
                                       currentStreak,
                                       longestStreak,
                                       totalReadingDays,
                                       styles,
                                       customColors
                                   }: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reading Streak</Text>
                <Text style={styles.sectionSubtitle}>Keep the momentum going!</Text>
            </View>

            {/* Current Streak Display */}
            <View style={{
                alignItems: 'center',
                paddingVertical: 24,
                borderBottomWidth: 0.5,
                borderBottomColor: customColors.borderColor,
            }}>
                <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: customColors.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: '700',
                        color: '#ffffff',
                    }}>
                        🔥
                    </Text>
                </View>

                <Text style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: customColors.color,
                    marginBottom: 4,
                }}>
                    {currentStreak}
                </Text>

                <Text style={{
                    fontSize: 16,
                    color: customColors.subtleGray,
                    textAlign: 'center',
                }}>
                    day{currentStreak !== 1 ? 's' : ''} streak
                </Text>
            </View>

            {/* Streak Stats */}
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                paddingVertical: 16,
            }}>
                <View style={{flex: 1, alignItems: 'center'}}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: customColors.color,
                        marginBottom: 4,
                    }}>
                        {longestStreak}
                    </Text>
                    <Text style={{
                        fontSize: 13,
                        color: customColors.subtleGray,
                        textAlign: 'center',
                    }}>
                        Longest Streak
                    </Text>
                </View>

                <View style={{
                    width: 0.5,
                    backgroundColor: customColors.borderColor,
                    marginHorizontal: 16,
                }} />

                <View style={{flex: 1, alignItems: 'center'}}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: customColors.color,
                        marginBottom: 4,
                    }}>
                        {totalReadingDays}
                    </Text>
                    <Text style={{
                        fontSize: 13,
                        color: customColors.subtleGray,
                        textAlign: 'center',
                    }}>
                        Total Days
                    </Text>
                </View>
            </View>
        </View>
    );
}
