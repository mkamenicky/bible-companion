import {SQLiteDatabase} from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import {Asset} from 'expo-asset';
import {DatabaseError} from '@/errors';
import {INITIAL_SCHEMA_MODULE, MIGRATION_FILES, MigrationFile} from '@/services/(services)/database/MigrationProvider';
import {logger} from '@/utils/(utils)/logger';

const INITIAL_VERSION = '0.0.0-initial';

/**
 * Applies init.sql once and then every migration that has not run yet.
 * Progress is recorded in the schema_migrations table.
 */
export class MigrationManager {
    constructor(private readonly database: SQLiteDatabase) {
    }

    /** Brings the schema up to date. Throws if any migration fails. */
    async migrate(): Promise<void> {
        await this.createMigrationTable();
        await this.runInitialSetup();

        const executed = await this.getExecutedVersions();
        const pending = MIGRATION_FILES
            .filter(migration => !executed.has(migration.version))
            .sort((a, b) => compareVersions(a.version, b.version));

        for (const migration of pending) {
            await this.execute(migration);
        }
    }

    private async createMigrationTable(): Promise<void> {
        await this.database.execAsync(`
            CREATE TABLE IF NOT EXISTS schema_migrations
            (
                id                INTEGER PRIMARY KEY,
                version           TEXT    NOT NULL UNIQUE,
                name              TEXT    NOT NULL,
                checksum          TEXT,
                executed_at       TEXT    NOT NULL DEFAULT (datetime('now')),
                execution_time_ms INTEGER,
                success           BOOLEAN NOT NULL DEFAULT 1,
                error_message     TEXT,
                created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        `);
    }

    private async getExecutedVersions(): Promise<Set<string>> {
        const rows = await this.database.getAllAsync<{ version: string }>(
            'SELECT version FROM schema_migrations WHERE success = 1'
        );
        return new Set(rows.map(row => row.version));
    }

    private async runInitialSetup(): Promise<void> {
        const executed = await this.getExecutedVersions();
        if (executed.has(INITIAL_VERSION)) return;

        await this.execute({version: INITIAL_VERSION, name: 'Initial database setup', module: INITIAL_SCHEMA_MODULE});
    }

    private async execute(migration: MigrationFile): Promise<void> {
        const startedAt = Date.now();

        if (migration.skipWhen?.()) {
            logger.info(`Migration ${migration.version} does not apply to this device`);
            await this.record({...migration, name: `${migration.name} (not applicable)`}, 0, null, null);
            return;
        }

        logger.info(`Running migration ${migration.version}: ${migration.name}`);

        try {
            const sql = await loadSql(migration.module);

            await this.database.withTransactionAsync(async () => {
                await this.database.execAsync(sql);
            });

            await this.record(migration, Date.now() - startedAt, checksum(sql), null);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            // Best effort only: the real error is the one worth reporting.
            await this.record(migration, Date.now() - startedAt, null, message).catch(() => undefined);
            throw new DatabaseError(`Migration ${migration.version} failed`, error);
        }
    }

    private async record(migration: MigrationFile, durationMs: number, sum: string | null, errorMessage: string | null): Promise<void> {
        // OR REPLACE: a migration that failed once must be able to succeed on
        // the next start instead of tripping over its own "failed" row.
        await this.database.runAsync(
            `INSERT OR REPLACE INTO schema_migrations (version, name, checksum, execution_time_ms, success, error_message)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [migration.version, migration.name, sum, durationMs, errorMessage ? 0 : 1, errorMessage]
        );
    }
}

async function loadSql(module: number): Promise<string> {
    const asset = Asset.fromModule(module);
    // No-op when the asset is already available locally.
    await asset.downloadAsync();
    if (!asset.localUri) {
        throw new Error('SQL asset could not be loaded');
    }
    return FileSystem.readAsStringAsync(asset.localUri);
}

/** Cheap content hash, stored for reference only. */
function checksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16);
}

/** Compares "1.2.3"-style versions numerically. */
function compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(part => parseInt(part, 10) || 0);
    const bParts = b.split('.').map(part => parseInt(part, 10) || 0);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const difference = (aParts[i] ?? 0) - (bParts[i] ?? 0);
        if (difference !== 0) return difference;
    }
    return 0;
}
