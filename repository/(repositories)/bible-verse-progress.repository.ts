import {getDatabase} from '@/services/(services)/database/Database';
import {DatabaseError} from '@/errors';
import type {ProgressSource} from '@/models';

/**
 * A "read" mark that should not count as reading done on its date
 * (verses marked in the Bible overview as "already read earlier").
 */
const BACKFILL: ProgressSource = 'backfill';

/**
 * Read-state of verses (table BibleVerseProgress).
 *
 * One row means "verse X was read on day Y". A verse can have several rows
 * (read again on another day), so totals always count DISTINCT verses.
 * All work is done in SQL; nothing here loads the whole table into memory
 * except findReadVerseIds, which returns plain numbers only.
 */
export class BibleVerseProgressRepository {
    /** Ids of all verses read at least once, optionally limited to a range. */
    async findReadVerseIds(firstVerseId?: number, lastVerseId?: number): Promise<number[]> {
        const hasRange = firstVerseId !== undefined && lastVerseId !== undefined;
        const rows = await this.all<{ bibleVerseId: number }>(
            `SELECT DISTINCT bibleVerseId
             FROM BibleVerseProgress
             WHERE isRead = 1 ${hasRange ? 'AND bibleVerseId BETWEEN ? AND ?' : ''}
             ORDER BY bibleVerseId`,
            hasRange ? [firstVerseId, lastVerseId] : []
        );
        return rows.map(row => row.bibleVerseId);
    }

    /**
     * Marks every verse in the range as read on `date`.
     *
     * @param onlyUnread true: verses that are already read (on any day) are
     *                   left untouched; false: each verse gets a mark for
     *                   `date` even if it was read before (a re-read).
     * @returns number of rows written
     */
    async markRange(firstVerseId: number, lastVerseId: number, date: string, source: ProgressSource, onlyUnread: boolean): Promise<number> {
        return this.transaction(async () => {
            let changes = 0;

            if (!onlyUnread) {
                // A row for this day may already exist (e.g. a backfill mark made
                // today); turn it into a real reading of today.
                changes += await this.run(
                    `UPDATE BibleVerseProgress
                     SET isRead = 1, source = ?
                     WHERE dateRead = ? AND bibleVerseId BETWEEN ? AND ? AND (isRead = 0 OR source <> ?)`,
                    [source, date, firstVerseId, lastVerseId, source]
                );
            }

            changes += await this.run(
                `INSERT OR IGNORE INTO BibleVerseProgress (bibleVerseId, dateRead, isRead, source)
                 SELECT v.BibleVerseId, ?, 1, ?
                 FROM BibleVerse v
                 WHERE v.BibleVerseId BETWEEN ? AND ?
                   ${onlyUnread ? `AND NOT EXISTS (SELECT 1 FROM BibleVerseProgress p
                                                    WHERE p.bibleVerseId = v.BibleVerseId AND p.isRead = 1)` : ''}`,
                [date, source, firstVerseId, lastVerseId]
            );

            return changes;
        });
    }

    /** Removes every read mark of the verses in the range (they become unread). */
    async deleteRange(firstVerseId: number, lastVerseId: number): Promise<number> {
        return this.run(
            'DELETE FROM BibleVerseProgress WHERE bibleVerseId BETWEEN ? AND ?',
            [firstVerseId, lastVerseId]
        );
    }

    /** Removes only the marks made on one day (undo of a daily assignment). */
    async deleteRangeOnDate(firstVerseId: number, lastVerseId: number, date: string): Promise<number> {
        return this.run(
            'DELETE FROM BibleVerseProgress WHERE dateRead = ? AND bibleVerseId BETWEEN ? AND ?',
            [date, firstVerseId, lastVerseId]
        );
    }

    /** Number of different verses read at least once. */
    async countDistinctRead(): Promise<number> {
        const row = await this.first<{ count: number }>(
            'SELECT COUNT(DISTINCT bibleVerseId) AS count FROM BibleVerseProgress WHERE isRead = 1'
        );
        return row?.count ?? 0;
    }

    /** Verses read between two days (inclusive, YYYY-MM-DD), ignoring backfill marks. */
    async countReadBetween(fromDate: string, toDate: string): Promise<number> {
        const row = await this.first<{ count: number }>(
            `SELECT COUNT(*) AS count
             FROM BibleVerseProgress
             WHERE isRead = 1 AND source <> ? AND dateRead BETWEEN ? AND ?`,
            [BACKFILL, fromDate, toDate]
        );
        return row?.count ?? 0;
    }

    /** Verses read per day, ignoring backfill marks. Sorted by day. */
    async findDailyCounts(fromDate?: string, toDate?: string): Promise<Array<{ date: string; count: number }>> {
        const hasRange = fromDate !== undefined && toDate !== undefined;
        return this.all<{ date: string; count: number }>(
            `SELECT dateRead AS date, COUNT(*) AS count
             FROM BibleVerseProgress
             WHERE isRead = 1 AND source <> ? ${hasRange ? 'AND dateRead BETWEEN ? AND ?' : ''}
             GROUP BY dateRead
             ORDER BY dateRead`,
            hasRange ? [BACKFILL, fromDate, toDate] : [BACKFILL]
        );
    }

    private async all<Row>(sql: string, params: Array<string | number | undefined> = []): Promise<Row[]> {
        try {
            return await getDatabase().getAllAsync<Row>(sql, params as Array<string | number>);
        } catch (error) {
            throw new DatabaseError('Failed to read verse progress', error);
        }
    }

    private async first<Row>(sql: string, params: Array<string | number> = []): Promise<Row | null> {
        try {
            return await getDatabase().getFirstAsync<Row>(sql, params);
        } catch (error) {
            throw new DatabaseError('Failed to read verse progress', error);
        }
    }

    private async run(sql: string, params: Array<string | number>): Promise<number> {
        try {
            return (await getDatabase().runAsync(sql, params)).changes;
        } catch (error) {
            throw new DatabaseError('Failed to update verse progress', error);
        }
    }

    private async transaction<Result>(work: () => Promise<Result>): Promise<Result> {
        let result!: Result;
        try {
            await getDatabase().withTransactionAsync(async () => {
                result = await work();
            });
        } catch (error) {
            throw error instanceof DatabaseError ? error : new DatabaseError('Failed to update verse progress', error);
        }
        return result;
    }
}

export const bibleVerseProgressRepository = new BibleVerseProgressRepository();
