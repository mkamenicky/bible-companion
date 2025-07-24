import {Asset} from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import {openDatabaseAsync, SQLiteDatabase} from 'expo-sqlite';

let dbNative: SQLiteDatabase | null = null;
export const initDatabase = async () => {
    const bibleDbAsset = Asset.fromModule(require('../assets/bible.db'));
    await bibleDbAsset.downloadAsync();
    const localUri = bibleDbAsset.localUri!;

    const dbPath = FileSystem.documentDirectory + 'bible.db';
    await FileSystem.copyAsync({
        from: localUri,
        to: dbPath,
    });

    // Fix: Open using the SAME path you copied to
    dbNative = await openDatabaseAsync(dbPath);  // Use absolute path!

    console.log('✅ SQLite initialized');
    return dbNative;
};


export const getDatabase = (): SQLiteDatabase => {
    if (!dbNative) throw new Error('Database not initialized.');
    return dbNative;
};
