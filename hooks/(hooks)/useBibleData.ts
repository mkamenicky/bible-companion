import {useCallback, useEffect, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {bibleService, progressService} from '@/services';
import type {BibleChapterInfo, BookProgress, ChapterProgress, ProgressSource, VerseState} from '@/models';
import {useAchievementContext} from '@/components/progress/AchievementContext';
import {logger} from '@/utils/(utils)/logger';

/**
 * How verses marked in the Bible overview are recorded:
 *  - 'backfill': "I read this some time ago" - counts for Bible progress only
 *  - 'manual':   "I read this today" - also counts for today's goal and streak
 */
export type MarkMode = Extract<ProgressSource, 'backfill' | 'manual'>;

const MARK_MODE_KEY = '@bible_mark_mode';

// The mode is shared by all Bible screens, so it lives outside the hooks.
let currentMarkMode: MarkMode = 'backfill';
let markModeLoaded = false;
const markModeListeners = new Set<(mode: MarkMode) => void>();

/** The mark mode, shared between screens and remembered across app starts. */
export function useMarkMode(): [MarkMode, (mode: MarkMode) => void] {
    const [mode, setMode] = useState<MarkMode>(currentMarkMode);

    useEffect(() => {
        markModeListeners.add(setMode);

        if (!markModeLoaded) {
            markModeLoaded = true;
            AsyncStorage.getItem(MARK_MODE_KEY)
                .then(stored => {
                    if (stored === 'manual' || stored === 'backfill') {
                        currentMarkMode = stored;
                        markModeListeners.forEach(listener => listener(stored));
                    }
                })
                .catch(error => logger.warn('Failed to load mark mode', error));
        } else {
            setMode(currentMarkMode);
        }

        return () => {
            markModeListeners.delete(setMode);
        };
    }, []);

    const update = useCallback((next: MarkMode) => {
        currentMarkMode = next;
        markModeListeners.forEach(listener => listener(next));
        AsyncStorage.setItem(MARK_MODE_KEY, next).catch(error => logger.warn('Failed to save mark mode', error));
    }, []);

    return [mode, update];
}

/**
 * Returns a function that marks or unmarks a verse range and shows any
 * achievements this unlocks.
 */
function useSetRangeRead(markMode: MarkMode) {
    const {addAchievementEvents} = useAchievementContext();

    return useCallback(async (firstVerseId: number, lastVerseId: number, read: boolean): Promise<void> => {
        if (read) {
            const unlockedEvents = await progressService.markVersesRead(firstVerseId, lastVerseId, markMode);
            if (unlockedEvents.length > 0) addAchievementEvents(unlockedEvents);
        } else {
            await progressService.unmarkVerses(firstVerseId, lastVerseId);
        }
    }, [markMode, addAchievementEvents]);
}

/** All books with their reading progress, for the book grid. */
export function useBibleBooks() {
    const [books, setBooks] = useState<BookProgress[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        try {
            setBooks(await progressService.getBooksProgress());
        } catch (error) {
            logger.error('Error loading Bible books', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        reload();
    }, [reload]));

    return {books, loading, reload};
}

/** One book with the reading progress of its chapters. */
export function useBibleBook(bookId: number) {
    const [markMode, setMarkMode] = useMarkMode();
    const setRangeRead = useSetRangeRead(markMode);

    const [bookName, setBookName] = useState('');
    const [chapters, setChapters] = useState<ChapterProgress[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        try {
            const structure = await bibleService.getStructure();
            const book = structure.booksById.get(bookId);
            setBookName(book ? bibleService.getBookName(book) : '');
            setChapters(await progressService.getChaptersProgress(bookId));
        } catch (error) {
            logger.error('Error loading Bible book', error);
        } finally {
            setLoading(false);
        }
    }, [bookId]);

    useFocusEffect(useCallback(() => {
        reload();
    }, [reload]));

    /** Marks a whole chapter as read or unread. */
    const setChapterRead = useCallback(async (chapter: BibleChapterInfo, read: boolean) => {
        // Show the result right away; the reload below confirms it.
        setChapters(previous => previous.map(entry => entry.chapter.id === chapter.id
            ? {...entry, readVerses: read ? entry.totalVerses : 0}
            : entry));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

        try {
            await setRangeRead(chapter.firstVerseId, chapter.lastVerseId, read);
        } catch (error) {
            logger.error('Error marking chapter', error);
        }
        await reload();
    }, [setRangeRead, reload]);

    /** Marks the whole book as read or unread. */
    const setBookRead = useCallback(async (read: boolean) => {
        if (chapters.length === 0) return;

        try {
            await setRangeRead(chapters[0].chapter.firstVerseId, chapters[chapters.length - 1].chapter.lastVerseId, read);
        } catch (error) {
            logger.error('Error marking book', error);
        }
        await reload();
    }, [chapters, setRangeRead, reload]);

    const totalVerses = chapters.reduce((sum, entry) => sum + entry.totalVerses, 0);
    const readVerses = chapters.reduce((sum, entry) => sum + entry.readVerses, 0);

    return {
        bookName,
        chapters,
        totalVerses,
        readVerses,
        loading,
        markMode,
        setMarkMode,
        setChapterRead,
        setBookRead,
    };
}

/** One chapter with the read-state of its verses. */
export function useBibleChapter(bookId: number, chapterNumber: number) {
    const [markMode, setMarkMode] = useMarkMode();
    const setRangeRead = useSetRangeRead(markMode);

    const [bookName, setBookName] = useState('');
    const [chapter, setChapter] = useState<BibleChapterInfo | null>(null);
    const [chapterCount, setChapterCount] = useState(0);
    const [verses, setVerses] = useState<VerseState[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        try {
            const structure = await bibleService.getStructure();
            const book = structure.booksById.get(bookId);
            const bookChapters = structure.chaptersByBook.get(bookId) ?? [];
            const found = bookChapters.find(entry => entry.chapterNumber === chapterNumber) ?? null;

            setBookName(book ? bibleService.getBookName(book) : '');
            setChapterCount(bookChapters.length);
            setChapter(found);
            setVerses(found ? await progressService.getVerseStates(found) : []);
        } catch (error) {
            logger.error('Error loading Bible chapter', error);
        } finally {
            setLoading(false);
        }
    }, [bookId, chapterNumber]);

    useFocusEffect(useCallback(() => {
        reload();
    }, [reload]));

    /** Flips the read-state of a single verse. */
    const toggleVerse = useCallback(async (verse: VerseState) => {
        const read = !verse.isRead;
        setVerses(previous => previous.map(entry => entry.id === verse.id ? {...entry, isRead: read} : entry));

        try {
            await setRangeRead(verse.id, verse.id, read);
        } catch (error) {
            logger.error('Error marking verse', error);
            await reload();
        }
    }, [setRangeRead, reload]);

    /** Marks every verse of the chapter as read or unread. */
    const setAllRead = useCallback(async (read: boolean) => {
        if (!chapter) return;
        setVerses(previous => previous.map(entry => ({...entry, isRead: read})));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

        try {
            await setRangeRead(chapter.firstVerseId, chapter.lastVerseId, read);
        } catch (error) {
            logger.error('Error marking chapter', error);
            await reload();
        }
    }, [chapter, setRangeRead, reload]);

    return {
        bookName,
        chapter,
        chapterCount,
        verses,
        readCount: verses.filter(verse => verse.isRead).length,
        loading,
        markMode,
        setMarkMode,
        toggleVerse,
        setAllRead,
    };
}
