import {Asset} from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import {openDatabaseAsync, SQLiteDatabase} from 'expo-sqlite';
import {DatabaseError} from '@/errors';
import {DatabaseService} from '@/services/(services)/database/DatabaseService';
import type {DatabaseConfig} from '@/models';
import {logger} from "@/utils/(utils)/logger";

export class IOSDatabaseService extends DatabaseService {
    private dbPath: string;
    private sqlDir: string;
    private dbName: string;
    private assetPath: string;

    constructor(config: DatabaseConfig, assetPath: string = '../../assets/bible.db') {
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
            await this.runMigrations();

            this.initialized = true;
            logger.info(`Database initialized successfully at: ${this.dbPath}`);

            return this.database!;
        }, 'Database initialization');
    }

    async cleanup(): Promise<void> {
        await super.cleanup();
        logger.info('IOS database cleanup completed');
    }

    private async setupDatabase(): Promise<void> {
        try {
            // Check if database already exists
            const dbInfo = await FileSystem.getInfoAsync(this.dbPath);

            if (dbInfo.exists) {
                logger.debug("Database already exists, skip copying asset...");
                return;
            }

            // Load and download the asset
            logger.info('Loading database asset...');
            const bibleDbAsset = Asset.fromModule(require('../../../assets/bible.db'));

            await bibleDbAsset.downloadAsync();
            logger.info('Database asset downloaded');

            if (!bibleDbAsset.localUri) {
                throw new Error('Failed to get local URI for database asset');
            }

            // Copy the database file
            logger.info(`Copying database from ${bibleDbAsset.localUri} to ${this.dbPath}`);
            await FileSystem.copyAsync({
                from: bibleDbAsset.localUri,
                to: this.dbPath,
            });

            const copiedDbInfo = await FileSystem.getInfoAsync(this.dbPath);
            logger.info(`Copied DB exists: ${copiedDbInfo.exists}, size: ${copiedDbInfo.exists ? copiedDbInfo.size : 0} bytes`);

            const dbTest = await openDatabaseAsync(this.dbPath); // <- This line fails
            const testRow = await dbTest.getFirstAsync("SELECT name FROM sqlite_master LIMIT 1");
            logger.debug("✅ DB opened manually. Tables:", testRow);

            logger.info('Database file copied successfully');
        } catch (error) {
            throw new DatabaseError('Failed to setup database file', error instanceof Error ? error : new Error(String(error)));
        }
    }

    private async openDatabase(): Promise<void> {
        try {
            logger.info(`Opening database: ${this.dbName}`);
            this.database = await openDatabaseAsync(this.dbName);

            if (!this.database) {
                throw new Error('Failed to open database - null returned');
            }

            logger.info('Database opened successfully');
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

            logger.info('Database verification passed');
        } catch (error) {
            throw new DatabaseError('Database verification failed', error instanceof Error ? error : new Error(String(error)));
        }
    }
}

// Singleton instance
let iosDatabaseService: IOSDatabaseService | null = null;

export const createIOSDatabaseService = (config?: Partial<DatabaseConfig>): IOSDatabaseService => {
    const defaultConfig: DatabaseConfig = {
        databaseName: 'bible.db',
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
