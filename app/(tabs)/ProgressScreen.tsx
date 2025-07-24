import React, { useEffect, useState, useCallback } from 'react';
import {StyleSheet, View} from 'react-native';
import {Appbar, Text, ProgressBar, Card, useTheme} from 'react-native-paper';
import { readingRepo } from '@/services/repository/reading.repository';
import ScreenContainer from '@/components/ScreenContainer';
import {useFocusEffect} from "expo-router";

export default function ProgressScreen() {
    const { colors } = useTheme();
    const [totalProgress, setTotalProgress] = useState<{ read: number, total: number }>({read: 10, total: 1000});
    const [refreshing, setRefreshing] = useState(false);

    const fetchProgress = async () => {
        const progress = await readingRepo.getProgressSummary();
        setTotalProgress(progress);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProgress();
        setRefreshing(false);
    }, []);


    useFocusEffect(
        useCallback(() => {
            fetchProgress();
        }, [])
    );

    const progress = totalProgress ? (totalProgress.read / totalProgress.total) : 1;

    return (
        <View style={{backgroundColor: colors.background}}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Your Progress" />
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                <Card style={styles.progressCard}>
                    <Card.Title title="📊 Reading Progress" />
                    <Card.Content>
                        <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                            {totalProgress.read ?? 0} chapters of {totalProgress.total ?? 0} chapters read
                        </Text>
                        <ProgressBar progress={progress} style={styles.progressBar} />
                        <Text style={{ marginTop: 8 }}>
                            {Math.round(progress * 100)}% of goal
                        </Text>
                    </Card.Content>
                </Card>
            </ScreenContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: '#e0e0e0', // light gray; adjust as needed
    },
    progressCard: {
        borderRadius: 12,
        elevation: 2,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
    },
});
