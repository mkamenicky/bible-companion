export interface BibleChapter {
  readonly BibleChapterId: number;
  readonly BookNumber?: number;
  readonly ChapterNumber?: number;
  readonly FirstVerseId?: number;
  readonly LastVerseId?: number;
  readonly FirstFootnoteId?: number;
  readonly LastFootnoteId?: number;
  readonly FirstBibleCitationId?: number;
  readonly LastBibleCitationId?: number;
  readonly FirstParagraphOrdinal?: number;
  readonly LastParagraphOrdinal?: number;
  readonly DecodedContent?: string;
}

/**
 * DTO for creating a new BibleChapter
 * All fields are required including the ID as Bible chapters have predefined identifiers
 */
export type CreateBibleChapterDto = BibleChapter;

/**
 * DTO for updating an existing BibleChapter
 * All fields are optional except the ID which is required for identification
 */
export type UpdateBibleChapterDto = Partial<Omit<BibleChapter, 'bibleChapterId'>> & {
  readonly bibleChapterId: number;
};
