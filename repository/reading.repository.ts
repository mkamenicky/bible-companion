// @ts-ignore
import {getDatabase} from '@/services/database/db';

export class ReadingRepository {
    async markAsRead(chapter: string, date: Date, planName = 'DefaultPlan') {
        const db = getDatabase();
        const dateStr = date.toISOString().split('T')[0];
        try {
            await db.runAsync(
                `INSERT INTO readings (date, chapter, verse_count, is_read, plan_name)
                 VALUES (?, ?, ?, ?, ?)`,
                [dateStr, chapter, 0, 1, planName]
            );
            console.log('✅ Marked as read');
        } catch (err) {
            console.error('❌ DB error in markAsRead:', err);
        }
    }

    async markAsUnread(chapter: { BibleBookId: number; BookDisplayTitle: string; }, date: Date) {
        const db = getDatabase();
        const dateStr = date.toISOString().split('T')[0];
        try {
            await db.runAsync(
                `DELETE
                 FROM readings
                 WHERE date = ?
                   AND chapter = ?`,
                [dateStr, chapter]
            );
            console.log('✅ Marked as unread');
        } catch (err) {
            console.error('❌ DB error in markAsUnread:', err);
        }
    }

    async getReadChaptersForDate(date: Date): Promise<string[]> {
        const db = getDatabase();
        const dateStr = date.toISOString().split('T')[0];
        try {
            const result = await db.getAllAsync<{ chapter: string }>(
                `SELECT chapter
                 FROM readings
                 WHERE date = ?`,
                [dateStr]
            );

            console.log('✅ Read Chapters for day fetched:', result);
            return result.map((row: { chapter: any; }) => row.chapter);
        } catch (err) {
            console.error('❌ DB error in getReadChaptersForDate:', err);
            return [];
        }
    }

    getMondayOfCurrentWeek(date: Date): string {
        const day = date.getDay();
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((day + 6) % 7)); // Adjust to Monday
        return monday.toISOString().split('T')[0];
    }

    async getProgressSummary() {
        const db = getDatabase();

        const readChapters = await db.getFirstAsync(
            `SELECT COUNT(*) as readChapters
             FROM readings`
        );

        const totalChapters = await db.getFirstAsync(
            `SELECT COUNT(*) as totalChapters
             FROM BibleChapter`
        );

        return {
            read: readChapters?.readChapters ?? 1,
            total: totalChapters?.totalChapters != 0 ? totalChapters.totalChapters : 1000
        };
    }

    async setTaskState(taskName: string, date: Date, done: boolean): Promise<boolean> {
        const db = getDatabase();
        const dateStr = date.toISOString().split('T')[0];

        console.log(`🔄 Setting task state for "${taskName}" to ${done} on ${dateStr}`);

        try {
            const result = await db.runAsync(
                `INSERT INTO tasks (date, task_name, is_done)
                 VALUES (?, ?, ?)
                 ON CONFLICT(date, task_name) DO UPDATE SET is_done = excluded.is_done`,
                [dateStr, taskName, done ? 1 : 0]
            );

            console.log('✅ Task state saved:', result);
            return true;
        } catch (err) {
            console.error('❌ DB error in setTaskState:', err);
            return false;
        }
    }

    async getWeeklyTaskStates(date: Date, weeklyTasks: string[]): Promise<Record<string, boolean>> {
        const db = getDatabase();
        const mondayStr = this.getMondayOfCurrentWeek(date);
        try {
            const rows = await db.getAllAsync<{ task_name: string; is_done: number }>(
                `SELECT task_name, is_done
                 FROM tasks
                 WHERE date >= ?`,
                [mondayStr]
            );

            const result: Record<string, boolean> = {};
            for (const task of weeklyTasks) {
                const match = rows.find((r: { task_name: string; is_done: any; }) => r.task_name === task && r.is_done);
                result[task] = !!match;
            }

            console.log('✅ Weekly Taskstates fetched:', result);
            return result;
        } catch (err) {
            console.error('❌ DB error in getWeeklyTaskStates:', err);
            return Promise.reject(err) as any as Record<string, boolean>;
        }
    }

    async getDailyTaskStates(date: Date, dailyTasks: string[]): Promise<Record<string, boolean>> {
        const db = getDatabase();
        const dateStr = date.toISOString().split('T')[0];
        try {
            const placeholders = dailyTasks.map(() => '?').join(', ');
            const rows = await db.getAllAsync<{ task_name: string; is_done: number }>(
                `SELECT task_name, is_done
                 FROM tasks
                 WHERE date = ?
                   AND task_name IN (${placeholders})`,
                [dateStr, ...dailyTasks]
            );

            const result: Record<string, boolean> = {};
            for (const task of dailyTasks) {
                const match = rows.find((r: { task_name: string; is_done: any; }) => r.task_name === task && r.is_done);
                result[task] = !!match;
            }

            console.log('✅ Daily Taskstates fetched:', result);
            return result;
        } catch (err) {
            console.error('❌ DB error in getDailyTaskStates:', err);
            return Promise.reject(err) as any as Record<string, boolean>;
        }
    }

    async markVerseAsRead(bibleVerseId: number, date: Date = new Date()) {
        const db = getDatabase();
        const dateStr = date.toISOString().split('T')[0];
        try {
            await db.runAsync(
                `INSERT INTO BibleVerseProgress(bibleVerseId, dateRead, isRead)
                 VALUES (?, ?, 1)
                 ON CONFLICT(bibleVerseId, dateRead) DO UPDATE SET isRead   = 1,
                                                         dateRead = excluded.dateRead`,
                [bibleVerseId, dateStr]
            );
            console.log(`✅ Verse ${bibleVerseId} marked as read on ${dateStr}`);
        } catch (err) {
            console.error('❌ DB error in markVerseAsRead:', err);
        }
    }

    async unmarkVerseAsRead(bibleVerseId: number) {
        const db = getDatabase();
        try {
            await db.runAsync(
                `DELETE
                 FROM BibleVerseProgress
                 WHERE bibleVerseId = ?`,
                [bibleVerseId]
            );
            console.log(`✅ Verse ${bibleVerseId} unmarked`);
        } catch (err) {
            console.error('❌ DB error in unmarkVerseAsRead:', err);
        }
    }

    async getReadVersesForChapter(chapterId: number): Promise<number[]> {
        const db = getDatabase();
        try {
            const chapter = await db.getFirstAsync<{ FirstVerseId: number, LastVerseId: number }>(
                `SELECT FirstVerseId, LastVerseId
                 FROM BibleChapter
                 WHERE BibleChapterId = ?`,
                [chapterId]
            );

            if (!chapter) return [];

            const result = await db.getAllAsync<{ verseId: number }>(
                `SELECT vp.bibleVerseId
                 FROM BibleVerseProgress vp
                 WHERE vp.bibleVerseId BETWEEN ? AND ?
                   AND vp.isRead = 1`,
                [chapter.FirstVerseId, chapter.LastVerseId]
            );

            return result.map((row: { verseId: any; }) => row.verseId);
        } catch (err) {
            console.error('❌ DB error in getReadVersesForChapter:', err);
            return [];
        }
    }

    async getAllBibleBooks() {
        const db = getDatabase();

        return await db.getFirstAsync(
            `SELECT *
             FROM BibleBook`
        );
    }

    async getProgressForBook(bookId: number) {
        const db = getDatabase();

        // Step 1: Get all chapters in book
        const chapters = await db.getAllAsync<{ FirstVerseId: number, LastVerseId: number }>(
            `SELECT FirstVerseId, LastVerseId
             FROM BibleChapter
             WHERE BibleChapterId = ?`,
            [bookId]
        );

        if (!chapters || chapters.length === 0) return {total: 0, read: 0};

        let totalVerses = 0;
        let readVerses = 0;

        for (const {FirstVerseId, LastVerseId} of chapters) {
            const count = LastVerseId - FirstVerseId + 1;
            totalVerses += count;

            const read = await db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count
                 FROM BibleVerseProgress
                 WHERE isRead = 1
                   AND bibleVerseId BETWEEN ? AND ?`,
                [FirstVerseId, LastVerseId]
            );
            readVerses += read?.count ?? 0;
        }

        return {total: totalVerses, read: readVerses};
    }

    async getReadingPlan(): Promise<ReadingPlan[]> {
        console.log('🔄 Getting reading plan');
        const db = getDatabase();
        try {

            const book: BibleBook = await db.getFirstAsync(
                `SELECT *
                 FROM BibleBook
                 where BibleBookId = 1`
            );

            const chapter: BibleChapter = await db.getFirstAsync(
                `SELECT *
                 FROM BibleChapter
                 WHERE BookNumber = ?`,
                [book.BibleBookId]
            );

            const verses: BibleVerse[] = await db.getAllAsync(
                `SELECT *
                 FROM BibleVerse
                 WHERE BibleVerse.BibleVerseId BETWEEN ? AND ?`,
                [chapter.FirstVerseId, chapter.LastVerseId]
            );

            return [{bibleBook: book, bibleChapter: chapter, bibleVerses: verses}];
        } catch (err) {
            console.error('❌ DB error in getReadingPlan:', err);
        }

        return [{
            bibleBook: new BibleBook,
            bibleChapter: new BibleChapter,
            bibleVerses: []
        }];
    }
}


// Singleton instance:
export const readingRepo = new ReadingRepository();

export class BibleBook {
    BibleBookId!: number;
    BookDocumentId?: number;
    IntroDocumentId?: number;
    OverviewDocumentId?: number;
    OutlineDocumentId?: number;
    Profile?: Uint8Array; // BLOB is best represented as Uint8Array
    BookDisplayTitle?: string;
    BookDisplayTitleRich?: string;
    ChapterDisplayTitle?: string;
    ChapterDisplayTitleRich?: string;
    PublicationId?: number;
    FirstVerseId?: number;
    LastVerseId?: number;
    HasCommentary?: boolean;
}

export class BibleChapter {
    BibleChapterId!: number;
    BookNumber?: number;
    ChapterNumber?: number;
    Content?: Uint8Array;            // BLOB
    PreContent?: Uint8Array;         // BLOB
    PostContent?: Uint8Array;        // BLOB
    FirstVerseId?: number;
    LastVerseId?: number;
    FirstFootnoteId?: number;
    LastFootnoteId?: number;
    FirstBibleCitationId?: number;
    LastBibleCitationId?: number;
    FirstParagraphOrdinal?: number;
    LastParagraphOrdinal?: number;
    DecodedContent?: string;
}

export class BibleVerse {
    BibleVerseId!: number;
    Label!: string;
    Content!: Uint8Array | null;
    AdjustmentInfo!: Uint8Array | null;
    BeginParagraphOrdinal!: number | null;
    EndParagraphOrdinal!: number | null;
    DecodedContent!: string | null;
}

export class ReadingPlan {
    bibleBook!: BibleBook;
    bibleChapter!: BibleChapter;
    bibleVerses!: BibleVerse[];

}
