// @ts-ignore
import { getDatabase } from '@/services/(services)/database/db';
import { DatabaseMessageError, ValidationError } from '@/errors';

/**
 * Abstract base repository class providing common CRUD operations
 */
export abstract class BaseRepository<T, CreateDto, UpdateDto> {
    protected abstract tableName: string;
    protected abstract primaryKeyColumn: string;

    /**
     * Formats date to ISO string (YYYY-MM-DD)
     */
    protected formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Validates that an ID is a positive number
     */
    protected validateId(id: number, fieldName: string = 'ID'): void {
        if (typeof id !== 'number' || id <= 0) {
            throw new ValidationError(`${fieldName} must be a positive number`);
        }
    }

    /**
     * Validates that a string is non-empty
     */
    protected validateString(value: string, fieldName: string): void {
        if (!value || typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a non-empty string`);
        }
    }

    /**
     * Abstract method to map database row to entity
     */
    protected abstract mapRowToEntity(row: any): T;

    /**
     * Abstract method to get create SQL and parameters
     */
    protected abstract getCreateSql(dto: CreateDto): { sql: string; params: any[] };

    /**
     * Abstract method to get update SQL and parameters
     */
    protected abstract getUpdateSql(dto: UpdateDto): { sql: string; params: any[] };

    /**
     * Execute custom SQL query - exposed for complex queries in derived repositories
     */
    protected async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
        const db = getDatabase();
        try {
            return await db.getAllAsync(sql, params);
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to execute query: ${sql}`, error as Error);
        }
    }

    /**
     * Execute custom SQL query that returns a single row
     */
    protected async executeQueryFirst(sql: string, params: any[] = []): Promise<any | null> {
        const db = getDatabase();
        try {
            return await db.getFirstAsync(sql, params);
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to execute query: ${sql}`, error as Error);
        }
    }

    /**
     * Creates a new entity
     */
    async create(dto: CreateDto): Promise<T> {
        const db = getDatabase();

        try {
            const { sql, params } = this.getCreateSql(dto);
            console.log(sql);

            const result = await db.runAsync(sql, params);

            return await this.findById(result.lastInsertRowId!) as T;
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to create ${this.tableName} record`, error as Error);
        }
    }

    /**
     * Finds an entity by ID
     */
    async findById(id: number): Promise<T | null> {
        this.validateId(id);

        const db = getDatabase();

        try {
            const result = await db.getFirstAsync<any>(
                `SELECT * FROM ${this.tableName} WHERE ${this.primaryKeyColumn} = ?`,
                [id]
            );

            return result ? this.mapRowToEntity(result) : null;
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to find ${this.tableName} with ID: ${id}`, error as Error);
        }
    }

    /**
     * Finds all entities
     */
    async findAll(orderBy?: string): Promise<T[]> {
        const db = getDatabase();

        try {
            const orderClause = orderBy || this.primaryKeyColumn;
            const results = await db.getAllAsync<any>(`SELECT * FROM ${this.tableName} ORDER BY ${orderClause}`);

            return results.map((row: any) => this.mapRowToEntity(row));
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to retrieve all ${this.tableName} records`, error as Error);
        }
    }

    /**
     * Updates an existing entity
     */
    async update(dto: UpdateDto): Promise<T> {
        const db = getDatabase();

        try {
            const { sql, params } = this.getUpdateSql(dto);
            await db.runAsync(sql, params);

            // Extract ID from the update DTO - this assumes the DTO has an id property
            const id = (dto as any).id || (dto as any)[this.primaryKeyColumn];
            return await this.findById(id) as T;
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to update ${this.tableName} record`, error as Error);
        }
    }

    /**
     * Deletes an entity by ID
     */
    async deleteById(id: number): Promise<boolean> {
        this.validateId(id);

        const db = getDatabase();

        try {
            const result = await db.runAsync(`DELETE FROM ${this.tableName} WHERE ${this.primaryKeyColumn} = ?`, [id]);
            return result.changes > 0;
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to delete ${this.tableName} with ID: ${id}`, error as Error);
        }
    }

    /**
     * Checks if an entity exists by ID
     */
    async existsById(id: number): Promise<boolean> {
        this.validateId(id);

        const db = getDatabase();

        try {
            const result = await db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${this.primaryKeyColumn} = ?`,
                [id]
            );
            return (result?.count ?? 0) > 0;
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to check ${this.tableName} existence with ID: ${id}`, error as Error);
        }
    }

    /**
     * Counts total records in the table
     */
    async count(): Promise<number> {
        const db = getDatabase();

        try {
            const result = await db.getFirstAsync<{ count: number }>(
                `SELECT COUNT(*) as count FROM ${this.tableName}`
            );
            return result?.count ?? 0;
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to count ${this.tableName} records`, error as Error);
        }
    }

    /**
     * Generic find method with custom WHERE clause
     */
    protected async findWhere(whereClause: string, params: any[], orderBy?: string): Promise<T[]> {
        const db = getDatabase();

        try {
            const orderClause = orderBy || this.primaryKeyColumn;
            const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY ${orderClause}`;
            const results = await db.getAllAsync<any>(sql, params);

            return results.map((row: any) => this.mapRowToEntity(row));
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to find ${this.tableName} records with custom WHERE clause`, error as Error);
        }
    }

    /**
     * Generic find first method with custom WHERE clause
     */
    protected async findFirstWhere(whereClause: string, params: any[]): Promise<T | null> {
        const db = getDatabase();

        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
            const result = await db.getFirstAsync<any>(sql, params);

            return result ? this.mapRowToEntity(result) : null;
        } catch (error: any) {
            throw new DatabaseMessageError(`Failed to find first ${this.tableName} record with custom WHERE clause`, error as Error);
        }
    }
}
