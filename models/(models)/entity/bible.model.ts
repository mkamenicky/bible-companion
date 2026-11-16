/**
 * Bible structure and read-state models.
 * The Bible text itself is never needed by the app, only this metadata.
 */

/** A Bible book (1 = Genesis ... 66 = Revelation). */
export interface BibleBookInfo {
    readonly id: number;
    /** Long title from the database, e.g. "The Book of Genesis". */
    readonly displayTitle: string | null;
    readonly titleEnglish: string | null;
    readonly titleGerman: string | null;
    readonly titleJapanese: string | null;
    /** Verse ids are global and start at 0 (Genesis 1:1). */
    readonly firstVerseId: number;
    readonly lastVerseId: number;
}

export interface BibleChapterInfo {
    readonly id: number;
    readonly bookId: number;
    readonly chapterNumber: number;
    readonly firstVerseId: number;
    readonly lastVerseId: number;
    /** Entries in the chapter, including a psalm's superscription if any. */
    readonly verseCount: number;
}

/**
 * Where a "read" mark came from.
 *  - plan:     checked off in the daily reading plan
 *  - manual:   marked in the Bible overview as read today
 *  - backfill: marked in the Bible overview as read some time in the past;
 *              counts for overall progress but not for today, the streak or
 *              the calendar
 */
export type ProgressSource = 'plan' | 'manual' | 'backfill';

/** Reading progress of one book, for the book grid. */
export interface BookProgress {
    readonly book: BibleBookInfo;
    /** Short localized name, e.g. "Genesis" / "1. Mose" / "創世記". */
    readonly name: string;
    readonly totalVerses: number;
    readonly readVerses: number;
    readonly totalChapters: number;
    readonly completedChapters: number;
}

/** Reading progress of one chapter, for the chapter grid. */
export interface ChapterProgress {
    readonly chapter: BibleChapterInfo;
    readonly totalVerses: number;
    readonly readVerses: number;
}

/** One verse in the verse grid. */
export interface VerseState {
    readonly id: number;
    /** Verse number; 0 is the superscription of a psalm. */
    readonly number: number;
    readonly isRead: boolean;
}

/** Overall Bible reading totals. */
export interface BibleProgressSummary {
    readonly totalVerses: number;
    readonly readVerses: number;
    readonly totalChapters: number;
    readonly completedChapters: number;
    readonly totalBooks: number;
    readonly booksStarted: number;
    readonly booksCompleted: number;
}
