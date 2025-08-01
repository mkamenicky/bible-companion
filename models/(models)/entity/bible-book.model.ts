export interface BibleBook {
  readonly BibleBookId: number;
  readonly BookDocumentId?: number;
  readonly IntroDocumentId?: number;
  readonly OverviewDocumentId?: number;
  readonly OutlineDocumentId?: number;
  readonly BookDisplayTitle?: string;
  readonly BookDisplayTitleRich?: string;
  readonly ChapterDisplayTitle?: string;
  readonly ChapterDisplayTitleGerman?: string;
  readonly ChapterDisplayTitleJapanese?: string;
  readonly ChapterDisplayTitleRich?: string;
  readonly PublicationId?: number;
  readonly FirstVerseId?: number;
  readonly LastVerseId?: number;
  readonly HasCommentary?: boolean;
}

/**
 * DTO for creating a new BibleBook
 * All fields are required including the ID as Bible books have predefined identifiers
 */
export type CreateBibleBookDto = BibleBook;

/**
 * DTO for updating an existing BibleBook
 * All fields are optional except the ID which is required for identification
 */
export type UpdateBibleBookDto = Partial<Omit<BibleBook, 'bibleBookId'>> & {
  readonly bibleBookId: number;
};
