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
import ScreenContainer from '@/components/ScreenContainer';

// Service and utility imports
import { useProgressData } from '@/hooks/useProgressData';
import { ThemeService } from '@/services/theme/ThemeService';

export default function ProgressScreen() {
    // Custom hook for data management
    const { stats, loading, refreshing, onRefresh } = useProgressData();

    // Theme and styling
    const { colors } = useTheme();
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 16 }}>Loading progress...</Text>
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
                            <Card.Title title="Reading Progress" />
                            <Card.Content>
                                <Text style={{ marginBottom: 8 }}>
                                    Total Verses Read: {stats.totalVersesRead}
                                </Text>
                                <Text style={{ marginBottom: 4 }}>Weekly Progress</Text>
                                <ProgressBar progress={stats.weeklyProgress / 100} style={{ marginBottom: 12 }} />
                                <Text style={{ marginBottom: 4 }}>Monthly Progress</Text>
                                <ProgressBar progress={stats.monthlyProgress / 100} />
                            </Card.Content>
                        </Card>

                        <Card style={styles.card}>
                            <Card.Title title="Streaks" />
                            <Card.Content>
                                <Text style={{ marginBottom: 8 }}>
                                    Current Streak: {stats.currentStreak} days
                                </Text>
                                <Text>
                                    Longest Streak: {stats.longestStreak} days
                                </Text>
                            </Card.Content>
                        </Card>

                        <Card style={styles.card}>
                            <Card.Title title="Task Completion" />
                            <Card.Content>
                                <Text style={{ marginBottom: 8 }}>
                                    Completed: {stats.completedTasks} / {stats.totalTasks}
                                </Text>
                                <ProgressBar
                                    progress={stats.totalTasks > 0 ? stats.completedTasks / stats.totalTasks : 0}
                                />
                            </Card.Content>
                        </Card>
                    </>
                )}
            </ScreenContainer>
        </View>
    );
}
