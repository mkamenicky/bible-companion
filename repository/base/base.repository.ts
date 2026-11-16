import type {SQLiteBindValue} from 'expo-sqlite';
import {getDatabase} from '@/services/(services)/database/Database';
import {DatabaseError, ValidationError} from '@/errors';

export type SqlParams = SQLiteBindValue[];

/** undefined is not bindable; in the COALESCE-style updates it means "keep". */
const toBindable = (params: unknown[]): SqlParams =>
    params.map(value => (value === undefined ? null : value)) as SqlParams;

/**
 * Base class for table repositories: CRUD plus small query helpers.
 * Subclasses describe their table and how rows map to entities.
 */
export abstract class BaseRepository<T, CreateDto, UpdateDto> {
    protected abstract tableName: string;
    protected abstract primaryKeyColumn: string;

    protected abstract mapRowToEntity(row: any): T;

    protected abstract getCreateSql(dto: CreateDto): { sql: string; params: unknown[] };

    protected abstract getUpdateSql(dto: UpdateDto): { sql: string; params: unknown[] };

    /**
     * Validates a numeric id. Zero is valid: Bible verse ids start at 0.
     */
    protected validateId(id: number, fieldName: string = 'ID'): void {
        if (typeof id !== 'number' || !Number.isInteger(id) || id < 0) {
            throw new ValidationError(`${fieldName} must be a non-negative integer`);
        }
    }

    protected validateString(value: string, fieldName: string): void {
        if (!value || typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a non-empty string`);
        }
    }

    /** Runs a SELECT and returns all rows. */
    protected async query<Row = any>(sql: string, params: unknown[] = []): Promise<Row[]> {
        try {
            return await getDatabase().getAllAsync<Row>(sql, toBindable(params));
        } catch (error) {
            throw new DatabaseError(`Query failed on ${this.tableName}`, error);
        }
    }

    /** Runs a SELECT and returns the first row or null. */
    protected async queryFirst<Row = any>(sql: string, params: unknown[] = []): Promise<Row | null> {
        try {
            return await getDatabase().getFirstAsync<Row>(sql, toBindable(params));
        } catch (error) {
            throw new DatabaseError(`Query failed on ${this.tableName}`, error);
        }
    }

    /** Runs an INSERT/UPDATE/DELETE and returns the number of changed rows. */
    protected async execute(sql: string, params: unknown[] = []): Promise<number> {
        try {
            const result = await getDatabase().runAsync(sql, toBindable(params));
            return result.changes;
        } catch (error) {
            throw new DatabaseError(`Statement failed on ${this.tableName}`, error);
        }
    }

    async create(dto: CreateDto): Promise<T> {
        const {sql, params} = this.getCreateSql(dto);

        try {
            const result = await getDatabase().runAsync(sql, toBindable(params));
            return await this.findById(result.lastInsertRowId) as T;
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            throw new DatabaseError(`Failed to create ${this.tableName} record`, error);
        }
    }

    async findById(id: number): Promise<T | null> {
        this.validateId(id);
        const row = await this.queryFirst(
            `SELECT * FROM ${this.tableName} WHERE ${this.primaryKeyColumn} = ?`,
            [id]
        );
        return row ? this.mapRowToEntity(row) : null;
    }

    async findAll(orderBy?: string): Promise<T[]> {
        const rows = await this.query(
            `SELECT * FROM ${this.tableName} ORDER BY ${orderBy || this.primaryKeyColumn}`
        );
        return rows.map(row => this.mapRowToEntity(row));
    }

    /** Updates a record. The DTO must carry the primary key as `id`. */
    async update(dto: UpdateDto & { id: number }): Promise<T> {
        const {sql, params} = this.getUpdateSql(dto);
        await this.execute(sql, params);
        return await this.findById(dto.id) as T;
    }

    async deleteById(id: number): Promise<boolean> {
        this.validateId(id);
        const changes = await this.execute(
            `DELETE FROM ${this.tableName} WHERE ${this.primaryKeyColumn} = ?`,
            [id]
        );
        return changes > 0;
    }

    async count(): Promise<number> {
        const row = await this.queryFirst<{ count: number }>(`SELECT COUNT(*) AS count FROM ${this.tableName}`);
        return row?.count ?? 0;
    }

    /** SELECT * with a custom WHERE clause. */
    async findWhere(whereClause: string, params: unknown[], orderBy?: string): Promise<T[]> {
        const rows = await this.query(
            `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY ${orderBy || this.primaryKeyColumn}`,
            params
        );
        return rows.map(row => this.mapRowToEntity(row));
    }

    /** First row matching a custom WHERE clause, or null. */
    async findFirstWhere(whereClause: string, params: unknown[], orderBy?: string): Promise<T | null> {
        const row = await this.queryFirst(
            `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY ${orderBy || this.primaryKeyColumn} LIMIT 1`,
            params
        );
        return row ? this.mapRowToEntity(row) : null;
    }
}
