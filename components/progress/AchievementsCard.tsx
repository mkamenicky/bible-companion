import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
    currentStreak: number;
    totalVersesRead: number;
    chaptersCompleted: number;
    styles: any;
    customColors: any;
}

export default function AchievementsCard({
                                             currentStreak,
                                             totalVersesRead,
                                             chaptersCompleted,
                                             styles,
                                             customColors
                                         }: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <Text style={styles.sectionSubtitle}>Milestones and badges earned</Text>
            </View>

            <View style={{paddingHorizontal: 20, paddingBottom: 20}}>
                {/* Achievement Items */}
                <TouchableOpacity style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: customColors.borderColor,
                }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: currentStreak >= 7 ? customColors.completedGreen : customColors.lightGray,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <Text style={{fontSize: 20}}>
                            {currentStreak >= 7 ? '🏆' : '🔒'}
                        </Text>
                    </View>

                    <View style={{flex: 1}}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: currentStreak >= 7 ? customColors.color : customColors.subtleGray,
                            marginBottom: 2,
                        }}>
                            Week Warrior
                        </Text>
                        <Text style={{
                            fontSize: 13,
                            color: customColors.subtleGray,
                        }}>
                            Read for 7 consecutive days
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: customColors.borderColor,
                }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: totalVersesRead >= 100 ? customColors.completedGreen : customColors.lightGray,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <Text style={{fontSize: 20}}>
                            {totalVersesRead >= 100 ? '📚' : '🔒'}
                        </Text>
                    </View>

                    <View style={{flex: 1}}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: totalVersesRead >= 100 ? customColors.color : customColors.subtleGray,
                            marginBottom: 2,
                        }}>
                            Century Reader
                        </Text>
                        <Text style={{
                            fontSize: 13,
                            color: customColors.subtleGray,
                        }}>
                            Read 100 verses
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: chaptersCompleted >= 10 ? customColors.completedGreen : customColors.lightGray,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <Text style={{fontSize: 20}}>
                            {chaptersCompleted >= 10 ? '⭐' : '🔒'}
                        </Text>
                    </View>

                    <View style={{flex: 1}}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: chaptersCompleted >= 10 ? customColors.color : customColors.subtleGray,
                            marginBottom: 2,
                        }}>
                            Chapter Champion
                        </Text>
                        <Text style={{
                            fontSize: 13,
                            color: customColors.subtleGray,
                        }}>
                            Complete 10 chapters
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
