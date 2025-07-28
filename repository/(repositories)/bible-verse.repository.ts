import {BaseRepository} from '@/repository/base/base.repository';
import type {
    BibleVerse,
    BibleVerseDb,
    CreateBibleVerseDto,
    mapBibleVerseDbToVerse,
    UpdateBibleVerseDto
} from '@/models';
import {ValidationError} from "@/errors";

/**
 * Repository class for managing BibleVerse entities
 */
export class BibleVerseRepository extends BaseRepository<BibleVerse, CreateBibleVerseDto, UpdateBibleVerseDto> {
    protected tableName = 'BibleVerse';
    protected primaryKeyColumn = 'BibleVerseId';

    /**
     * Validates BibleVerse input
     */
    private validateBibleVerseInput(bibleVerse: Partial<BibleVerse>): void {
        if (bibleVerse.BibleVerseId !== undefined) {
            this.validateId(bibleVerse.BibleVerseId, 'BibleVerseId');
        }
    }

    protected mapRowToEntity(row: any): BibleVerse {
        // Import mapBibleVerseDbToVerse dynamically to avoid circular dependencies
        const {mapBibleVerseDbToVerse} = require('@/models');
        return mapBibleVerseDbToVerse(row as BibleVerseDb);
    }

    protected getCreateSql(bibleVerse: CreateBibleVerseDto): { sql: string; params: any[] } {
        this.validateBibleVerseInput(bibleVerse);
        return {
            sql: `INSERT INTO BibleVerse (BibleVerseId, Label, Content, AdjustmentInfo,
                                          BeginParagraphOrdinal, EndParagraphOrdinal, DecodedContent)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            params: [
                bibleVerse.BibleVerseId,
                bibleVerse.Label,
                null, // Content is binary, not handled in creation
                null, // AdjustmentInfo is binary, not handled in creation
                bibleVerse.BeginParagraphOrdinal ?? null,
                bibleVerse.EndParagraphOrdinal ?? null,
                bibleVerse.DecodedContent ?? null
            ]
        };
    }

    protected getUpdateSql(bibleVerse: UpdateBibleVerseDto): { sql: string; params: any[] } {
        this.validateBibleVerseInput(bibleVerse);
        return {
            sql: `UPDATE BibleVerse
                  SET Label                 = COALESCE(?, Label),
                      BeginParagraphOrdinal = COALESCE(?, BeginParagraphOrdinal),
                      EndParagraphOrdinal   = COALESCE(?, EndParagraphOrdinal),
                      DecodedContent        = COALESCE(?, DecodedContent)
                  WHERE BibleVerseId = ?`,
            params: [
                bibleVerse.Label,
                bibleVerse.BeginParagraphOrdinal,
                bibleVerse.EndParagraphOrdinal,
                bibleVerse.DecodedContent,
                bibleVerse.BibleVerseId
            ]
        };
    }

    /**
     * Finds BibleVerses in a range
     */
    async findByRange(startId: number, endId: number): Promise<BibleVerse[]> {
        this.validateId(startId, 'Start ID');
        this.validateId(endId, 'End ID');

        if (startId > endId) {
            throw new ValidationError('Start ID must be less than or equal to End ID');
        }

        return this.findWhere('BibleVerseId >= ? AND BibleVerseId <= ?', [startId, endId], 'BibleVerseId');
    }

    /**
     * Finds BibleVerses by label pattern
     */
    async findByLabelPattern(pattern: string): Promise<BibleVerse[]> {
        this.validateString(pattern, 'Pattern');
        return this.findWhere('Label LIKE ?', [`%${pattern}%`], 'BibleVerseId');
    }
}

/**
 * Singleton instance of BibleVerseRepository
 */
export const bibleVerseRepository = new BibleVerseRepository();
