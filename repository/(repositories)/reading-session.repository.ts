import { BaseRepository } from '@/repository/base/base.repository';
import type {
    ReadingSessionModel,
    CreateReadingSessionDto,
    UpdateReadingSessionDto
} from '@/models';
import {ValidationError} from "@/errors";

/**
 * Repository class for managing ReadingSession entities
 */
export class ReadingSessionRepository extends BaseRepository<ReadingSessionModel, CreateReadingSessionDto, UpdateReadingSessionDto> {
    protected tableName = 'reading_sessions';
    protected primaryKeyColumn = 'id';

    /**
     * Validates ReadingSession input
     */
    private validateInput(session: Partial<CreateReadingSessionDto | UpdateReadingSessionDto>): void {
        if (session.date !== undefined) {
            this.validateString(session.date, 'date');
        }
        if (session.startTime !== undefined) {
            this.validateString(session.startTime, 'startTime');
        }
        if (session.versesRead !== undefined && (typeof session.versesRead !== 'number' || session.versesRead < 0)) {
            throw new ValidationError('versesRead must be a non-negative number');
        }
        if (session.chaptersRead !== undefined && (typeof session.chaptersRead !== 'number' || session.chaptersRead < 0)) {
            throw new ValidationError('chaptersRead must be a non-negative number');
        }
    }

    protected mapRowToEntity(row: any): ReadingSessionModel {
        return {
            id: row.id,
            date: row.date,
            startTime: row.start_time,
            endTime: row.end_time,
            versesRead: row.verses_read,
            chaptersRead: row.chapters_read,
            booksRead: row.books_read ? JSON.parse(row.books_read) : [],
            readingPlan: row.reading_plan,
            notes: row.notes,
            createdAt: row.created_at
        };
    }

    protected getCreateSql(session: CreateReadingSessionDto): { sql: string; params: any[] } {
        this.validateInput(session);
        return {
            sql: `INSERT INTO reading_sessions (date, start_time, end_time, verses_read, chapters_read,
                                               books_read, reading_plan, notes)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                session.date,
                session.startTime,
                session.endTime,
                session.versesRead,
                session.chaptersRead,
                JSON.stringify(session.booksRead),
                session.readingPlan ?? null,
                session.notes ?? null
            ]
        };
    }

    protected getUpdateSql(session: UpdateReadingSessionDto): { sql: string; params: any[] } {
        this.validateInput(session);
        return {
            sql: `UPDATE reading_sessions SET 
                    date = COALESCE(?, date),
                    start_time = COALESCE(?, start_time),
                    end_time = COALESCE(?, end_time),
                    verses_read = COALESCE(?, verses_read),
                    chapters_read = COALESCE(?, chapters_read),
                    books_read = COALESCE(?, books_read),
                    reading_plan = COALESCE(?, reading_plan),
                    notes = COALESCE(?, notes)
                WHERE id = ?`,
            params: [
                session.date,
                session.startTime,
                session.endTime,
                session.versesRead,
                session.chaptersRead,
                session.booksRead ? JSON.stringify(session.booksRead) : undefined,
                session.readingPlan,
                session.notes,
                session.id
            ]
        };
    }

    /**
     * Finds ReadingSession by date and start time
     */
    async findByDateAndTime(date: string, startTime: string): Promise<ReadingSessionModel | null> {
        this.validateString(date, 'date');
        this.validateString(startTime, 'startTime');
        const results = await this.findWhere('date = ? AND start_time = ?', [date, startTime]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Finds all ReadingSession records ordered by date and start time
     */
    async findAll(): Promise<ReadingSessionModel[]> {
        return super.findAll('date DESC, start_time DESC');
    }
}

/**
 * Singleton instance of ReadingSessionRepository
 */
export const readingSessionRepository = new ReadingSessionRepository();
