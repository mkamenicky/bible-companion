import React from 'react';
import { View } from 'react-native';
import { Card, Checkbox, List, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
    items: string[];
    title: string;
    taskStatus: Record<string, boolean>;
    onConfirm: (task: string) => void;
    styles: any;
}

export default function WeeklyChecklistCard({ items, title, taskStatus, onConfirm, styles }: Props) {
    const allDone = items.every(task => taskStatus[task]);

    return (
        <Card style={styles.card}>
            <Card.Title titleStyle={styles.cardTitle} title={title} />
            <Card.Content>
                {allDone ? (
                    <List.Item
                        title={`🎉 Congratulations. You are all done for this week`}
                        titleStyle={{ fontWeight: 'bold', textAlign: 'center' }}
                    />
                ) : (
                    items.map(task => (
                        !taskStatus[task] && (
                            <List.Item
                                key={task}
                                onPress={() => onConfirm(task)}
                                title={() => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="bookshelf" size={20} style={styles.icon} />
                                        <Text style={styles.itemTitle}>{task}</Text>
                                    </View>
                                )}
                                right={() => (
                                    <Checkbox
                                        status="unchecked"
                                        onPress={() => onConfirm(task)}
                                    />
                                )}
                            />
                        )
                    ))
                )}
            </Card.Content>
        </Card>
    );
}
