import { SQLiteDatabase } from 'expo-sqlite';
import type { DatabaseConfig, DatabaseHealth } from '@/models';
import { DatabaseError } from "@/errors";
import { MigrationManager } from './MigrationManager';

export abstract class DatabaseService {
    database: SQLiteDatabase | null = null;
    protected config: DatabaseConfig;
    protected initialized: boolean = false;
    protected lastHealthCheck: DatabaseHealth | null = null;
    protected migrationManager: MigrationManager | null = null;

    constructor(config: DatabaseConfig) {
        this.config = {
            enableLogging: true,
            maxRetries: 3,
            retryDelay: 1000,
            ...config,
        };
    }

    abstract initialize(): Promise<SQLiteDatabase>;
    abstract isSupported(): boolean;

    async getDatabase(): Promise<SQLiteDatabase> {
        if (!this.initialized || !this.database) {
            throw new Error(`Database not initialized. Call initialize() first.`);
        }
        return this.database;
    }

    protected async runMigrations(): Promise<void> {
        if (!this.database) {
            throw new Error('Database must be initialized before running migrations');
        }

        this.migrationManager = new MigrationManager(this.database, {
            enableLogging: this.config.enableLogging
        });

        try {
            this.log('info', 'Starting database migrations...');
            const results = await this.migrationManager.migrate();

            if (results.length > 0) {
                const successful = results.filter(r => r.success).length;
                const failed = results.filter(r => !r.success).length;

                this.log('info', `Migrations completed: ${successful} successful, ${failed} failed`);

                if (failed > 0) {
                    throw new Error(`${failed} migrations failed`);
                }
            }
        } catch (error) {
            this.log('error', 'Migration failed:', error);
            throw error;
        }
    }

    async getMigrationHistory() {
        if (!this.migrationManager) {
            throw new Error('Migration manager not initialized');
        }
        return await this.migrationManager.getMigrationHistory();
    }

    async validateMigrations() {
        if (!this.migrationManager) {
            throw new Error('Migration manager not initialized');
        }
        return await this.migrationManager.validateMigrations();
    }

    async healthCheck(): Promise<DatabaseHealth> {
        const startTime = Date.now();

        try {
            if (!this.database) {
                throw new Error('Database not initialized');
            }

            // Simple health check query
            await this.database.execAsync('SELECT 1');

            this.lastHealthCheck = {
                isConnected: true,
                lastChecked: new Date(),
                connectionTime: Date.now() - startTime,
            };
        } catch (error) {
            this.lastHealthCheck = {
                isConnected: false,
                lastChecked: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }

        return this.lastHealthCheck;
    }

    async reconnect(): Promise<void> {
        this.log('info', 'Attempting to reconnect to database...');

        try {
            await this.cleanup();
            await this.initialize();
            this.log('info', 'Database reconnection successful');
        } catch (error) {
            this.log('error', 'Database reconnection failed:', error);
            throw error;
        }
    }

    async cleanup(): Promise<void> {
        if (this.database) {
            try {
                await this.database.closeAsync();
                this.log('info', 'Database connection closed');
            } catch (error) {
                this.log('warn', 'Error closing database:', error);
            }
        }

        this.database = null;
        this.initialized = false;
        this.lastHealthCheck = null;
        this.migrationManager = null;
    }

    protected async executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt === this.config.maxRetries) {
                    this.log('error', `${operationName} failed after ${attempt} attempts:`, lastError);
                    break;
                }

                this.log('warn', `${operationName} attempt ${attempt} failed, retrying...`, lastError);
                await this.delay(this.config.retryDelay! * attempt);
            }
        }

        throw new DatabaseError(`${operationName} failed after ${this.config.maxRetries} attempts`, lastError);
    }

    protected log(level: 'info' | 'warn' | 'error', message: string, error?: any): void {
        if (!this.config.enableLogging) return;

        const timestamp = new Date().toISOString();
        const prefix = `[DatabaseService:${this.config.databaseName}] ${timestamp}`;

        switch (level) {
            case 'info':
                console.log(`${prefix} INFO: ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} WARN: ${message}`, error || '');
                break;
            case 'error':
                console.error(`${prefix} ERROR: ${message}`, error || '');
                break;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Getters for monitoring
    get isInitialized(): boolean {
        return this.initialized;
    }

    get configuration(): DatabaseConfig {
        return { ...this.config };
    }

    get healthStatus(): DatabaseHealth | null {
        return this.lastHealthCheck;
    }
}
