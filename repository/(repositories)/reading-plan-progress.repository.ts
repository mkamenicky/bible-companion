// reading-plan-progress.repository.ts
import { BaseRepository } from '@/repository/base/base.repository';
import { ValidationError } from '@/errors';
import type {
    ReadingPlanProgress,
    CreateReadingPlanProgress,
    UpdateReadingPlanProgress
} from '@/models';

/**
 * Repository class for managing ReadingPlanProgress entities
 */
export class ReadingPlanProgressRepository extends BaseRepository<ReadingPlanProgress, CreateReadingPlanProgress, UpdateReadingPlanProgress> {
    protected tableName = 'reading_plan_progress';
    protected primaryKeyColumn = 'id';

    /**
     * Validates ReadingPlanProgress input
     */
    private validateInput(progress: Partial<CreateReadingPlanProgress | UpdateReadingPlanProgress>): void {
        // @ts-ignore
        if (progress.plan_config_id !== undefined && (typeof progress.plan_config_id !== 'number' || progress.plan_config_id <= 0)) {
            throw new ValidationError('plan_config_id must be a positive number');
        }
        if (progress.current_book_id !== undefined && progress.current_book_id !== null && (typeof progress.current_book_id !== 'number' || progress.current_book_id <= 0)) {
            throw new ValidationError('current_book_id must be a positive number or null');
        }
        if (progress.current_chapter_id !== undefined && progress.current_chapter_id !== null && (typeof progress.current_chapter_id !== 'number' || progress.current_chapter_id <= 0)) {
            throw new ValidationError('current_chapter_id must be a positive number or null');
        }
        if (progress.current_verse_id !== undefined && progress.current_verse_id !== null && (typeof progress.current_verse_id !== 'number' || progress.current_verse_id <= 0)) {
            throw new ValidationError('current_verse_id must be a positive number or null');
        }
        if (progress.last_topic_id !== undefined && progress.last_topic_id !== null && (typeof progress.last_topic_id !== 'number' || progress.last_topic_id <= 0)) {
            throw new ValidationError('last_topic_id must be a positive number or null');
        }
        if (progress.verses_read_today !== undefined && progress.verses_read_today !== null && (typeof progress.verses_read_today !== 'number' || progress.verses_read_today < 0)) {
            throw new ValidationError('verses_read_today must be a non-negative number or null');
        }
    }

    protected mapRowToEntity(row: any): ReadingPlanProgress {
        return {
            id: row.id,
            plan_config_id: row.plan_config_id,
            current_book_id: row.current_book_id,
            current_chapter_id: row.current_chapter_id,
            current_verse_id: row.current_verse_id,
            last_topic_id: row.last_topic_id,
            verses_read_today: row.verses_read_today,
            last_updated: row.last_updated,
            created_at: row.created_at
        };
    }

    protected getCreateSql(progress: CreateReadingPlanProgress): { sql: string; params: any[] } {
        this.validateInput(progress);
        return {
            sql: `INSERT INTO reading_plan_progress (
                    plan_config_id, current_book_id, current_chapter_id, 
                    current_verse_id, last_topic_id, verses_read_today, 
                    last_updated, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                progress.plan_config_id,
                progress.current_book_id ?? null,
                progress.current_chapter_id ?? null,
                progress.current_verse_id ?? null,
                progress.last_topic_id ?? null,
                progress.verses_read_today ?? 0,
                progress.last_updated,
                progress.created_at
            ]
        };
    }

    protected getUpdateSql(progress: UpdateReadingPlanProgress): { sql: string; params: any[] } {
        this.validateInput(progress);
        return {
            sql: `UPDATE reading_plan_progress SET 
                    current_book_id = COALESCE(?, current_book_id),
                    current_chapter_id = COALESCE(?, current_chapter_id),
                    current_verse_id = COALESCE(?, current_verse_id),
                    last_topic_id = COALESCE(?, last_topic_id),
                    verses_read_today = COALESCE(?, verses_read_today),
                    last_updated = COALESCE(?, datetime('now'))
                WHERE id = ?`,
            params: [
                progress.current_book_id,
                progress.current_chapter_id,
                progress.current_verse_id,
                progress.last_topic_id,
                progress.verses_read_today,
                progress.last_updated,
                progress.id
            ]
        };
    }

    /**
     * Finds all ReadingPlanProgress records ordered by created_at descending
     */
    async findAll(): Promise<ReadingPlanProgress[]> {
        return super.findAll('created_at DESC');
    }

    /**
     * Finds ReadingPlanProgress record by plan_config_id
     */
    async findByPlanConfigId(planConfigId: number): Promise<ReadingPlanProgress | null> {
        this.validateId(planConfigId, 'Plan Config ID');
        return this.findFirstWhere('plan_config_id = ?', [planConfigId]);
    }
}

/**
 * Singleton instance of ReadingPlanProgressRepository
 */
export const readingPlanProgressRepository = new ReadingPlanProgressRepository();
