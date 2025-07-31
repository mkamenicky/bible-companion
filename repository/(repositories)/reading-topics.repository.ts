// reading-topics.repository.ts
import { BaseRepository } from '@/repository/base/base.repository';
import { ValidationError } from '@/errors';
import type {
    ReadingTopic,
    CreateReadingTopic,
    UpdateReadingTopic
} from '@/models';

/**
 * Repository class for managing ReadingTopic entities
 */
export class ReadingTopicsRepository extends BaseRepository<ReadingTopic, CreateReadingTopic, UpdateReadingTopic> {
    protected tableName = 'reading_topics';
    protected primaryKeyColumn = 'id';

    /**
     * Validates ReadingTopic input
     */
    private validateInput(topic: Partial<CreateReadingTopic | UpdateReadingTopic>): void {
        if (topic.topic_name !== undefined) {
            this.validateString(topic.topic_name, 'topic_name');
        }
        if (topic.display_name !== undefined) {
            this.validateString(topic.display_name, 'display_name');
        }
        if (topic.day_of_week !== undefined && topic.day_of_week !== null && (typeof topic.day_of_week !== 'number' || topic.day_of_week < 1 || topic.day_of_week > 7)) {
            throw new ValidationError('day_of_week must be a number between 1 and 7, or null');
        }
        if (topic.color_hex !== undefined && topic.color_hex !== null && (typeof topic.color_hex !== 'string' || !topic.color_hex.match(/^#[0-9A-Fa-f]{6}$/))) {
            throw new ValidationError('color_hex must be a valid hex color code (e.g., #FF0000) or null');
        }
        if (topic.icon_name !== undefined && topic.icon_name !== null && typeof topic.icon_name !== 'string') {
            throw new ValidationError('icon_name must be a string or null');
        }
        if (topic.is_active !== undefined && typeof topic.is_active !== 'boolean') {
            throw new ValidationError('is_active must be a boolean');
        }
    }

    protected mapRowToEntity(row: any): ReadingTopic {
        return {
            id: row.id,
            topic_name: row.topic_name,
            display_name: row.display_name,
            day_of_week: row.day_of_week,
            color_hex: row.color_hex,
            icon_name: row.icon_name,
            is_active: Boolean(row.is_active),
            created_at: row.created_at
        };
    }

    protected getCreateSql(topic: CreateReadingTopic): { sql: string; params: any[] } {
        this.validateInput(topic);
        return {
            sql: `INSERT INTO reading_topics (
                topic_name, display_name, day_of_week, color_hex,
                icon_name, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            params: [
                topic.topic_name,
                topic.display_name,
                topic.day_of_week ?? null,
                topic.color_hex ?? null,
                topic.icon_name ?? null,
                topic.is_active !== undefined ? (topic.is_active ? 1 : 0) : 1
            ]
        };
    }

    protected getUpdateSql(topic: UpdateReadingTopic): { sql: string; params: any[] } {
        this.validateInput(topic);
        return {
            sql: `UPDATE reading_topics SET
                                            topic_name = COALESCE(?, topic_name),
                                            display_name = COALESCE(?, display_name),
                                            day_of_week = COALESCE(?, day_of_week),
                                            color_hex = COALESCE(?, color_hex),
                                            icon_name = COALESCE(?, icon_name),
                                            is_active = COALESCE(?, is_active)
                  WHERE id = ?`,
            params: [
                topic.topic_name,
                topic.display_name,
                topic.day_of_week,
                topic.color_hex,
                topic.icon_name,
                topic.is_active !== undefined ? (topic.is_active ? 1 : 0) : undefined,
                topic.id
            ]
        };
    }

    /**
     * Finds all ReadingTopic records ordered by day_of_week and topic_name
     */
    async findAll(): Promise<ReadingTopic[]> {
        return super.findAll('day_of_week, topic_name');
    }

    /**
     * Finds ReadingTopic records by day_of_week (active only)
     */
    async findByDayOfWeek(dayOfWeek: number): Promise<ReadingTopic[]> {
        if (typeof dayOfWeek !== 'number' || dayOfWeek < 1 || dayOfWeek > 7) {
            throw new ValidationError('day_of_week must be a number between 1 and 7');
        }
        return this.findWhere('day_of_week = ? AND is_active = 1', [dayOfWeek], 'topic_name');
    }

    /**
     * Finds all active ReadingTopic records
     */
    async findActive(): Promise<ReadingTopic[]> {
        return this.findWhere('is_active = 1', [], 'day_of_week, topic_name');
    }
}

/**
 * Singleton instance of ReadingTopicsRepository
 */
export const readingTopicsRepository = new ReadingTopicsRepository();
