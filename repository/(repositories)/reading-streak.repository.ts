// reading-streak.repository.ts
import { BaseRepository } from '@/repository/base/base.repository';
import type {
    ReadingStreak,
    CreateReadingStreakDto,
    UpdateReadingStreakDto
} from '@/models';

/**
 * Repository class for managing ReadingStreak entities
 */
export class ReadingStreakRepository extends BaseRepository<ReadingStreak, CreateReadingStreakDto, UpdateReadingStreakDto> {
    protected tableName = 'reading_streaks';
    protected primaryKeyColumn = 'id';

    /**
     * Validates ReadingStreak input
     */
    private validateInput(streak: Partial<CreateReadingStreakDto | UpdateReadingStreakDto>): void {
        if (streak.currentStreak !== undefined) {
            this.validateId(streak.currentStreak, 'currentStreak');
        }
        if (streak.longestStreak !== undefined) {
            this.validateId(streak.longestStreak, 'longestStreak');
        }
        if (streak.lastReadingDate !== undefined) {
            this.validateString(streak.lastReadingDate, 'lastReadingDate');
        }
    }

    protected mapRowToEntity(row: any): ReadingStreak {
        return {
            id: row.id,
            userId: row.user_id,
            currentStreak: row.current_streak,
            longestStreak: row.longest_streak,
            lastReadingDate: row.last_reading_date,
            longestStreakStartDate: row.longest_streak_start_date,
            longestStreakEndDate: row.longest_streak_end_date,
            updatedAt: row.updated_at,
            createdAt: row.created_at
        };
    }

    protected getCreateSql(streak: CreateReadingStreakDto): { sql: string; params: any[] } {
        this.validateInput(streak);
        return {
            sql: `INSERT INTO reading_streaks (user_id, current_streak, longest_streak, last_reading_date,
                                              longest_streak_start_date, longest_streak_end_date)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            params: [
                streak.userId ?? 1,
                streak.currentStreak,
                streak.longestStreak,
                streak.lastReadingDate,
                streak.longestStreakStartDate ?? '',
                streak.longestStreakEndDate ?? ''
            ]
        };
    }

    protected getUpdateSql(streak: UpdateReadingStreakDto): { sql: string; params: any[] } {
        this.validateInput(streak);
        return {
            sql: `UPDATE reading_streaks SET 
                    user_id = COALESCE(?, user_id),
                    current_streak = COALESCE(?, current_streak),
                    longest_streak = COALESCE(?, longest_streak),
                    last_reading_date = COALESCE(?, last_reading_date),
                    longest_streak_start_date = COALESCE(?, longest_streak_start_date),
                    longest_streak_end_date = COALESCE(?, longest_streak_end_date),
                    updated_at = datetime('now')
                WHERE id = ?`,
            params: [
                streak.userId,
                streak.currentStreak,
                streak.longestStreak,
                streak.lastReadingDate,
                streak.longestStreakStartDate,
                streak.longestStreakEndDate,
                streak.id
            ]
        };
    }

    /**
     * Finds ReadingStreak by user ID
     */
    async findByUserId(userId: number): Promise<ReadingStreak | null> {
        this.validateId(userId, 'userId');
        const results = await this.findWhere('user_id = ?', [userId]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Finds all ReadingStreak records ordered by updated date
     */
    async findAll(): Promise<ReadingStreak[]> {
        return super.findAll('updated_at DESC');
    }
}

/**
 * Singleton instance of ReadingStreakRepository
 */
export const readingStreakRepository = new ReadingStreakRepository();
