import {Platform} from 'react-native';
import {SQLiteDatabase} from 'expo-sqlite';
import {AndroidDatabaseService} from '@/services/(services)/database/db.android';
import {DatabaseService} from '@/services/(services)/database/DatabaseService';
import {IOSDatabaseService} from '@/services/(services)/database/db.ios';
import {WebDatabaseService} from '@/services/(services)/database/db.web';
import type {DatabaseConfig} from '@/models';
import {logger} from "@/utils/(utils)/logger";

export class DatabaseManager {
    private static instance: DatabaseManager | null = null;
    private databaseService: DatabaseService | null = null;
    private config: DatabaseConfig;

    private constructor(config: DatabaseConfig) {
        this.config = config;
    }

    static getInstance(config?: Partial<DatabaseConfig>): DatabaseManager {
        if (!DatabaseManager.instance) {
            const defaultConfig: DatabaseConfig = {
                databaseName: 'bible.db',
                version: 1,
                enableLogging: __DEV__,
                maxRetries: 3,
                retryDelay: 1000,
            };

            const finalConfig = {...defaultConfig, ...config};
            DatabaseManager.instance = new DatabaseManager(finalConfig);
        }

        return DatabaseManager.instance;
    }

    private createDatabaseService(): DatabaseService {
        if (Platform.OS === 'web') {
            return new WebDatabaseService(this.config);
        } else if (Platform.OS === 'ios') {
            return new IOSDatabaseService(this.config);
        } else {
            return new AndroidDatabaseService(this.config);
        }
    }

    async initialize(): Promise<SQLiteDatabase> {
        if (!this.databaseService) {
            this.databaseService = this.createDatabaseService();
        }

        if (!this.databaseService.isSupported()) {
            logger.warn(`Database not supported on platform: ${Platform.OS}`);
        }

        return await this.databaseService.initialize();
    }

    async getDatabase(): Promise<SQLiteDatabase> {
        if (!this.databaseService || !this.databaseService.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }

        return await this.databaseService.getDatabase();
    }

    async healthCheck() {
        if (!this.databaseService) {
            return {
                isConnected: false,
                lastChecked: new Date(),
                error: 'Database service not initialized',
            };
        }

        return await this.databaseService.healthCheck();
    }

    async reconnect(): Promise<void> {
        if (!this.databaseService) {
            throw new Error('Database service not initialized');
        }

        await this.databaseService.reconnect();
    }

    async cleanup(): Promise<void> {
        if (this.databaseService) {
            await this.databaseService.cleanup();
            this.databaseService = null;
        }
    }

    // Utility methods
    get isInitialized(): boolean {
        return this.databaseService?.isInitialized ?? false;
    }

    get isSupported(): boolean {
        if (!this.databaseService) {
            this.databaseService = this.createDatabaseService();
        }
        return this.databaseService.isSupported();
    }

    get platformInfo(): { platform: string; supported: boolean } {
        return {
            platform: Platform.OS,
            supported: this.isSupported,
        };
    }

    // Static convenience methods
    static async init(config?: Partial<DatabaseConfig>): Promise<SQLiteDatabase> {
        const manager = DatabaseManager.getInstance(config);
        return await manager.initialize();
    }

    static async getDB(): Promise<SQLiteDatabase> {
        const manager = DatabaseManager.getInstance();
        return await manager.getDatabase();
    }

    static async cleanup(): Promise<void> {
        if (DatabaseManager.instance) {
            await DatabaseManager.instance.cleanup();
            DatabaseManager.instance = null;
        }
    }
}

// Legacy support exports
export const initDatabase = DatabaseManager.init;
export const getDatabase = async (): Promise<SQLiteDatabase> => {
    return await DatabaseManager.getDB();
};
