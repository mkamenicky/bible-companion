// MigrationManager.ts
import {SQLiteDatabase} from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import {Asset} from 'expo-asset';
import {migrationProvider} from "@/services/(services)/database/MigrationProvider";

export interface Migration {
    version: string;
    name: string;
    sql: string;
    checksum: string;
    executedAt?: string;
}

export interface MigrationResult {
    version: string;
    name: string;
    success: boolean;
    error?: string;
    executionTime: number;
}

export class MigrationManager {
    private database: SQLiteDatabase;
    private config: {
        migrationsPath: string;
        enableLogging: boolean;
        validateChecksums: boolean;
    };

    constructor(database: SQLiteDatabase, options?: {
        migrationsPath?: string;
        enableLogging?: boolean;
        validateChecksums?: boolean;
    }) {
        this.database = database;
        this.config = {
            migrationsPath: 'assets/db/migrations',
            enableLogging: true,
            validateChecksums: true,
            ...options
        };
    }

    /**
     * Initialize the migration system by creating the schema_migrations table
     */
    async initialize(): Promise<void> {
        const createMigrationTableSQL = `
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

            CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations (version);
            CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations (executed_at);
        `;

        try {
            await this.database.execAsync(createMigrationTableSQL);
            this.log('Migration system initialized successfully');
        } catch (error) {
            this.log('Failed to initialize migration system:', error);
            throw error;
        }
    }

    /**
     * Run initial setup SQL (your init.sql file)
     */
    async runInitialSetup(): Promise<void> {
        try {
            // Check if we've already run the initial setup
            const hasInitialMigration = await this.database.getFirstAsync(
                'SELECT version FROM schema_migrations WHERE version = ?',
                ['0.0.0-initial']
            );

            if (hasInitialMigration) {
                this.log('Initial setup already completed, skipping...');
                return;
            }

            this.log('Running initial database setup...');

            // Load init.sql from assets
            const initAsset = Asset.fromModule(require('../../../assets/db/init.sql'));
            await initAsset.downloadAsync();

            if (!initAsset.localUri) {
                throw new Error('Failed to load init.sql asset');
            }

            const initSQL = await FileSystem.readAsStringAsync(initAsset.localUri);
            const startTime = Date.now();

            // Execute the initial SQL
            await this.database.execAsync(initSQL);

            const executionTime = Date.now() - startTime;
            const checksum = this.calculateChecksum(initSQL);

            // Record the initial migration
            await this.database.runAsync(
                `INSERT INTO schema_migrations (version, name, checksum, execution_time_ms)
                 VALUES (?, ?, ?, ?)`,
                ['0.0.0-initial', 'Initial database setup', checksum, executionTime]
            );

            this.log(`Initial setup completed in ${executionTime}ms`);
        } catch (error) {
            this.log('Initial setup failed:', error);
            throw error;
        }
    }

    /**
     * Discover and load all migration files
     */
    async loadMigrations(): Promise<Migration[]> {
        try {
            // Load migrations from assets
            const migrationFiles = await this.getMigrationFiles();
            const migrations: Migration[] = [];

            for (const file of migrationFiles) {
                try {
                    const asset = Asset.fromModule(file.module);
                    await asset.downloadAsync();

                    if (!asset.localUri) {
                        this.log(`Warning: Could not load migration ${file.version}`);
                        continue;
                    }

                    const sql = await FileSystem.readAsStringAsync(asset.localUri);
                    const checksum = this.calculateChecksum(sql);

                    migrations.push({
                        version: file.version,
                        name: file.name,
                        sql,
                        checksum
                    });
                } catch (error) {
                    this.log(`Error loading migration ${file.version}:`, error);
                }
            }

            // Sort migrations by version
            return migrations.sort((a, b) => this.compareVersions(a.version, b.version));
        } catch (error) {
            this.log('Failed to load migrations:', error);
            throw error;
        }
    }

    /**
     * Get pending migrations that haven't been executed yet
     */
    async getPendingMigrations(): Promise<Migration[]> {
        const allMigrations = await this.loadMigrations();
        const executedMigrations = await this.database.getAllAsync(
            'SELECT version, checksum FROM schema_migrations WHERE success = 1'
        ) as Array<{ version: string, checksum: string }>;

        const executedVersions = new Set(executedMigrations.map(m => m.version));
        const executedChecksums = new Map(executedMigrations.map(m => [m.version, m.checksum]));

        return allMigrations.filter(migration => {
            if (!executedVersions.has(migration.version)) {
                return true; // Not executed yet
            }

            // Check for checksum changes if validation is enabled
            if (this.config.validateChecksums) {
                const executedChecksum = executedChecksums.get(migration.version);
                if (executedChecksum !== migration.checksum) {
                    this.log(`Warning: Checksum mismatch for migration ${migration.version}`);
                    // You might want to throw an error here or handle it differently
                }
            }

            return false;
        });
    }

    /**
     * Execute all pending migrations
     */
    async migrate(): Promise<MigrationResult[]> {
        await this.initialize();
        await this.runInitialSetup();

        const pendingMigrations = await this.getPendingMigrations();

        if (pendingMigrations.length === 0) {
            this.log('No pending migrations found');
            return [];
        }

        this.log(`Found ${pendingMigrations.length} pending migrations`);
        const results: MigrationResult[] = [];

        for (const migration of pendingMigrations) {
            const result = await this.executeMigration(migration);
            results.push(result);

            if (!result.success) {
                this.log(`Migration failed: ${migration.version}. Stopping migration process.`);
                break;
            }
        }

        return results;
    }

    /**
     * Get migration history
     */
    async getMigrationHistory(): Promise<Array<{
        version: string;
        name: string;
        executedAt: string;
        executionTime: number;
        success: boolean;
        errorMessage?: string;
    }>> {
        return await this.database.getAllAsync(`
            SELECT version,
                   name,
                   executed_at       as executedAt,
                   execution_time_ms as executionTime,
                   success,
                   error_message     as errorMessage
            FROM schema_migrations
            ORDER BY executed_at DESC
        `) as any[];
    }

    /**
     * Validate database state against migrations
     */
    async validateMigrations(): Promise<{
        isValid: boolean;
        issues: string[];
    }> {
        const issues: string[] = [];
        const allMigrations = await this.loadMigrations();
        const executedMigrations = await this.database.getAllAsync(
            'SELECT version, checksum FROM schema_migrations WHERE success = 1'
        ) as Array<{ version: string, checksum: string }>;

        const executedMap = new Map(executedMigrations.map(m => [m.version, m.checksum]));

        for (const migration of allMigrations) {
            const executedChecksum = executedMap.get(migration.version);

            if (executedChecksum && executedChecksum !== migration.checksum) {
                issues.push(`Checksum mismatch for migration ${migration.version}`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Execute a single migration
     */
    private async executeMigration(migration: Migration): Promise<MigrationResult> {
        this.log(`Executing migration ${migration.version}: ${migration.name}`);
        const startTime = Date.now();

        try {
            // Execute migration in a transaction
            await this.database.withTransactionAsync(async () => {
                await this.database.execAsync(migration.sql);
            });

            const executionTime = Date.now() - startTime;

            // Record successful migration
            await this.database.runAsync(
                `INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, success)
                 VALUES (?, ?, ?, ?, ?)`,
                [migration.version, migration.name, migration.checksum, executionTime, 1]
            );

            this.log(`Migration ${migration.version} completed successfully in ${executionTime}ms`);

            return {
                version: migration.version,
                name: migration.name,
                success: true,
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Record failed migration
            await this.database.runAsync(
                `INSERT INTO schema_migrations (version, name, checksum, execution_time_ms, success, error_message)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [migration.version, migration.name, migration.checksum, executionTime, 0, errorMessage]
            );

            this.log(`Migration ${migration.version} failed:`, error);

            return {
                version: migration.version,
                name: migration.name,
                success: false,
                error: errorMessage,
                executionTime
            };
        }
    }

    /**
     * Manual registration of migration files
     * You need to update this method whenever you add new migrations
     */
    private async getMigrationFiles(): Promise<Array<{
        version: string;
        name: string;
        module: any;
    }>> {
        return await migrationProvider.getMigrationFiles();
    }

    /**
     * Calculate MD5-like checksum for migration content
     */
    private calculateChecksum(content: string): string {
        // Simple hash function for checksum validation
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Compare version strings (semver-like)
     */
    private compareVersions(a: string, b: string): number {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;

            if (aPart < bPart) return -1;
            if (aPart > bPart) return 1;
        }

        return 0;
    }

    private log(message: string, error?: any): void {
        if (!this.config.enableLogging) return;

        const timestamp = new Date().toISOString();
        const prefix = `[MigrationManager] ${timestamp}`;

        if (error) {
            console.error(`${prefix} ERROR: ${message}`, error);
        } else {
            console.log(`${prefix} INFO: ${message}`);
        }
    }
}
