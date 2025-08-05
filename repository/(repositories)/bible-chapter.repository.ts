import {BaseRepository} from '@/repository/base/base.repository';
import type {BibleChapter, CreateBibleChapterDto, UpdateBibleChapterDto} from '@/models';

/**
 * Repository class for managing BibleChapter entities
 */
export class BibleChapterRepository extends BaseRepository<BibleChapter, CreateBibleChapterDto, UpdateBibleChapterDto> {
    protected tableName = 'BibleChapter';
    protected primaryKeyColumn = 'BibleChapterId';

    /**
     * Validates BibleChapter input
     */
    private validateBibleChapterInput(bibleChapter: Partial<BibleChapter>): void {
        if (bibleChapter.BibleChapterId !== undefined) {
            this.validateId(bibleChapter.BibleChapterId, 'BibleChapterId');
        }
    }

    protected mapRowToEntity(row: any): BibleChapter {
        return {
            BibleChapterId: row.BibleChapterId,
            BookNumber: row.BookNumber,
            ChapterNumber: row.ChapterNumber,
            FirstVerseId: row.FirstVerseId,
            LastVerseId: row.LastVerseId,
            FirstFootnoteId: row.FirstFootnoteId,
            LastFootnoteId: row.LastFootnoteId,
            FirstBibleCitationId: row.FirstBibleCitationId,
            LastBibleCitationId: row.LastBibleCitationId,
            FirstParagraphOrdinal: row.FirstParagraphOrdinal,
            LastParagraphOrdinal: row.LastParagraphOrdinal,
            DecodedContent: row.DecodedContent
        };
    }

    protected getCreateSql(bibleChapter: CreateBibleChapterDto): { sql: string; params: any[] } {
        this.validateBibleChapterInput(bibleChapter);
        return {
            sql: `INSERT INTO BibleChapter (BibleChapterId, BookNumber, ChapterNumber, FirstVerseId,
                                            LastVerseId, FirstFootnoteId, LastFootnoteId,
                                            FirstBibleCitationId, LastBibleCitationId,
                                            FirstParagraphOrdinal, LastParagraphOrdinal, DecodedContent)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                bibleChapter.BibleChapterId,
                bibleChapter.BookNumber ?? null,
                bibleChapter.ChapterNumber ?? null,
                bibleChapter.FirstVerseId ?? null,
                bibleChapter.LastVerseId ?? null,
                bibleChapter.FirstFootnoteId ?? null,
                bibleChapter.LastFootnoteId ?? null,
                bibleChapter.FirstBibleCitationId ?? null,
                bibleChapter.LastBibleCitationId ?? null,
                bibleChapter.FirstParagraphOrdinal ?? null,
                bibleChapter.LastParagraphOrdinal ?? null,
                bibleChapter.DecodedContent ?? null
            ]
        };
    }

    protected getUpdateSql(bibleChapter: UpdateBibleChapterDto): { sql: string; params: any[] } {
        this.validateBibleChapterInput(bibleChapter);
        return {
            sql: `UPDATE BibleChapter
                  SET BookNumber            = COALESCE(?, BookNumber),
                      ChapterNumber         = COALESCE(?, ChapterNumber),
                      FirstVerseId          = COALESCE(?, FirstVerseId),
                      LastVerseId           = COALESCE(?, LastVerseId),
                      FirstFootnoteId       = COALESCE(?, FirstFootnoteId),
                      LastFootnoteId        = COALESCE(?, LastFootnoteId),
                      FirstBibleCitationId  = COALESCE(?, FirstBibleCitationId),
                      LastBibleCitationId   = COALESCE(?, LastBibleCitationId),
                      FirstParagraphOrdinal = COALESCE(?, FirstParagraphOrdinal),
                      LastParagraphOrdinal  = COALESCE(?, LastParagraphOrdinal),
                      DecodedContent        = COALESCE(?, DecodedContent)
                  WHERE BibleChapterId = ?`,
            params: [
                bibleChapter.BookNumber,
                bibleChapter.ChapterNumber,
                bibleChapter.FirstVerseId,
                bibleChapter.LastVerseId,
                bibleChapter.FirstFootnoteId,
                bibleChapter.LastFootnoteId,
                bibleChapter.FirstBibleCitationId,
                bibleChapter.LastBibleCitationId,
                bibleChapter.FirstParagraphOrdinal,
                bibleChapter.LastParagraphOrdinal,
                bibleChapter.DecodedContent,
                bibleChapter.bibleChapterId
            ]
        };
    }

    /**
     * Finds BibleChapters by BookNumber
     */
    async findByBookNumber(bookNumber: number): Promise<BibleChapter[]> {
        this.validateId(bookNumber, 'Book number');
        return this.findWhere('BookNumber = ?', [bookNumber], 'ChapterNumber');
    }
}

/**
 * Singleton instance of BibleChapterRepository
 */
export const bibleChapterRepository = new BibleChapterRepository();
