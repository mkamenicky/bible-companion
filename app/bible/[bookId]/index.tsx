import React, {useCallback} from 'react';
import {Alert, Text, useColorScheme, View} from 'react-native';
import {Appbar} from 'react-native-paper';
import {Href, useLocalSearchParams, useRouter} from 'expo-router';
import {LoadingScreen, MarkModeSwitch, ProgressTile, ScreenContainer, TileGrid} from '@/components';
import {useBibleBook, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';
import type {ChapterProgress} from '@/models';

const CHAPTER_COLUMNS = 5;

/**
 * Chapters of one book. Tap a chapter to see its verses; press and hold to
 * mark the whole chapter at once.
 */
export default function BibleBookScreen() {
    const t = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{ bookId: string }>();
    const bookId = Number(params.bookId);

    const {
        bookName, chapters, readVerses, totalVerses, loading,
        markMode, setMarkMode, setChapterRead, setBookRead,
    } = useBibleBook(bookId);

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    const openChapter = useCallback((chapterNumber: number) => {
        router.push(`/bible/${bookId}/${chapterNumber}` as Href);
    }, [router, bookId]);

    /** Long press: mark the chapter; if it is already complete, offer to clear it. */
    const toggleChapter = useCallback((entry: ChapterProgress) => {
        if (entry.readVerses < entry.totalVerses) {
            setChapterRead(entry.chapter, true);
            return;
        }

        Alert.alert(
            t('bible.clearChapterTitle', {book: bookName, chapter: entry.chapter.chapterNumber}),
            t('bible.clearMessage'),
            [
                {text: t('common.cancel'), style: 'cancel'},
                {text: t('bible.clear'), style: 'destructive', onPress: () => setChapterRead(entry.chapter, false)},
            ]
        );
    }, [bookName, setChapterRead, t]);

    const confirmMarkBook = useCallback(() => {
        Alert.alert(t('bible.markBookTitle', {book: bookName}), t(`bible.markMode.${markMode}Hint`), [
            {text: t('common.cancel'), style: 'cancel'},
            {text: t('bible.markAll'), onPress: () => setBookRead(true)},
        ]);
    }, [bookName, markMode, setBookRead, t]);

    const confirmClearBook = useCallback(() => {
        Alert.alert(t('bible.clearBookTitle', {book: bookName}), t('bible.clearMessage'), [
            {text: t('common.cancel'), style: 'cancel'},
            {text: t('bible.clear'), style: 'destructive', onPress: () => setBookRead(false)},
        ]);
    }, [bookName, setBookRead, t]);

    if (loading) {
        return <LoadingScreen message={t('bible.loadingMessage')} styles={styles} customColors={customColors}/>;
    }

    const completedChapters = chapters.filter(entry => entry.readVerses === entry.totalVerses).length;
    const percentage = totalVerses > 0 ? (readVerses / totalVerses) * 100 : 0;

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.BackAction onPress={() => router.back()} color={customColors.color}/>
                <Appbar.Content title={bookName} titleStyle={{color: customColors.color, fontWeight: '600'}}/>
                {readVerses > 0 && (
                    <Appbar.Action
                        icon="eraser"
                        color={customColors.color}
                        onPress={confirmClearBook}
                        accessibilityLabel={t('bible.clearBookTitle', {book: bookName})}
                    />
                )}
                {readVerses < totalVerses && (
                    <Appbar.Action
                        icon="check-all"
                        color={customColors.color}
                        onPress={confirmMarkBook}
                        accessibilityLabel={t('bible.markBookTitle', {book: bookName})}
                    />
                )}
            </Appbar.Header>

            <ScreenContainer padBottomInset>
                <View style={styles.card}>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>
                                {t('bible.chaptersRead', {read: completedChapters, total: chapters.length})}
                            </Text>
                            <Text style={styles.progressValue}>{percentage.toFixed(0)}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {width: `${percentage}%`}]}/>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={{padding: 12}}>
                        <TileGrid columns={CHAPTER_COLUMNS}>
                            {chapters.map(entry => (
                                <ProgressTile
                                    key={entry.chapter.id}
                                    square
                                    label={String(entry.chapter.chapterNumber)}
                                    read={entry.readVerses}
                                    total={entry.totalVerses}
                                    onPress={() => openChapter(entry.chapter.chapterNumber)}
                                    onLongPress={() => toggleChapter(entry)}
                                    accessibilityLabel={`${bookName} ${entry.chapter.chapterNumber}`}
                                    colors={customColors}
                                />
                            ))}
                        </TileGrid>
                        <Text style={[styles.sectionSubtitle, {marginTop: 12}]}>{t('bible.chapterHint')}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={{padding: 16}}>
                        <MarkModeSwitch mode={markMode} onChange={setMarkMode} colors={customColors}/>
                    </View>
                </View>
            </ScreenContainer>
        </View>
    );
}
