import {BaseRepository} from '@/repository/base/base.repository';
import { ValidationError } from '@/errors';
import type { 
    Reading, 
    CreateReadingDto, 
    UpdateReadingDto 
} from '@/models';

/**
 * Repository class for managing Reading entities
 */
export class ReadingsRepository extends BaseRepository<Reading, CreateReadingDto, UpdateReadingDto> {
    protected tableName = 'readings';
    protected primaryKeyColumn = 'id';

    /**
     * Validates Reading input
     */
    private validateInput(reading: Partial<CreateReadingDto | UpdateReadingDto>): void {
        if (reading.verse_count !== undefined && reading.verse_count !== null && (typeof reading.verse_count !== 'number' || reading.verse_count < 0)) {
            throw new ValidationError('verse_count must be a non-negative number');
        }
    }

    protected mapRowToEntity(row: any): Reading {
        return {
            id: row.id,
            date: row.date,
            chapter: row.chapter,
            verse_count: row.verse_count,
            is_read: row.is_read !== null ? Boolean(row.is_read) : null,
            plan_name: row.plan_name
        };
    }

    protected getCreateSql(reading: CreateReadingDto): { sql: string; params: any[] } {
        this.validateInput(reading);
        return {
            sql: `INSERT INTO readings (date, chapter, verse_count, is_read, plan_name) VALUES (?, ?, ?, ?, ?)`,
            params: [
                reading.date ?? null,
                reading.chapter ?? null,
                reading.verse_count ?? null,
                reading.is_read !== undefined ? (reading.is_read ? 1 : 0) : null,
                reading.plan_name ?? null
            ]
        };
    }

    protected getUpdateSql(reading: UpdateReadingDto): { sql: string; params: any[] } {
        this.validateInput(reading);
        return {
            sql: `UPDATE readings SET 
                    date = COALESCE(?, date),
                    chapter = COALESCE(?, chapter),
                    verse_count = COALESCE(?, verse_count),
                    is_read = COALESCE(?, is_read),
                    plan_name = COALESCE(?, plan_name)
                WHERE id = ?`,
            params: [
                reading.date,
                reading.chapter,
                reading.verse_count,
                reading.is_read !== undefined ? (reading.is_read ? 1 : 0) : undefined,
                reading.plan_name,
                reading.id
            ]
        };
    }

    /**
     * Finds all Reading records ordered by date
     */
    async findAll(): Promise<Reading[]> {
        return super.findAll('date DESC, id');
    }
}

/**
 * Singleton instance of ReadingsRepository
 */
export const readingsRepository = new ReadingsRepository();
