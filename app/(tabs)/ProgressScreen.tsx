// React imports
import React from 'react';
import { useColorScheme, View } from 'react-native';

// Third-party library imports
import {
    Appbar,
    Card,
    ProgressBar,
    Text,
    ActivityIndicator,
    useTheme
} from 'react-native-paper';

// Local component imports
import { ScreenContainer } from '@/components';

// Service and utility imports
import { useProgressData } from '@/hooks';
import { ThemeService } from '@/services';

export default function ProgressScreen() {
    const { stats, loading, refreshing, onRefresh } = useProgressData();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={customColors.accent} />
                <Text style={{ marginTop: 16, color: customColors.text }}>Loading progress...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Progress" />
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                {stats && (
                    <>
                        <Card style={styles.card}>
                            <Card.Title title="Reading Progress" titleStyle={{ color: customColors.text }} />
                            <Card.Content>
                                <Text style={{ marginBottom: 8, color: customColors.text }}>
                                    Total Verses Read: {stats.totalVersesRead}
                                </Text>
                                <Text style={{ marginBottom: 4, color: customColors.text }}>Weekly Progress</Text>
                                <ProgressBar
                                    progress={stats.weeklyProgress / 100}
                                    style={{ marginBottom: 12, backgroundColor: customColors.lightGray }}
                                    color={customColors.accent}
                                />
                                <Text style={{ marginBottom: 4, color: customColors.text }}>Monthly Progress</Text>
                                <ProgressBar
                                    progress={stats.monthlyProgress / 100}
                                    style={{ backgroundColor: customColors.lightGray }}
                                    color={customColors.accent}
                                />
                            </Card.Content>
                        </Card>

                        <Card style={styles.card}>
                            <Card.Title title="Streaks" titleStyle={{ color: customColors.text }} />
                            <Card.Content>
                                <Text style={{ marginBottom: 8, color: customColors.text }}>
                                    Current Streak: {stats.currentStreak} days
                                </Text>
                                <Text style={{ color: customColors.text }}>
                                    Longest Streak: {stats.longestStreak} days
                                </Text>
                            </Card.Content>
                        </Card>

                        <Card style={styles.card}>
                            <Card.Title title="Task Completion" titleStyle={{ color: customColors.text }} />
                            <Card.Content>
                                <Text style={{ marginBottom: 8, color: customColors.text }}>
                                    Completed: {stats.completedTasks} / {stats.totalTasks}
                                </Text>
                                <ProgressBar
                                    progress={stats.totalTasks > 0 ? stats.completedTasks / stats.totalTasks : 0}
                                    style={{ backgroundColor: customColors.lightGray }}
                                    color={customColors.completedGreen}
                                />
                            </Card.Content>
                        </Card>
                    </>
                )}
            </ScreenContainer>
        </View>
    );
}
