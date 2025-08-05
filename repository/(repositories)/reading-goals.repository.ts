import { BaseRepository } from '@/repository/base/base.repository';
import { ValidationError } from '@/errors';
import type {
    ReadingGoal,
    CreateReadingGoalDto,
    UpdateReadingGoalDto
} from '@/models';

/**
 * Repository class for managing ReadingGoal entities
 */
export class ReadingGoalsRepository extends BaseRepository<ReadingGoal, CreateReadingGoalDto, UpdateReadingGoalDto> {
    protected tableName = 'reading_goals';
    protected primaryKeyColumn = 'id';

    /**
     * Validates ReadingGoal input
     */
    private validateInput(goal: Partial<CreateReadingGoalDto | UpdateReadingGoalDto>): void {
        if (goal.goalType !== undefined) {
            this.validateString(goal.goalType, 'goalType');
        }
        if (goal.targetValue !== undefined && (typeof goal.targetValue !== 'number' || goal.targetValue <= 0)) {
            throw new ValidationError('targetValue must be a positive number');
        }
        if (goal.currentProgress !== undefined && (typeof goal.currentProgress !== 'number' || goal.currentProgress < 0)) {
            throw new ValidationError('currentProgress must be a non-negative number');
        }
        if (goal.startDate !== undefined) {
            this.validateString(goal.startDate, 'startDate');
        }
    }

    protected mapRowToEntity(row: any): ReadingGoal {
        return {
            id: row.id,
            userId: row.user_id,
            goalType: row.goal_type,
            targetValue: row.target_value,
            currentProgress: row.current_progress,
            startDate: row.start_date,
            endDate: row.end_date,
            isActive: Boolean(row.is_active),
            isCompleted: Boolean(row.is_completed),
            completedAt: row.completed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    protected getCreateSql(goal: CreateReadingGoalDto): { sql: string; params: any[] } {
        this.validateInput(goal);
        return {
            sql: `INSERT INTO reading_goals (user_id, goal_type, target_value, current_progress, start_date,
                                            end_date, is_active, is_completed, completed_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                goal.userId ?? 1,
                goal.goalType,
                goal.targetValue,
                goal.currentProgress ?? 0,
                goal.startDate,
                goal.endDate ?? null,
                goal.isActive !== false ? 1 : 0,
                goal.isCompleted ? 1 : 0,
                goal.completedAt ?? null
            ]
        };
    }

    protected getUpdateSql(goal: UpdateReadingGoalDto): { sql: string; params: any[] } {
        this.validateInput(goal);
        return {
            sql: `UPDATE reading_goals SET 
                    user_id = COALESCE(?, user_id),
                    goal_type = COALESCE(?, goal_type),
                    target_value = COALESCE(?, target_value),
                    current_progress = COALESCE(?, current_progress),
                    start_date = COALESCE(?, start_date),
                    end_date = COALESCE(?, end_date),
                    is_active = COALESCE(?, is_active),
                    is_completed = COALESCE(?, is_completed),
                    completed_at = COALESCE(?, completed_at),
                    updated_at = datetime('now')
                WHERE id = ?`,
            params: [
                goal.userId,
                goal.goalType,
                goal.targetValue,
                goal.currentProgress,
                goal.startDate,
                goal.endDate,
                goal.isActive !== undefined ? (goal.isActive ? 1 : 0) : undefined,
                goal.isCompleted !== undefined ? (goal.isCompleted ? 1 : 0) : undefined,
                goal.completedAt,
                goal.id
            ]
        };
    }

    /**
     * Finds all ReadingGoal records by user ID
     */
    async findByUserId(userId: number): Promise<ReadingGoal[]> {
        this.validateId(userId, 'userId');
        return this.findWhere('user_id = ?', [userId], 'created_at DESC');
    }

    /**
     * Finds active ReadingGoal records by user ID
     */
    async findActiveByUserId(userId: number): Promise<ReadingGoal[]> {
        this.validateId(userId, 'userId');
        return this.findWhere('user_id = ? AND is_active = 1', [userId], 'created_at DESC');
    }

    /**
     * Finds all ReadingGoal records ordered by updated date
     */
    async findAll(): Promise<ReadingGoal[]> {
        return super.findAll('updated_at DESC');
    }
}

/**
 * Singleton instance of ReadingGoalsRepository
 */
export const readingGoalsRepository = new ReadingGoalsRepository();
