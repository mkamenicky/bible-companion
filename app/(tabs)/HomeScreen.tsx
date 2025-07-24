import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {Appbar, Button, Card, Checkbox, Divider, List, Modal, Portal, useTheme} from 'react-native-paper';
import {useFocusEffect} from 'expo-router';
import type {Weekday} from '@/utils/readingPlans';
import {readingPlan} from '@/utils/readingPlans';
import {readingRepo} from '@/services/repository/reading.repository';
import ScreenContainer from '@/components/ScreenContainer';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {MaterialCommunityIcons, MaterialIcons} from "@expo/vector-icons";
import {getCustomColors, getStyles} from "@/utils/colorUtils";

export default function HomeScreen() {
    const {colors} = useTheme();

    const colorScheme = useColorScheme();
    const customColors = getCustomColors(colorScheme);
    const styles = getStyles(customColors);

    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const weekday = today.toLocaleDateString('en-US', {weekday: 'long'}) as Weekday;

    const getFormattedWeekRange = (today: Date): string => {
        const day = today.getDay(); // 0 (Sun) to 6 (Sat)
        const monday = new Date(today);
        const sunday = new Date(today);

        // Adjust to Monday
        monday.setDate(today.getDate() - ((day + 6) % 7));
        // Adjust to Sunday
        sunday.setDate(monday.getDate() + 6);

        const format = (date: Date) =>
            `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}`;

        return `${format(monday)} - ${format(sunday)}`;
    };

    const weekRange = useMemo(() => getFormattedWeekRange(today), [today]);

    const todayChapters = readingPlan[weekday] || [];

    const [refreshing, setRefreshing] = useState(false);
    const [readChapters, setReadChapters] = useState<string[]>([]);
    const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});
    const [confirmationTask, setConfirmationTask] = useState<string | null>(null);

    const weeklyChecklistItems = [
        'Weekly Bible Reading (Meeting)',
        'Midweek Meeting Preparation',
        'Weekend Meeting Preparation',
        'Family Worship',
    ];
    const dailyChecklistItems = ['Daily Text'];

    const fetchReadChapters = useCallback(async () => {
        const read = await readingRepo.getReadChaptersForDate(today);
        setReadChapters(read);
    }, [today]);

    const fetchTaskStates = useCallback(async () => {
        const weekly = await readingRepo.getWeeklyTaskStates(today, weeklyChecklistItems);
        const daily = await readingRepo.getDailyTaskStates(today, dailyChecklistItems);
        setTaskStatus({...weekly, ...daily});
    }, [today]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchReadChapters(), fetchTaskStates()]);
        setRefreshing(false);
    }, [fetchReadChapters, fetchTaskStates]);

    useFocusEffect(
        useCallback(() => {
            onRefresh();
        }, [onRefresh])
    );

    const handleToggleChapter = async (chapter: string) => {
        const alreadyRead = readChapters.includes(chapter);
        if (alreadyRead) {
            await readingRepo.markAsUnread(chapter, today);
            setReadChapters(prev => prev.filter(c => c !== chapter));
        } else {
            await readingRepo.markAsRead(chapter, today);
            setReadChapters(prev => [...prev, chapter]);
        }
    };

    const confirmTaskCompletion = async () => {
        if (!confirmationTask) return;
        await readingRepo.setTaskState(confirmationTask, today, true);
        setTaskStatus(prev => ({...prev, [confirmationTask]: true}));
        setConfirmationTask(null);
    };

    const renderChecklist = (items: string[], title: string, isWeekly = false) => {
        const allDone = items.every(task => taskStatus[task]);
        return (

            <Card style={styles.card}>
                <Card.Title titleStyle={styles.cardTitle} title={title}/>
                <Card.Content>
                    {allDone ? (
                        <List.Item
                            title={`🎉 Congratulations. You are all done for ${isWeekly ? 'this week' : 'today'}.`}
                            titleStyle={{fontWeight: 'bold', textAlign: 'center'}}
                        />
                    ) : (
                        items.map(task => (
                            !taskStatus[task] && (
                                <List.Item
                                    key={task}
                                    onPress={() => setConfirmationTask(task)}
                                    title={() => (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="bookshelf" size={20} style={styles.icon} />
                                            <Text style={styles.itemTitle}>
                                                {task}
                                            </Text>
                                        </View>
                                    )}
                                    right={() => (
                                        <Checkbox
                                            status="unchecked"
                                            onPress={() => setConfirmationTask(task)}
                                        />
                                    )}
                                />
                            )
                        ))
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background}}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Home" />
            </Appbar.Header>

            <View style={styles.dailyBanner}>
                {dailyChecklistItems.every(task => taskStatus[task]) ? (
                    <List.Item
                        title="🎉 You're all done for today!"
                        titleStyle={{fontWeight: 'bold', textAlign: 'center'}}
                    />
                ) : (
                    <>
                        <Text style={styles.dailyTitle}>Daily Text</Text>
                        {dailyChecklistItems.map(task =>
                                !taskStatus[task] && (
                                    <Button
                                        key={task}
                                        onPress={() => setConfirmationTask(task)}
                                        icon={() => (
                                            <MaterialCommunityIcons
                                                name="calendar"
                                                size={20}
                                                style={styles.icon}
                                            />
                                        )}
                                        labelStyle={styles.dailyLinkText}
                                        style={styles.dailyLink}
                                    >
                                        {today.toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </Button>
                                )
                        )}
                    </>
                )}
            </View>

            <ScreenContainer onRefresh={onRefresh}>
                <Card style={styles.card}>
                    <Card.Title titleStyle={styles.cardTitle}  title={`Today's Reading: ${weekday}`}/>
                    <Card.Content>
                        {todayChapters.length === 0 || todayChapters.every(ch => readChapters.includes(ch)) ? (
                            <List.Item
                                title="🎉 Congratulations. You are all done for today."
                                titleStyle={{fontWeight: 'bold', textAlign: 'center'}}
                            />
                        ) : (
                            <FlatList
                                data={todayChapters}
                                keyExtractor={(item) => item}
                                renderItem={({item}) => (
                                    <List.Item
                                        key={item}
                                        title={() => (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <MaterialCommunityIcons name="book-open-variant"  size={20} style={styles.icon}/>
                                                <Text style = {styles.itemTitle}>
                                                    {item}
                                                </Text>
                                            </View>
                                        )}
                                        onPress={() => handleToggleChapter(item)}
                                        right={() => (
                                            <Checkbox
                                                status={readChapters.includes(item) ? 'checked' : 'unchecked'}
                                                onPress={() => handleToggleChapter(item)}
                                            />
                                        )}
                                        style={styles.listItem}
                                        titleStyle={styles.itemTitle}
                                    />
                                )}
                                ItemSeparatorComponent={() => <Divider/>}
                                scrollEnabled={false}
                            />
                        )}
                    </Card.Content>
                </Card>

                {renderChecklist(weeklyChecklistItems, `Week: ${weekRange}`, true)}
            </ScreenContainer>

            <Portal>
                <Modal
                    visible={!!confirmationTask}
                    onDismiss={() => setConfirmationTask(null)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Card style={styles.modalCard}>
                        <Card.Title
                            title={`Are you sure you completed ${confirmationTask}?`}
                            titleStyle={{textAlign: 'center'}}
                        />
                        <Card.Content>
                            <Button onPress={confirmTaskCompletion}>Yes, mark as done</Button>
                            <Button onPress={() => setConfirmationTask(null)}>Cancel</Button>
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>
        </View>
    );
}


