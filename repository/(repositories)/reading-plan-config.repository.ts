import {BaseRepository} from '@/repository';
import { ValidationError } from '@/errors';
import type { 
    ReadingPlanConfig, 
    CreateReadingPlanConfigDto, 
    UpdateReadingPlanConfigDto 
} from '@/models';

/**
 * Repository class for managing ReadingPlanConfig entities
 */
export class ReadingPlanConfigRepository extends BaseRepository<ReadingPlanConfig, CreateReadingPlanConfigDto, UpdateReadingPlanConfigDto> {
    protected tableName = 'reading_plan_config';
    protected primaryKeyColumn = 'id';

    /**
     * Validates ReadingPlanConfig input
     */
    private validateInput(config: Partial<CreateReadingPlanConfigDto | UpdateReadingPlanConfigDto>): void {
        if (config.plan_name !== undefined) {
            this.validateString(config.plan_name, 'plan_name');
        }
        if (config.plan_type !== undefined && config.plan_type !== null && typeof config.plan_type !== 'string') {
            throw new ValidationError('plan_type must be a string');
        }
    }

    protected mapRowToEntity(row: any): ReadingPlanConfig {
        return {
            id: row.id,
            plan_name: row.plan_name,
            plan_type: row.plan_type,
            is_active: Boolean(row.is_active),
            created_at: row.created_at
        };
    }

    protected getCreateSql(config: CreateReadingPlanConfigDto): { sql: string; params: any[] } {
        this.validateInput(config);
        return {
            sql: `INSERT INTO reading_plan_config (plan_name, plan_type, is_active, created_at)
                 VALUES (?, ?, ?, datetime('now'))`,
            params: [
                config.plan_name,
                config.plan_type ?? 'chronological',
                config.is_active ? 1 : 0
            ]
        };
    }

    protected getUpdateSql(config: UpdateReadingPlanConfigDto): { sql: string; params: any[] } {
        this.validateInput(config);
        return {
            sql: `UPDATE reading_plan_config SET 
                    plan_name = COALESCE(?, plan_name),
                    plan_type = COALESCE(?, plan_type),
                    is_active = COALESCE(?, is_active)
                WHERE id = ?`,
            params: [
                config.plan_name,
                config.plan_type,
                config.is_active !== undefined ? (config.is_active ? 1 : 0) : undefined,
                config.id
            ]
        };
    }

    /**
     * Finds all ReadingPlanConfig records ordered by creation date
     */
    async findAll(): Promise<ReadingPlanConfig[]> {
        return super.findAll('created_at DESC');
    }
}

/**
 * Singleton instance of ReadingPlanConfigRepository
 */
export const readingPlanConfigRepository = new ReadingPlanConfigRepository();
