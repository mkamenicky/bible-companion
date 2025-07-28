import {BaseRepository} from '@/repository/base/base.repository';
import type { BibleBook, CreateBibleBookDto, UpdateBibleBookDto } from '@/models';

/**
 * Repository class for managing BibleBook entities
 */
export class BibleBookRepository extends BaseRepository<BibleBook, CreateBibleBookDto, UpdateBibleBookDto> {
    protected tableName = 'BibleBook';
    protected primaryKeyColumn = 'BibleBookId';

    /**
     * Validates BibleBook input
     */
    private validateBibleBookInput(bibleBook: Partial<BibleBook>): void {
        if (bibleBook.BibleBookId !== undefined) {
            this.validateId(bibleBook.BibleBookId, 'BibleBookId');
        }
    }

    protected mapRowToEntity(row: any): BibleBook {
        return {
            BibleBookId: row.BibleBookId,
            BookDocumentId: row.BookDocumentId,
            IntroDocumentId: row.IntroDocumentId,
            OverviewDocumentId: row.OverviewDocumentId,
            OutlineDocumentId: row.OutlineDocumentId,
            BookDisplayTitle: row.BookDisplayTitle,
            BookDisplayTitleRich: row.BookDisplayTitleRich,
            ChapterDisplayTitle: row.ChapterDisplayTitle,
            ChapterDisplayTitleRich: row.ChapterDisplayTitleRich,
            PublicationId: row.PublicationId,
            FirstVerseId: row.FirstVerseId,
            LastVerseId: row.LastVerseId,
            HasCommentary: row.HasCommentary
        };
    }

    protected getCreateSql(bibleBook: CreateBibleBookDto): { sql: string; params: any[] } {
        this.validateBibleBookInput(bibleBook);
        return {
            sql: `INSERT INTO BibleBook (
                    BibleBookId, BookDocumentId, IntroDocumentId, OverviewDocumentId, 
                    OutlineDocumentId, BookDisplayTitle, BookDisplayTitleRich, 
                    ChapterDisplayTitle, ChapterDisplayTitleRich, PublicationId, 
                    FirstVerseId, LastVerseId, HasCommentary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                bibleBook.BibleBookId,
                bibleBook.BookDocumentId ?? null,
                bibleBook.IntroDocumentId ?? null,
                bibleBook.OverviewDocumentId ?? null,
                bibleBook.OutlineDocumentId ?? null,
                bibleBook.BookDisplayTitle ?? null,
                bibleBook.BookDisplayTitleRich ?? null,
                bibleBook.ChapterDisplayTitle ?? null,
                bibleBook.ChapterDisplayTitleRich ?? null,
                bibleBook.PublicationId ?? null,
                bibleBook.FirstVerseId ?? null,
                bibleBook.LastVerseId ?? null,
                bibleBook.HasCommentary ?? null
            ]
        };
    }

    protected getUpdateSql(bibleBook: UpdateBibleBookDto): { sql: string; params: any[] } {
        this.validateBibleBookInput(bibleBook);
        return {
            sql: `UPDATE BibleBook SET 
                    BookDocumentId = COALESCE(?, BookDocumentId),
                    IntroDocumentId = COALESCE(?, IntroDocumentId),
                    OverviewDocumentId = COALESCE(?, OverviewDocumentId),
                    OutlineDocumentId = COALESCE(?, OutlineDocumentId),
                    BookDisplayTitle = COALESCE(?, BookDisplayTitle),
                    BookDisplayTitleRich = COALESCE(?, BookDisplayTitleRich),
                    ChapterDisplayTitle = COALESCE(?, ChapterDisplayTitle),
                    ChapterDisplayTitleRich = COALESCE(?, ChapterDisplayTitleRich),
                    PublicationId = COALESCE(?, PublicationId),
                    FirstVerseId = COALESCE(?, FirstVerseId),
                    LastVerseId = COALESCE(?, LastVerseId),
                    HasCommentary = COALESCE(?, HasCommentary)
                WHERE BibleBookId = ?`,
            params: [
                bibleBook.BookDocumentId,
                bibleBook.IntroDocumentId,
                bibleBook.OverviewDocumentId,
                bibleBook.OutlineDocumentId,
                bibleBook.BookDisplayTitle,
                bibleBook.BookDisplayTitleRich,
                bibleBook.ChapterDisplayTitle,
                bibleBook.ChapterDisplayTitleRich,
                bibleBook.PublicationId,
                bibleBook.FirstVerseId,
                bibleBook.LastVerseId,
                bibleBook.HasCommentary,
                bibleBook.bibleBookId
            ]
        };
    }
}

/**
 * Singleton instance of BibleBookRepository
 */
export const bibleBookRepository = new BibleBookRepository();
