import {getDatabase} from '@/services/(services)/database/Database';
import {DatabaseError} from '@/errors';
import type {BibleBookInfo, BibleChapterInfo} from '@/models';

/**
 * Read-only access to the Bible structure (books, chapters, verse labels).
 *
 * Only the small metadata columns are selected. The chapter and verse tables
 * also hold the full text; loading that for every lookup (as `SELECT *` did)
 * moves several megabytes per call.
 */
export class BibleRepository {
    async findBooks(): Promise<BibleBookInfo[]> {
        const rows = await this.query<any>(
            `SELECT BibleBookId, BookDisplayTitle, ChapterDisplayTitle, ChapterDisplayTitleGerman,
                    ChapterDisplayTitleJapanese, FirstVerseId, LastVerseId
             FROM BibleBook
             ORDER BY BibleBookId`
        );
        return rows.map(row => ({
            id: row.BibleBookId,
            displayTitle: row.BookDisplayTitle ?? null,
            titleEnglish: row.ChapterDisplayTitle ?? null,
            titleGerman: row.ChapterDisplayTitleGerman ?? null,
            titleJapanese: row.ChapterDisplayTitleJapanese ?? null,
            firstVerseId: row.FirstVerseId,
            lastVerseId: row.LastVerseId,
        }));
    }

    async findChapters(): Promise<BibleChapterInfo[]> {
        const rows = await this.query<any>(
            `SELECT BibleChapterId, BookNumber, ChapterNumber, FirstVerseId, LastVerseId
             FROM BibleChapter
             WHERE FirstVerseId IS NOT NULL AND LastVerseId IS NOT NULL
             ORDER BY BookNumber, ChapterNumber`
        );
        return rows.map(row => ({
            id: row.BibleChapterId,
            bookId: row.BookNumber,
            chapterNumber: row.ChapterNumber,
            firstVerseId: row.FirstVerseId,
            lastVerseId: row.LastVerseId,
            verseCount: row.LastVerseId - row.FirstVerseId + 1,
        }));
    }

    /** Raw verse labels (small HTML snippets such as `<span class="vl">2</span>`). */
    async findVerseLabels(firstVerseId: number, lastVerseId: number): Promise<Array<{ id: number; label: string }>> {
        const rows = await this.query<{ BibleVerseId: number; Label: string | null }>(
            `SELECT BibleVerseId, Label
             FROM BibleVerse
             WHERE BibleVerseId BETWEEN ? AND ?
             ORDER BY BibleVerseId`,
            [firstVerseId, lastVerseId]
        );
        return rows.map(row => ({id: row.BibleVerseId, label: row.Label ?? ''}));
    }

    private async query<Row>(sql: string, params: number[] = []): Promise<Row[]> {
        try {
            return await getDatabase().getAllAsync<Row>(sql, params);
        } catch (error) {
            throw new DatabaseError('Failed to read Bible structure', error);
        }
    }
}

export const bibleRepository = new BibleRepository();
