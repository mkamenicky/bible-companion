import React from 'react';
import {FlatList, View} from 'react-native';
import {Card, Checkbox, Divider, List, Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {ReadingPlan} from '@/models';

interface Props {
    readingPlan: ReadingPlan[];
    readChapters: ReadingPlan[];
    onToggle: (item: ReadingPlan) => void;
    title: string;
    styles: any;
}

export default function ReadingPlanCard({readingPlan, readChapters, onToggle, title, styles}: Props) {
    const isRead = (item: ReadingPlan) =>
        readChapters.some(read => read.bibleChapter.BibleChapterId === item.bibleChapter.BibleChapterId);

    return (
        <Card style={styles.card}>
            <Card.Title titleStyle={styles.cardTitle} title={title}/>
            <Card.Content>
                {readingPlan.length === 0 || readingPlan.every(isRead) ? (
                    <List.Item
                        title="🎉 Congratulations. You are all done for today."
                        titleStyle={{fontWeight: 'bold', textAlign: 'center'}}
                    />
                ) : (
                    <FlatList
                        data={readingPlan}
                        keyExtractor={(item) => item.bibleChapter.BibleChapterId.toString()}
                        renderItem={({item}) => (
                            <List.Item
                                title={() => (
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <MaterialCommunityIcons name="book-open-variant" size={20} style={styles.icon}/>
                                        <Text style={styles.itemTitle}>
                                            {item.bibleBook.BookDisplayTitle} {item.bibleChapter.ChapterNumber}:{item.bibleChapter.FirstVerseId}-{item.bibleChapter.LastVerseId}
                                        </Text>
                                    </View>
                                )}
                                onPress={() => onToggle(item)}
                                right={() => (
                                    <Checkbox
                                        status={isRead(item) ? 'checked' : 'unchecked'}
                                        onPress={() => onToggle(item)}
                                    />
                                )}
                                style={styles.listItem}
                            />
                        )}
                        ItemSeparatorComponent={() => <Divider/>}
                        scrollEnabled={false}
                    />
                )}
            </Card.Content>
        </Card>
    );
}
