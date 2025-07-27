/**
 * Database row interfaces for type-safe database operations
 */

export interface ReadingRow {
  chapter: string;
}

export interface TaskRow {
  task_name: string;
  is_done: number;
}

export interface DatabaseConfig {
    databaseName: string;
    version: number;
    enableLogging?: boolean;
    maxRetries?: number;
    retryDelay?: number;
}

export interface DatabaseHealth {
    isConnected: boolean;
    lastChecked: Date;
    connectionTime?: number;
    error?: string;
}

export interface CountRow {
  readChapters: number;
}

export interface TotalCountRow {
  totalChapters: number;
}

export interface VerseProgressRow {
  bibleVerseId: number;
}

export interface ChapterRangeRow {
  FirstVerseId: number;
  LastVerseId: number;
}

export interface ProgressCountRow {
  count: number;
}

/**
 * Mutable version of TaskStates for building results
 */
export interface MutableTaskStates {
  [key: string]: boolean;
}
