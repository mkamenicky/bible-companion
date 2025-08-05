import {BaseRepository} from '@/repository/base/base.repository';
import type { 
    Feedback, 
    CreateFeedbackDto, 
    UpdateFeedbackDto 
} from '@/models';

/**
 * Repository class for managing Feedback entities
 */
export class FeedbackRepository extends BaseRepository<Feedback, CreateFeedbackDto, UpdateFeedbackDto> {
    protected tableName = 'feedback';
    protected primaryKeyColumn = 'id';

    protected mapRowToEntity(row: any): Feedback {
        return {
            id: row.id,
            date: row.date,
            feedback: row.feedback
        };
    }

    protected getCreateSql(feedback: CreateFeedbackDto): { sql: string; params: any[] } {
        return {
            sql: `INSERT INTO feedback (date, feedback) VALUES (?, ?)`,
            params: [
                feedback.date ?? null,
                feedback.feedback ?? null
            ]
        };
    }

    protected getUpdateSql(feedback: UpdateFeedbackDto): { sql: string; params: any[] } {
        return {
            sql: `UPDATE feedback SET 
                    date = COALESCE(?, date),
                    feedback = COALESCE(?, feedback)
                WHERE id = ?`,
            params: [
                feedback.date,
                feedback.feedback,
                feedback.id
            ]
        };
    }

    /**
     * Finds all Feedback records ordered by date
     */
    async findAll(): Promise<Feedback[]> {
        return super.findAll('date DESC, id');
    }

}

/**
 * Singleton instance of FeedbackRepository
 */
export const feedbackRepository = new FeedbackRepository();
