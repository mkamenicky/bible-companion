import {Asset} from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import {openDatabaseAsync, SQLiteDatabase} from 'expo-sqlite';
import {DatabaseService} from '@/services/(services)/database/DatabaseService';
import {DatabaseError } from '@/errors'
import type {DatabaseConfig} from '@/models';

export class AndroidDatabaseService extends DatabaseService {
    private dbPath: string;
    private assetPath: string;

    constructor(config: DatabaseConfig, assetPath: string = '../../assets/bible.db') {
        super(config);
        this.assetPath = assetPath;
        this.dbPath = `${FileSystem.documentDirectory}${config.databaseName}`;
    }

    isSupported(): boolean {
        return true; // SQLite is supported on android platforms
    }

    async initialize(): Promise<SQLiteDatabase> {
        if (this.initialized && this.database) {
            return this.database;
        }

        return this.executeWithRetry(async () => {
            await this.setupDatabase();
            await this.openDatabase();
            await this.verifyDatabase();
            await this.runMigrations();

            this.initialized = true;
            this.log('info', `Database initialized successfully at: ${this.dbPath}`);

            return this.database!;
        }, 'Database initialization');
    }

    private async setupDatabase(): Promise<void> {
        try {
            // Check if database already exists
            const dbInfo = await FileSystem.getInfoAsync(this.dbPath);

            if (dbInfo.exists) {
                console.log("Database already exists, skip copying asset...");
                return;
            }

            // Load and download the asset
            this.log('info', 'Loading database asset...');
            const bibleDbAsset = Asset.fromModule(require('../../../assets/bible.db'));

            if (!bibleDbAsset.downloaded) {
                await bibleDbAsset.downloadAsync();
                this.log('info', 'Database asset downloaded');
            }

            if (!bibleDbAsset.localUri) {
                throw new Error('Failed to get local URI for database asset');
            }

            // Copy the database file
            this.log('info', `Copying database from ${bibleDbAsset.localUri} to ${this.dbPath}`);
            await FileSystem.copyAsync({
                from: bibleDbAsset.localUri,
                to: this.dbPath,
            });

            const copiedDbInfo = await FileSystem.getInfoAsync('bible.db');
            this.log('info', `Copied DB exists: ${copiedDbInfo.exists}, size: ${copiedDbInfo.exists ? copiedDbInfo.size : 0} bytes`);

            const dbTest = await openDatabaseAsync('bible.db'); // <- This line fails
            const testRow = await dbTest.getFirstAsync("SELECT name FROM sqlite_master LIMIT 1");
            console.log("✅ DB opened manually. Tables:", testRow);

            this.log('info', 'Database file copied successfully');
        } catch (error) {
            throw new DatabaseError('Failed to setup database file', error instanceof Error ? error : new Error(String(error)));
        }
    }

    private async openDatabase(): Promise<void> {
        try {
            this.log('info', `Opening database at: ${this.dbPath}`);
            this.database = await openDatabaseAsync(this.dbPath);

            if (!this.database) {
                throw new Error('Failed to open database - null returned');
            }

            this.log('info', 'Database opened successfully');
        } catch (error) {
            throw new DatabaseError('Failed to open database', error instanceof Error ? error : new Error(String(error)));
        }
    }

    private async verifyDatabase(): Promise<void> {
        if (!this.database) {
            throw new Error('Database is null during verification');
        }

        try {
            // Perform basic verification queries
            const result = await this.database.getFirstAsync("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1");

            if (!result) {
                throw new Error('Database appears to be empty or corrupted');
            }

            this.log('info', 'Database verification passed');
        } catch (error) {
            throw new DatabaseError('Database verification failed', error instanceof Error ? error : new Error(String(error)));
        }
    }

    async cleanup(): Promise<void> {
        await super.cleanup();
        this.log('info', 'Android database cleanup completed');
    }

    // Utility methods for database management
    async getDatabaseSize(): Promise<number> {
        try {
            const dbInfo = await FileSystem.getInfoAsync(this.dbPath);
            return dbInfo.exists ? dbInfo.size || 0 : 0;
        } catch (error) {
            this.log('warn', 'Failed to get database size:', error);
            return 0;
        }
    }

    async backupDatabase(backupPath?: string): Promise<string> {
        const targetPath = backupPath || `${this.dbPath}.backup.${Date.now()}`;

        try {
            await FileSystem.copyAsync({
                from: this.dbPath,
                to: targetPath,
            });

            this.log('info', `Database backed up to: ${targetPath}`);
            return targetPath;
        } catch (error) {
            throw new DatabaseError('Failed to backup database', error instanceof Error ? error : new Error(String(error)));
        }
    }
}

// Singleton instance
let androidDatabaseService: AndroidDatabaseService | null = null;

export const createAndroidDatabaseService = (config?: Partial<DatabaseConfig>): AndroidDatabaseService => {
    const defaultConfig: DatabaseConfig = {
        databaseName: 'bible.db',
        version: 1,
        enableLogging: __DEV__,
        maxRetries: 3,
        retryDelay: 1000,
    };

    androidDatabaseService = new AndroidDatabaseService({...defaultConfig, ...config});
    return androidDatabaseService;
};

export const getAndroidDatabaseService = (): AndroidDatabaseService => {
    if (!androidDatabaseService) {
        androidDatabaseService = createAndroidDatabaseService();
    }
    return androidDatabaseService;
};

// Legacy support functions
export const initDatabase = async (): Promise<SQLiteDatabase> => {
    const service = getAndroidDatabaseService();
    return await service.initialize();
};

export const getDatabase = (): SQLiteDatabase => {
    const service = getAndroidDatabaseService();
    if (!service.isInitialized) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    // This is a synchronous wrapper - in production, consider making this async
    return service.database!;
};
