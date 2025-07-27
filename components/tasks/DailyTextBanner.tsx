// src/screens/HomeScreen/components/DailyTextBanner.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { Button, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
    today: Date;
    dailyChecklistItems: string[];
    taskStatus: Record<string, boolean>;
    onConfirm: (task: string) => void;
    styles: any;
}

export default function DailyTextBanner({ today, dailyChecklistItems, taskStatus, onConfirm, styles }: Props) {
    const allDone = dailyChecklistItems.every(task => taskStatus[task]);

    return (
        <View style={styles.dailyBanner}>
            {allDone ? (
                <List.Item
                    title="🎉 You're all done for today!"
                    titleStyle={{ fontWeight: 'bold', textAlign: 'center' }}
                />
            ) : (
                <>
                    <Text style={styles.dailyTitle}>Daily Text</Text>
                    {dailyChecklistItems.map(task =>
                            !taskStatus[task] && (
                                <Button
                                    key={task}
                                    onPress={() => onConfirm(task)}
                                    icon={() => (
                                        <MaterialCommunityIcons name="calendar" size={20} style={styles.icon} />
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
    );
}
