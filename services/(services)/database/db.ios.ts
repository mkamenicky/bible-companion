import {Asset} from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import {openDatabaseAsync, openDatabaseSync, SQLiteDatabase} from 'expo-sqlite';
import {DatabaseError} from '@/errors';
import {DatabaseService} from '@/services';
import type {DatabaseConfig} from '@/models';

export class IOSDatabaseService extends DatabaseService {
    private dbPath: string;
    private sqlDir: string;
    private dbName: string;
    private assetPath: string;

    constructor(config: DatabaseConfig, assetPath: string = '../../assets/bible_ios.db') {
        super(config);
        this.assetPath = assetPath;
        this.sqlDir = `${FileSystem.documentDirectory}SQLite/`;
        this.dbPath = `${this.sqlDir}${config.databaseName}`;
        this.dbName = config.databaseName;
    }

    isSupported(): boolean {
        return true; // SQLite is supported on ios platforms
    }

    async initialize(): Promise<SQLiteDatabase> {
        if (this.initialized && this.database) {
            return this.database;
        }

        return this.executeWithRetry(async () => {
            await this.setupDatabase();
            await this.openDatabase();
            await this.verifyDatabase();

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
                await FileSystem.deleteAsync(this.dbPath, { idempotent: true });
            }

            // Ensure SQLite directory exists
            await FileSystem.makeDirectoryAsync(this.sqlDir, { intermediates: true });

            // Load and download the asset
            this.log('info', 'Loading database asset...');
            const bibleDbAsset = Asset.fromModule(require('../../../assets/bible_ios.db'));

            await bibleDbAsset.downloadAsync();
            this.log('info', 'Database asset downloaded');

            if (!bibleDbAsset.localUri) {
                throw new Error('Failed to get local URI for database asset');
            }

            this.log('info', `Copying database from ${bibleDbAsset.localUri} to ${this.dbPath}`);
            await FileSystem.copyAsync({
                from: bibleDbAsset.localUri,
                to: this.dbPath,
            });

            const copiedDbInfo = await FileSystem.getInfoAsync(this.dbPath);
            this.log('info', `Database file copied successfully. Size: ${copiedDbInfo.exists ? copiedDbInfo.size : 0} bytes`);
        } catch (error) {
            throw new DatabaseError('Failed to setup database file', error instanceof Error ? error : new Error(String(error)));
        }
    }

    private async openDatabase(): Promise<void> {
        try {
            this.log('info', `Opening database: ${this.dbName}`);
            this.database = await openDatabaseAsync(this.dbName);

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
        this.log('info', 'IOS database cleanup completed');
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
let iosDatabaseService: IOSDatabaseService | null = null;

export const createIOSDatabaseService = (config?: Partial<DatabaseConfig>): IOSDatabaseService => {
    const defaultConfig: DatabaseConfig = {
        databaseName: 'bible_ios.db',
        version: 1,
        enableLogging: __DEV__,
        maxRetries: 3,
        retryDelay: 1000,
    };

    iosDatabaseService = new IOSDatabaseService({...defaultConfig, ...config});
    return iosDatabaseService;
};

export const getIOSDatabaseService = (): IOSDatabaseService => {
    if (!iosDatabaseService) {
        iosDatabaseService = createIOSDatabaseService();
    }
    return iosDatabaseService;
};

// Legacy support functions
export const initDatabase = async (): Promise<SQLiteDatabase> => {
    const service = getIOSDatabaseService();
    return await service.initialize();
};

export const getDatabase = (): SQLiteDatabase => {
    const service = getIOSDatabaseService();
    if (!service.isInitialized) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    // This is a synchronous wrapper - in production, consider making this async
    return service.database!;
};
