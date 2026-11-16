import React from 'react';
import {Text, TouchableOpacity, useColorScheme, View} from 'react-native';
import {Appbar} from 'react-native-paper';
import {Href, useLocalSearchParams, useRouter} from 'expo-router';
import {LoadingScreen, MarkModeSwitch, ProgressTile, ScreenContainer, TileGrid} from '@/components';
import {useBibleChapter, useTranslation} from '@/hooks';
import {ThemeService} from '@/services';

const VERSE_COLUMNS = 6;

/**
 * Verses of one chapter. Tap a verse to mark or unmark it.
 */
export default function BibleChapterScreen() {
    const t = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{ bookId: string; chapter: string }>();
    const bookId = Number(params.bookId);
    const chapterNumber = Number(params.chapter);

    const {
        bookName, chapter, chapterCount, verses, readCount, loading,
        markMode, setMarkMode, toggleVerse, setAllRead,
    } = useBibleChapter(bookId, chapterNumber);

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    if (loading) {
        return <LoadingScreen message={t('bible.loadingMessage')} styles={styles} customColors={customColors}/>;
    }

    const title = `${bookName} ${chapterNumber}`;
    const percentage = verses.length > 0 ? (readCount / verses.length) * 100 : 0;
    const goToChapter = (target: number) => router.replace(`/bible/${bookId}/${target}` as Href);

    const renderNeighbour = (target: number, label: string) => {
        const exists = target >= 1 && target <= chapterCount;
        return (
            <TouchableOpacity
                style={{flex: 1, paddingVertical: 14, alignItems: 'center', opacity: exists ? 1 : 0}}
                disabled={!exists}
                onPress={() => goToChapter(target)}
            >
                <Text style={{color: customColors.primary, fontWeight: '600'}}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.BackAction onPress={() => router.back()} color={customColors.color}/>
                <Appbar.Content title={title} titleStyle={{color: customColors.color, fontWeight: '600'}}/>
                {readCount > 0 && (
                    <Appbar.Action
                        icon="eraser"
                        color={customColors.color}
                        onPress={() => setAllRead(false)}
                        accessibilityLabel={t('bible.clear')}
                    />
                )}
                {readCount < verses.length && (
                    <Appbar.Action
                        icon="check-all"
                        color={customColors.color}
                        onPress={() => setAllRead(true)}
                        accessibilityLabel={t('bible.markAll')}
                    />
                )}
            </Appbar.Header>

            <ScreenContainer padBottomInset>
                {!chapter ? (
                    <View style={styles.card}>
                        <Text style={[styles.sectionSubtitle, {padding: 20}]}>{t('bible.chapterNotFound')}</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.card}>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressLabel}>
                                        {t('bible.versesRead', {read: readCount, total: verses.length})}
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
                                <TileGrid columns={VERSE_COLUMNS}>
                                    {verses.map(verse => (
                                        <ProgressTile
                                            key={verse.id}
                                            square
                                            // Number 0 is the superscription of a psalm.
                                            label={verse.number > 0 ? String(verse.number) : t('bible.superscriptionShort')}
                                            read={verse.isRead ? 1 : 0}
                                            total={1}
                                            onPress={() => toggleVerse(verse)}
                                            accessibilityLabel={verse.number > 0
                                                ? `${title}:${verse.number}`
                                                : `${title}, ${t('bible.superscription')}`}
                                            colors={customColors}
                                        />
                                    ))}
                                </TileGrid>
                                <Text style={[styles.sectionSubtitle, {marginTop: 12}]}>{t('bible.verseHint')}</Text>
                            </View>

                            <View style={{flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: customColors.borderColor}}>
                                {renderNeighbour(chapterNumber - 1, `‹ ${bookName} ${chapterNumber - 1}`)}
                                {renderNeighbour(chapterNumber + 1, `${bookName} ${chapterNumber + 1} ›`)}
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={{padding: 16}}>
                                <MarkModeSwitch mode={markMode} onChange={setMarkMode} colors={customColors}/>
                            </View>
                        </View>
                    </>
                )}
            </ScreenContainer>
        </View>
    );
}
