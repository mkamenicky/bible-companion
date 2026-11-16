import {Platform} from 'react-native';
import {Asset} from 'expo-asset';
// SDK 54 made the new File/Directory API the default export of
// expo-file-system; the function-based API used here lives under /legacy.
import * as FileSystem from 'expo-file-system/legacy';
import {openDatabaseAsync, SQLiteDatabase} from 'expo-sqlite';
import {DatabaseError} from '@/errors';
import {MigrationManager} from '@/services/(services)/database/MigrationManager';
import {logger} from '@/utils/(utils)/logger';

/**
 * Database bootstrap.
 *
 * The app ships a pre-populated SQLite file (assets/bible.db). On first launch
 * it is copied into expo-sqlite's own directory and opened by name; after that
 * only migrations run. This is the single place that knows where the file is.
 */

export const DATABASE_NAME = 'bible.db';

/** expo-sqlite's default directory, the same on iOS and Android. */
const SQLITE_DIRECTORY = `${FileSystem.documentDirectory}SQLite/`;
const DATABASE_PATH = `${SQLITE_DIRECTORY}${DATABASE_NAME}`;
const TEMP_COPY_PATH = `${DATABASE_PATH}.copying`;

/**
 * Where Android builds up to 1.0.3 kept the database (the document root).
 * It is moved to DATABASE_PATH once so existing users keep their progress.
 */
const LEGACY_ANDROID_PATH = `${FileSystem.documentDirectory}${DATABASE_NAME}`;

/** SQLite side files that must always travel together with the main file. */
const SIDE_FILE_SUFFIXES = ['-journal', '-wal', '-shm'];

/**
 * The bundled database is roughly 60 MB. Anything this small is an empty file
 * left behind by a failed first launch and can be replaced safely.
 */
const MIN_VALID_SIZE_BYTES = 1024 * 1024;

let database: SQLiteDatabase | null = null;
let pendingInit: Promise<SQLiteDatabase> | null = null;

/**
 * Opens the database, creating it from the bundled asset on first launch.
 * Safe to call repeatedly and concurrently; all callers share one connection.
 */
export function initDatabase(): Promise<SQLiteDatabase> {
    if (database) return Promise.resolve(database);

    if (!pendingInit) {
        pendingInit = openAndPrepare().finally(() => {
            pendingInit = null;
        });
    }
    return pendingInit;
}

/**
 * Returns the open connection.
 * Throws when called before initDatabase() has finished.
 */
export function getDatabase(): SQLiteDatabase {
    if (!database) {
        throw new DatabaseError('Database not initialized. Call initDatabase() first.');
    }
    return database;
}

export function isDatabaseReady(): boolean {
    return database !== null;
}

/** Absolute file URI of the live database file (for backup and restore). */
export function getDatabaseFilePath(): string {
    return DATABASE_PATH;
}

/** Closes the connection, e.g. before the file is replaced by a restore. */
export async function closeDatabase(): Promise<void> {
    const current = database;
    database = null;
    if (!current) return;

    try {
        await current.closeAsync();
    } catch (error) {
        logger.warn('Error while closing database', error);
    }
}

/**
 * Replaces the database with the file at `sourceUri` and reopens it. Used by
 * "restore backup". If the new file cannot be opened, the previous database
 * is put back, so a bad backup file never costs the user their data.
 */
export async function replaceDatabaseFile(sourceUri: string): Promise<void> {
    const stagedPath = `${DATABASE_PATH}.restoring`;
    const previousPath = `${DATABASE_PATH}.previous`;

    await FileSystem.makeDirectoryAsync(SQLITE_DIRECTORY, {intermediates: true});
    await FileSystem.deleteAsync(stagedPath, {idempotent: true});
    await FileSystem.copyAsync({from: sourceUri, to: stagedPath});

    if (!await isUsableFile(stagedPath)) {
        await FileSystem.deleteAsync(stagedPath, {idempotent: true});
        throw new DatabaseError('The backup file is empty or incomplete');
    }

    await closeDatabase();
    await FileSystem.deleteAsync(previousPath, {idempotent: true});

    const hadPrevious = (await FileSystem.getInfoAsync(DATABASE_PATH)).exists;
    if (hadPrevious) {
        await FileSystem.moveAsync({from: DATABASE_PATH, to: previousPath});
    }
    await deleteDatabaseFiles(DATABASE_PATH);
    await FileSystem.moveAsync({from: stagedPath, to: DATABASE_PATH});

    try {
        await initDatabase();
    } catch (error) {
        if (hadPrevious) {
            await closeDatabase();
            await deleteDatabaseFiles(DATABASE_PATH);
            await FileSystem.moveAsync({from: previousPath, to: DATABASE_PATH});
            await initDatabase();
        }
        throw new DatabaseError('The backup could not be opened; your previous data was kept', error);
    }

    await FileSystem.deleteAsync(previousPath, {idempotent: true});
}

/**
 * Deletes the local database (all reading history!) and recreates it from
 * the bundled asset. Only offered to the user when the database is unusable.
 */
export async function resetDatabase(): Promise<void> {
    await closeDatabase();
    await deleteDatabaseFiles(DATABASE_PATH);
    await initDatabase();
}

// ---------------------------------------------------------------------------

async function openAndPrepare(): Promise<SQLiteDatabase> {
    if (Platform.OS === 'web') {
        throw new DatabaseError('The offline database is not available in the web build');
    }

    await ensureDatabaseFile();

    let connection: SQLiteDatabase;
    try {
        connection = await openDatabaseAsync(DATABASE_NAME);
    } catch (error) {
        throw new DatabaseError('Failed to open database', error);
    }

    try {
        await verifyBibleData(connection);
        await new MigrationManager(connection).migrate();
    } catch (error) {
        await connection.closeAsync().catch(() => undefined);
        throw error instanceof DatabaseError ? error : new DatabaseError('Failed to prepare database', error);
    }

    database = connection;
    logger.info('Database ready');
    return connection;
}

/** Makes sure a complete database file exists at DATABASE_PATH. */
async function ensureDatabaseFile(): Promise<void> {
    try {
        // The SQLite directory does not exist on a fresh install. Copying into
        // it without creating it first was one reason first launches failed.
        await FileSystem.makeDirectoryAsync(SQLITE_DIRECTORY, {intermediates: true});
        await FileSystem.deleteAsync(TEMP_COPY_PATH, {idempotent: true});

        if (await isUsableFile(DATABASE_PATH)) return;

        // Missing, or an empty stub from an earlier failed start.
        await deleteDatabaseFiles(DATABASE_PATH);

        if (Platform.OS === 'android' && await isUsableFile(LEGACY_ANDROID_PATH)) {
            logger.info('Moving database from legacy location');
            await moveDatabaseFiles(LEGACY_ANDROID_PATH, DATABASE_PATH);
            return;
        }

        await copyBundledDatabase();
    } catch (error) {
        throw new DatabaseError('Failed to set up the database file', error);
    }
}

async function copyBundledDatabase(): Promise<void> {
    logger.info('Installing bundled database');
    const asset = Asset.fromModule(require('../../../assets/bible.db'));
    // No-op when the asset is already available locally.
    await asset.downloadAsync();
    if (!asset.localUri) {
        throw new Error('Bundled database asset could not be loaded');
    }

    // Copy under a temporary name and rename afterwards: if the app is killed
    // half-way, no truncated file is left where the real database is expected.
    await FileSystem.copyAsync({from: asset.localUri, to: TEMP_COPY_PATH});
    if (!await isUsableFile(TEMP_COPY_PATH)) {
        throw new Error('Copied database file is incomplete');
    }
    await FileSystem.moveAsync({from: TEMP_COPY_PATH, to: DATABASE_PATH});
}

async function verifyBibleData(connection: SQLiteDatabase): Promise<void> {
    try {
        const row = await connection.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM BibleBook');
        if (!row || row.count === 0) {
            throw new Error('Bible tables are empty');
        }
    } catch (error) {
        throw new DatabaseError('Database file is damaged or incomplete', error);
    }
}

async function isUsableFile(path: string): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists && !info.isDirectory && (info.size ?? 0) >= MIN_VALID_SIZE_BYTES;
}

async function deleteDatabaseFiles(path: string): Promise<void> {
    await FileSystem.deleteAsync(path, {idempotent: true});
    for (const suffix of SIDE_FILE_SUFFIXES) {
        await FileSystem.deleteAsync(`${path}${suffix}`, {idempotent: true});
    }
}

async function moveDatabaseFiles(from: string, to: string): Promise<void> {
    // Side files first, so the main file never sits at the target without them.
    for (const suffix of SIDE_FILE_SUFFIXES) {
        const sideFile = await FileSystem.getInfoAsync(`${from}${suffix}`);
        if (sideFile.exists) {
            await FileSystem.moveAsync({from: `${from}${suffix}`, to: `${to}${suffix}`});
        }
    }
    await FileSystem.moveAsync({from, to});
}
