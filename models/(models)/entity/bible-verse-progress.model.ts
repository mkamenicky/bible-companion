/**
 * Interface for BibleVerseProgress entity
 */
export interface BibleVerseProgress {
    readonly id: number;
    readonly bibleVerseId: number;
    readonly dateRead: string;
    readonly isRead: boolean;
}

/**
 * DTO for creating a new BibleVerseProgress
 */
export interface CreateBibleVerseProgressDto {
    readonly bibleVerseId: number;
    readonly dateRead: string;
    readonly isRead?: boolean;
}

/**
 * DTO for updating an existing BibleVerseProgress
 */
export interface UpdateBibleVerseProgressDto {
    readonly id: number;
    readonly bibleVerseId?: number;
    readonly dateRead?: string;
    readonly isRead?: boolean;
}
