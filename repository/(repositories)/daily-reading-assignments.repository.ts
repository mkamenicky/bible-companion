import {BaseRepository} from '@/repository/base/base.repository';
import type {CreateDailyReadingAssignmentDto, DailyReadingAssignment, UpdateDailyReadingAssignmentDto} from '@/models';

/**
 * Repository class for managing DailyReadingAssignment entities
 */
export class DailyReadingAssignmentsRepository extends BaseRepository<DailyReadingAssignment, CreateDailyReadingAssignmentDto, UpdateDailyReadingAssignmentDto> {
    protected tableName = 'daily_reading_assignments';
    protected primaryKeyColumn = 'id';

    /**
     * Finds all DailyReadingAssignment records ordered by date
     */
    async findAll(): Promise<DailyReadingAssignment[]> {
        return super.findAll('date DESC');
    }

    protected mapRowToEntity(row: any): DailyReadingAssignment {
        return {
            id: row.id,
            date: row.date,
            plan_name: row.plan_name,
            start_verse_id: row.start_verse_id,
            end_verse_id: row.end_verse_id,
            chapter_id: row.chapter_id,
            display_title: row.display_title,
            is_completed: Boolean(row.is_completed),
            completed_at: row.completed_at
        };
    }

    protected getCreateSql(assignment: CreateDailyReadingAssignmentDto): { sql: string; params: any[] } {
        this.validateInput(assignment);
        return {
            sql: `INSERT INTO daily_reading_assignments (date, plan_name, start_verse_id, end_verse_id,
                                                         chapter_id, display_title, is_completed, completed_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                assignment.date,
                assignment.plan_name ?? 'chronological',
                assignment.start_verse_id,
                assignment.end_verse_id,
                assignment.chapter_id,
                assignment.display_title,
                assignment.is_completed ? 1 : 0,
                assignment.completed_at ?? null
            ]
        };
    }

    protected getUpdateSql(assignment: UpdateDailyReadingAssignmentDto): { sql: string; params: any[] } {
        this.validateInput(assignment);
        return {
            sql: `UPDATE daily_reading_assignments
                  SET date           = COALESCE(?, date),
                      plan_name      = COALESCE(?, plan_name),
                      start_verse_id = COALESCE(?, start_verse_id),
                      end_verse_id   = COALESCE(?, end_verse_id),
                      chapter_id     = COALESCE(?, chapter_id),
                      display_title  = COALESCE(?, display_title),
                      is_completed   = COALESCE(?, is_completed),
                      completed_at   = COALESCE(?, completed_at)
                  WHERE id = ?`,
            params: [
                assignment.date,
                assignment.plan_name,
                assignment.start_verse_id,
                assignment.end_verse_id,
                assignment.chapter_id,
                assignment.display_title,
                assignment.is_completed !== undefined ? (assignment.is_completed ? 1 : 0) : undefined,
                assignment.completed_at,
                assignment.id
            ]
        };
    }

    /**
     * Validates DailyReadingAssignment input
     */
    private validateInput(assignment: Partial<CreateDailyReadingAssignmentDto | UpdateDailyReadingAssignmentDto>): void {
        if (assignment.date !== undefined) {
            this.validateString(assignment.date, 'date');
        }
        if (assignment.start_verse_id !== undefined) {
            this.validateId(assignment.start_verse_id, 'start_verse_id');
        }
        if (assignment.end_verse_id !== undefined) {
            this.validateId(assignment.end_verse_id, 'end_verse_id');
        }
        if (assignment.chapter_id !== undefined) {
            this.validateId(assignment.chapter_id, 'chapter_id');
        }
        if (assignment.display_title !== undefined) {
            this.validateString(assignment.display_title, 'display_title');
        }
    }

    /** All assignments of one day (YYYY-MM-DD), in reading order. */
    async findByDate(date: string): Promise<DailyReadingAssignment[]> {
        this.validateString(date, 'date');
        return this.findWhere('date = ?', [date], 'start_verse_id');
    }

    /**
     * Sets or clears the completed state. A dedicated statement because the
     * generic update keeps old values for null (COALESCE) and therefore can
     * never clear completed_at again.
     */
    async setCompleted(id: number, completedAt: string | null): Promise<void> {
        this.validateId(id);
        await this.execute(
            'UPDATE daily_reading_assignments SET is_completed = ?, completed_at = ? WHERE id = ?',
            [completedAt ? 1 : 0, completedAt, id]
        );
    }
}

/**
 * Singleton instance of DailyReadingAssignmentsRepository
 */
export const dailyReadingAssignmentsRepository = new DailyReadingAssignmentsRepository();
