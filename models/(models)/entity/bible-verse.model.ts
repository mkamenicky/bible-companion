/**
 * Full BibleVerse interface matching database schema
 * Used for database operations and queries
 */
export interface BibleVerseDb {
  readonly BibleVerseId: number;
  readonly Label: string;
  readonly Content: Uint8Array | null;
  readonly AdjustmentInfo: Uint8Array | null;
  readonly BeginParagraphOrdinal: number | null;
  readonly EndParagraphOrdinal: number | null;
  readonly DecodedContent: string | null;
}

/**
 * Clean BibleVerse interface for application use
 * Excludes binary fields that are not needed in the UI
 */
export interface BibleVerse {
  readonly BibleVerseId: number;
  readonly Label: string;
  readonly BeginParagraphOrdinal: number | null;
  readonly EndParagraphOrdinal: number | null;
  readonly DecodedContent: string | null;
}

/**
 * DTO for creating a new BibleVerse
 * All fields are required including the ID as Bible verses have predefined identifiers
 */
export type CreateBibleVerseDto = BibleVerse;

/**
 * DTO for updating an existing BibleVerse
 * All fields are optional except the ID which is required for identification
 */
export type UpdateBibleVerseDto = Partial<Omit<BibleVerse, 'BibleVerseId'>> & {
  readonly BibleVerseId: number;
};

/**
 * Utility function to convert database verse to application verse
 */
export const mapBibleVerseDbToVerse = (dbVerse: BibleVerseDb): BibleVerse => ({
  BibleVerseId: dbVerse.BibleVerseId,
  Label: dbVerse.Label,
  BeginParagraphOrdinal: dbVerse.BeginParagraphOrdinal,
  EndParagraphOrdinal: dbVerse.EndParagraphOrdinal,
  DecodedContent: dbVerse.DecodedContent,
});
