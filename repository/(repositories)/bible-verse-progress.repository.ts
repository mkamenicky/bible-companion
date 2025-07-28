import {BaseRepository} from '@/repository/base/base.repository';
import type {BibleVerseProgress, CreateBibleVerseProgressDto, UpdateBibleVerseProgressDto} from '@/models';

/**
 * Repository class for managing BibleVerseProgress entities
 */
export class BibleVerseProgressRepository extends BaseRepository<BibleVerseProgress, CreateBibleVerseProgressDto, UpdateBibleVerseProgressDto> {
    protected tableName = 'BibleVerseProgress';
    protected primaryKeyColumn = 'id';

    /**
     * Validates BibleVerseProgress input
     */
    private validateInput(progress: Partial<CreateBibleVerseProgressDto | UpdateBibleVerseProgressDto>): void {
        if (progress.bibleVerseId !== undefined) {
            this.validateId(progress.bibleVerseId, 'bibleVerseId');
        }
        if (progress.dateRead !== undefined) {
            this.validateString(progress.dateRead, 'dateRead');
        }
    }

    protected mapRowToEntity(row: any): BibleVerseProgress {
        return {
            id: row.id,
            bibleVerseId: row.bibleVerseId,
            dateRead: row.dateRead,
            isRead: Boolean(row.isRead)
        };
    }

    protected getCreateSql(progress: CreateBibleVerseProgressDto): { sql: string; params: any[] } {
        this.validateInput(progress);
        return {
            sql: `INSERT INTO BibleVerseProgress (bibleVerseId, dateRead, isRead)
                  VALUES (?, ?, ?)`,
            params: [
                progress.bibleVerseId,
                progress.dateRead,
                progress.isRead ? 1 : 0
            ]
        };
    }

    protected getUpdateSql(progress: UpdateBibleVerseProgressDto): { sql: string; params: any[] } {
        this.validateInput(progress);
        return {
            sql: `UPDATE BibleVerseProgress
                  SET bibleVerseId = COALESCE(?, bibleVerseId),
                      dateRead     = COALESCE(?, dateRead),
                      isRead       = COALESCE(?, isRead)
                  WHERE id = ?`,
            params: [
                progress.bibleVerseId,
                progress.dateRead,
                progress.isRead !== undefined ? (progress.isRead ? 1 : 0) : undefined,
                progress.id
            ]
        };
    }

}

/**
 * Singleton instance of BibleVerseProgressRepository
 */
export const bibleVerseProgressRepository = new BibleVerseProgressRepository();
