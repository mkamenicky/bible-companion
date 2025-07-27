import { SQLiteDatabase } from 'expo-sqlite';
import { DatabaseService} from '@/services/(services)/database/DatabaseService';
import { DatabaseError } from '@/errors';
import type { DatabaseConfig } from '@/models';

export class WebDatabaseService extends DatabaseService {
    private mockDatabase: MockDatabase | null = null;

    constructor(config: DatabaseConfig) {
        super(config);
    }

    isSupported(): boolean {
        return false; // SQLite is not natively supported on web
    }

    async initialize(): Promise<SQLiteDatabase> {
        return this.executeWithRetry(async () => {
            this.log('warn', 'SQLite is not natively supported on web platform');

            // Create a mock database for development/testing
            if (__DEV__) {
                this.mockDatabase = new MockDatabase();
                this.database = this.mockDatabase as unknown as SQLiteDatabase;
                this.initialized = true;

                this.log('info', 'Mock database initialized for web development');
                return this.database;
            }

            throw new DatabaseError('SQLite is not available on web platform');
        }, 'Web database initialization');
    }

    async cleanup(): Promise<void> {
        if (this.mockDatabase) {
            this.mockDatabase.cleanup();
            this.mockDatabase = null;
        }

        await super.cleanup();
        this.log('info', 'Web database cleanup completed');
    }

    // Web-specific methods for alternative storage
    async initializeWebStorage(): Promise<void> {
        if (typeof Storage === 'undefined') {
            throw new DatabaseError('Web Storage is not available');
        }

        this.log('info', 'Web Storage is available as fallback');
    }

    async useIndexedDB(): Promise<void> {
        if (!('indexedDB' in window)) {
            throw new DatabaseError('IndexedDB is not available');
        }

        this.log('info', 'IndexedDB is available as alternative storage');
        // TODO: Implement IndexedDB adapter
    }
}

// Mock database for development/testing on web
class MockDatabase {
    private mockData: Map<string, any[]> = new Map();
    private isOpen: boolean = true;

    constructor() {
        this.initializeMockData();
    }

    private initializeMockData(): void {
        // Initialize with some mock data for development
        this.mockData.set('verses', [
            { id: 1, book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning...' },
            { id: 2, book: 'Genesis', chapter: 1, verse: 2, text: 'Now the earth was formless...' },
        ]);
    }

    async execAsync(query: string): Promise<any> {
        console.log(`[MockDB] Executing query: ${query}`);
        return { changes: 0, insertId: 0 };
    }

    async getFirstAsync(query: string): Promise<any> {
        console.log(`[MockDB] Getting first result for: ${query}`);

        // Simple mock for table check
        if (query.includes('sqlite_master')) {
            return { name: 'mock_table' };
        }

        return this.mockData.values().next().value?.[0] || null;
    }

    async getAllAsync(query: string): Promise<any[]> {
        console.log(`[MockDB] Getting all results for: ${query}`);
        return Array.from(this.mockData.values()).flat();
    }

    async closeAsync(): Promise<void> {
        console.log('[MockDB] Closing mock database');
        this.isOpen = false;
    }

    cleanup(): void {
        this.mockData.clear();
        this.isOpen = false;
    }
}

// Singleton instance
let webDatabaseService: WebDatabaseService | null = null;

export const createWebDatabaseService = (config?: Partial<DatabaseConfig>): WebDatabaseService => {
    const defaultConfig: DatabaseConfig = {
        databaseName: 'bible_ios.db',
        version: 1,
        enableLogging: __DEV__,
        maxRetries: 1, // Fewer retries for web
        retryDelay: 500,
    };

    webDatabaseService = new WebDatabaseService({ ...defaultConfig, ...config });
    return webDatabaseService;
};

export const getWebDatabaseService = (): WebDatabaseService => {
    if (!webDatabaseService) {
        webDatabaseService = createWebDatabaseService();
    }
    return webDatabaseService;
};

// Legacy support functions
export const initDatabase = async (): Promise<SQLiteDatabase> => {
    const service = getWebDatabaseService();

    try {
        return await service.initialize();
    } catch (error) {
        console.warn('SQLite not available on web, consider using alternative storage methods');
        throw error;
    }
};

export const getDatabase = (): SQLiteDatabase => {
    const service = getWebDatabaseService();

    if (!service.isInitialized) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }

    if (!service.isSupported()) {
        console.warn('Using mock database on web platform');
    }

    return service.database!;
};

// Web-specific utility functions
export const isWebStorageAvailable = (): boolean => {
    return typeof Storage !== 'undefined';
};

export const isIndexedDBAvailable = (): boolean => {
    return 'indexedDB' in window;
};

export const getWebStorageAlternatives = (): string[] => {
    const alternatives: string[] = [];

    if (isWebStorageAvailable()) {
        alternatives.push('localStorage', 'sessionStorage');
    }

    if (isIndexedDBAvailable()) {
        alternatives.push('IndexedDB');
    }

    return alternatives;
};
