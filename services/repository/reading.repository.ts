// @ts-ignore
import {getDatabase} from './../db';

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

    async markAsUnread(chapter: string, date: Date) {
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

    async getReadingsForDate(date: Date) {
        const db = getDatabase();
        const dateStr = date.toISOString().split('T')[0];
        try {
            const result = await db.getAllAsync(
                `SELECT *
                 FROM readings
                 WHERE date = ?`,
                [dateStr]
            );

            console.log('✅ Readings fetched:', result);
            return result;
        } catch (err) {
            console.error('❌ DB error in getReadingsForDate:', err);
            return undefined;
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

        return {read: readChapters?.readChapters ?? 1, total: totalChapters?.totalChapters != 0 ? totalChapters.totalChapters : 1000};
    }

    async setTaskState(taskName: string, date: Date, done: boolean) {
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
        } catch (err) {
            console.error('❌ DB error in setTaskState:', err);
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

}


// Singleton instance:
export const readingRepo = new ReadingRepository();
