import React, {useCallback, useState} from 'react';
import {useColorScheme, View} from 'react-native';
import {Appbar, Button, Card, ProgressBar, Text, useTheme} from 'react-native-paper';
import {readingRepo} from '@/services/repository/reading.repository';
import ScreenContainer from '@/components/ScreenContainer';
import {useFocusEffect} from "expo-router";
import {getCustomColors, getStyles} from "@/utils/colorUtils";
import {MaterialCommunityIcons} from "@expo/vector-icons";

export default function ProgressScreen() {
    const {colors} = useTheme();
    const [totalProgress, setTotalProgress] = useState<{ read: number, total: number }>({read: 10, total: 1000});
    const [refreshing, setRefreshing] = useState(false);

    const schema = useColorScheme();
    const customColors = getCustomColors(schema);
    const styles = getStyles(customColors);

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
        <View style={{flex: 1, backgroundColor: colors.background}}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Your Progress"/>
            </Appbar.Header>

            <ScreenContainer onRefresh={onRefresh}>
                <Card style={styles.card}>
                    <Card.Title title="📊 Reading Progress"/>
                    <Card.Content>
                        <Text variant="titleMedium" style={{marginBottom: 8}}>
                            {totalProgress.read ?? 0} chapters of {totalProgress.total ?? 0} chapters read
                        </Text>
                        <ProgressBar progress={progress} style={styles.progressBar}/>
                        <Text style={{marginTop: 8}}>
                            {Math.round(progress * 100)}% of goal
                        </Text>
                    </Card.Content>
                </Card>
            </ScreenContainer>
        </View>
    );
}
