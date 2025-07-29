// React imports
import React from 'react';
import {useColorScheme, View, ScrollView, Text, TouchableOpacity} from 'react-native';

// Third-party library imports
import {ActivityIndicator, Appbar} from 'react-native-paper';

// Local component imports
import {ScreenContainer} from '@/components';

// Service and utility imports
import {useProgressData} from '@/hooks';
import {ThemeService} from '@/services';

export default function ProgressScreen() {
    const {stats, loading, onRefresh} = useProgressData();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (loading) {
        return (
            <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color={customColors.accent}/>
                <Text style={{marginTop: 16, color: customColors.text}}>Loading progress...</Text>
            </View>
        );
    }

    const StreakCard = () => (
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
                    {stats?.currentStreak || 0}
                </Text>

                <Text style={{
                    fontSize: 16,
                    color: customColors.subtleGray,
                    textAlign: 'center',
                }}>
                    day{(stats?.currentStreak || 0) !== 1 ? 's' : ''} streak
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
                        {stats?.longestStreak || 0}
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
                        {stats?.totalReadingDays || 0}
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

    const ReadingStatsCard = () => (
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
                        color: customColors.color,
                    }}>
                        Total Verses Read
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: customColors.accent,
                    }}>
                        {stats?.totalVersesRead || 0}
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
                        color: customColors.color,
                    }}>
                        Chapters Completed
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: customColors.accent,
                    }}>
                        {stats?.chaptersCompleted || 0}
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
                        color: customColors.color,
                    }}>
                        Bible Progress
                    </Text>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: customColors.completedGreen,
                    }}>
                        {stats?.bibleProgressPercentage || 0}%
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
                                width: `${stats?.bibleProgressPercentage || 0}%`,
                                backgroundColor: customColors.completedGreen,
                            }
                        ]} />
                    </View>
                </View>
            </View>
        </View>
    );

    const PeriodStatsCard = () => (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reading Activity</Text>
                <Text style={styles.sectionSubtitle}>Weekly and monthly progress</Text>
            </View>

            {/* Period Stats Grid */}
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 20,
            }}>
                {/* This Week */}
                <View style={{flex: 1, marginRight: 8}}>
                    <View style={{
                        backgroundColor: customColors.lightGray,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 13,
                            color: customColors.subtleGray,
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            This Week
                        </Text>

                        <Text style={{
                            fontSize: 24,
                            fontWeight: '700',
                            color: customColors.color,
                            marginBottom: 4,
                        }}>
                            {stats?.weeklyVersesRead || 0}
                        </Text>

                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray,
                            textAlign: 'center',
                        }}>
                            verses read
                        </Text>

                        {/* Weekly Progress Bar */}
                        <View style={{
                            width: '100%',
                            marginTop: 12,
                        }}>
                            <View style={[styles.progressBar, {height: 4}]}>
                                <View style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min((stats?.weeklyVersesRead || 0) / 50 * 100, 100)}%`,
                                        height: 4,
                                    }
                                ]} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* This Month */}
                <View style={{flex: 1, marginLeft: 8}}>
                    <View style={{
                        backgroundColor: customColors.lightGray,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 13,
                            color: customColors.subtleGray,
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            This Month
                        </Text>

                        <Text style={{
                            fontSize: 24,
                            fontWeight: '700',
                            color: customColors.color,
                            marginBottom: 4,
                        }}>
                            {stats?.monthlyVersesRead || 0}
                        </Text>

                        <Text style={{
                            fontSize: 12,
                            color: customColors.subtleGray,
                            textAlign: 'center',
                        }}>
                            verses read
                        </Text>

                        {/* Monthly Progress Bar */}
                        <View style={{
                            width: '100%',
                            marginTop: 12,
                        }}>
                            <View style={[styles.progressBar, {height: 4}]}>
                                <View style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min((stats?.monthlyVersesRead || 0) / 200 * 100, 100)}%`,
                                        height: 4,
                                    }
                                ]} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    const AchievementsCard = () => (
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
                        backgroundColor: stats?.currentStreak >= 7 ? customColors.completedGreen : customColors.lightGray,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <Text style={{fontSize: 20}}>
                            {stats?.currentStreak >= 7 ? '🏆' : '🔒'}
                        </Text>
                    </View>

                    <View style={{flex: 1}}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: stats?.currentStreak >= 7 ? customColors.color : customColors.subtleGray,
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
                        backgroundColor: (stats?.totalVersesRead || 0) >= 100 ? customColors.completedGreen : customColors.lightGray,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <Text style={{fontSize: 20}}>
                            {(stats?.totalVersesRead || 0) >= 100 ? '📚' : '🔒'}
                        </Text>
                    </View>

                    <View style={{flex: 1}}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: (stats?.totalVersesRead || 0) >= 100 ? customColors.color : customColors.subtleGray,
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
                        backgroundColor: (stats?.chaptersCompleted || 0) >= 10 ? customColors.completedGreen : customColors.lightGray,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <Text style={{fontSize: 20}}>
                            {(stats?.chaptersCompleted || 0) >= 10 ? '⭐' : '🔒'}
                        </Text>
                    </View>

                    <View style={{flex: 1}}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: (stats?.chaptersCompleted || 0) >= 10 ? customColors.color : customColors.subtleGray,
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

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title="Progress"
                    titleStyle={{color: customColors.color, fontWeight: '600'}}
                />
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                <StreakCard />
                <ReadingStatsCard />
                <PeriodStatsCard />
                <AchievementsCard />
            </ScreenContainer>
        </View>
    );
}
