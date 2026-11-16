import {bibleRepository} from '@/repository';
import type {BibleBookInfo, BibleChapterInfo} from '@/models';
import {getShortBookName} from '@/constants/bible-books';
import {localizationService} from '@/services/(services)/localization/localization.service';

/** Books, chapters and lookup tables. Static data, loaded once per app run. */
export interface BibleStructure {
    readonly books: BibleBookInfo[];
    /** All 1189 chapters in reading order. */
    readonly chapters: BibleChapterInfo[];
    readonly booksById: Map<number, BibleBookInfo>;
    readonly chaptersById: Map<number, BibleChapterInfo>;
    readonly chaptersByBook: Map<number, BibleChapterInfo[]>;
    readonly totalVerses: number;
}

/** Number of chapters whose verse numbers are kept in memory. */
const VERSE_NUMBER_CACHE_SIZE = 40;

/**
 * Knows the shape of the Bible: which books and chapters exist, which verse
 * ids belong to them, and how books and verses are labelled.
 */
export class BibleService {
    private structure: Promise<BibleStructure> | null = null;
    private readonly verseNumberCache = new Map<number, Map<number, number>>();

    /** The Bible structure. Loaded from the database on first use. */
    getStructure(): Promise<BibleStructure> {
        if (!this.structure) {
            this.structure = this.loadStructure().catch(error => {
                this.structure = null; // allow a retry after a failure
                throw error;
            });
        }
        return this.structure;
    }

    /** Short display name of a book in the app's current language. */
    getBookName(book: BibleBookInfo, language: string = localizationService.getCurrentLanguage()): string {
        return getShortBookName(book.id, language)
            ?? book.titleEnglish
            ?? book.displayTitle
            ?? `Book ${book.id}`;
    }

    /** The chapter a verse id belongs to, or null. */
    findChapterOfVerse(structure: BibleStructure, verseId: number): BibleChapterInfo | null {
        // Chapters are sorted and their verse ranges are contiguous.
        let low = 0;
        let high = structure.chapters.length - 1;

        while (low <= high) {
            const middle = (low + high) >> 1;
            const chapter = structure.chapters[middle];

            if (verseId < chapter.firstVerseId) {
                high = middle - 1;
            } else if (verseId > chapter.lastVerseId) {
                low = middle + 1;
            } else {
                return chapter;
            }
        }
        return null;
    }

    /**
     * Verse numbers of a chapter, keyed by verse id. 0 is a superscription.
     *
     * Numbers must come from the stored labels: psalms with a superscription
     * have one entry more than they have verses, so "id - firstId + 1" is off
     * by one there.
     */
    async getVerseNumbers(chapter: BibleChapterInfo): Promise<Map<number, number>> {
        const cached = this.verseNumberCache.get(chapter.id);
        if (cached) return cached;

        const labels = await bibleRepository.findVerseLabels(chapter.firstVerseId, chapter.lastVerseId);
        const numbers = new Map<number, number>();
        for (const {id, label} of labels) {
            numbers.set(id, parseVerseLabel(label));
        }

        if (this.verseNumberCache.size >= VERSE_NUMBER_CACHE_SIZE) {
            const oldestKey = this.verseNumberCache.keys().next().value;
            if (oldestKey !== undefined) this.verseNumberCache.delete(oldestKey);
        }
        this.verseNumberCache.set(chapter.id, numbers);
        return numbers;
    }

    private async loadStructure(): Promise<BibleStructure> {
        const [books, chapters] = await Promise.all([
            bibleRepository.findBooks(),
            bibleRepository.findChapters(),
        ]);

        const chaptersByBook = new Map<number, BibleChapterInfo[]>();
        for (const chapter of chapters) {
            const list = chaptersByBook.get(chapter.bookId);
            if (list) {
                list.push(chapter);
            } else {
                chaptersByBook.set(chapter.bookId, [chapter]);
            }
        }

        return {
            books,
            chapters,
            booksById: new Map(books.map(book => [book.id, book])),
            chaptersById: new Map(chapters.map(chapter => [chapter.id, chapter])),
            chaptersByBook,
            totalVerses: chapters.reduce((sum, chapter) => sum + chapter.verseCount, 0),
        };
    }
}

/**
 * Turns a stored verse label into a verse number.
 *   `<span class="cl">3</span>`  chapter label = first verse of chapter 3 -> 1
 *   `<span class="vl">12</span>` verse label -> 12
 *   empty                        superscription -> 0
 */
export function parseVerseLabel(label: string): number {
    if (!label) return 0;
    if (label.includes('class="cl"')) return 1;

    const match = /(\d+)/.exec(label.replace(/<[^>]*>/g, ''));
    return match ? Number(match[1]) : 0;
}

export const bibleService = new BibleService();
