import React, {useCallback, useMemo} from 'react';
import {Text, useColorScheme, View} from 'react-native';
import {Appbar} from 'react-native-paper';
import {Href, useRouter} from 'expo-router';
import {LoadingScreen, ProgressTile, ScreenContainer, TileGrid} from '@/components';
import {useBibleBooks, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';
import type {BookProgress} from '@/models';
import {LAST_HEBREW_SCRIPTURES_BOOK_ID} from '@/constants/bible-books';

const BOOK_COLUMNS = 3;

/**
 * Bible overview: every book as a tile coloured by reading progress.
 * Tapping a book opens its chapters.
 */
export default function BibleScreen() {
    const t = useTranslation();
    const router = useRouter();
    const {books, loading, reload} = useBibleBooks();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    const {hebrewScriptures, greekScriptures, readVerses, totalVerses, completedBooks} = useMemo(() => ({
        hebrewScriptures: books.filter(entry => entry.book.id <= LAST_HEBREW_SCRIPTURES_BOOK_ID),
        greekScriptures: books.filter(entry => entry.book.id > LAST_HEBREW_SCRIPTURES_BOOK_ID),
        readVerses: books.reduce((sum, entry) => sum + entry.readVerses, 0),
        totalVerses: books.reduce((sum, entry) => sum + entry.totalVerses, 0),
        completedBooks: books.filter(entry => entry.totalVerses > 0 && entry.readVerses === entry.totalVerses).length,
    }), [books]);

    const openBook = useCallback((bookId: number) => {
        router.push(`/bible/${bookId}` as Href);
    }, [router]);

    if (loading) {
        return <LoadingScreen message={t('bible.loadingMessage')} styles={styles} customColors={customColors}/>;
    }

    const percentage = totalVerses > 0 ? (readVerses / totalVerses) * 100 : 0;

    const renderSection = (title: string, entries: BookProgress[]) => (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={{padding: 12}}>
                <TileGrid columns={BOOK_COLUMNS}>
                    {entries.map(entry => (
                        <ProgressTile
                            key={entry.book.id}
                            label={entry.name}
                            caption={`${entry.completedChapters}/${entry.totalChapters}`}
                            read={entry.readVerses}
                            total={entry.totalVerses}
                            onPress={() => openBook(entry.book.id)}
                            accessibilityLabel={`${entry.name}, ${entry.completedChapters}/${entry.totalChapters}`}
                            colors={customColors}
                        />
                    ))}
                </TileGrid>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content
                    title={t('bible.title')}
                    titleStyle={{color: customColors.color, fontWeight: '600'}}
                />
            </Appbar.Header>

            <ScreenContainer onRefresh={reload}>
                <View style={styles.card}>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>
                                {t('bible.overallProgress', {books: completedBooks, total: books.length})}
                            </Text>
                            <Text style={styles.progressValue}>{percentage.toFixed(1)}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {width: `${percentage}%`}]}/>
                        </View>
                    </View>
                </View>

                {renderSection(t('bible.hebrewScriptures'), hebrewScriptures)}
                {renderSection(t('bible.greekScriptures'), greekScriptures)}
            </ScreenContainer>
        </View>
    );
}
