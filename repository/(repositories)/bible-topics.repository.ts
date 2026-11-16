import {BaseRepository} from '@/repository/base/base.repository';
import {ValidationError} from '@/errors';
import type {
    BibleBookTopic,
    CreateBibleBookTopic,
    UpdateBibleBookTopic
} from '@/models';


/**
 * Repository class for managing BibleBookTopic entities
 */
export class BibleBookTopicsRepository extends BaseRepository<BibleBookTopic, CreateBibleBookTopic, UpdateBibleBookTopic> {
    protected tableName = 'bible_book_topics';
    protected primaryKeyColumn = 'id';

    /**
     * Validates BibleBookTopic input
     */
    private validateInput(bibleBookTopic: Partial<CreateBibleBookTopic | UpdateBibleBookTopic>): void {
        if (bibleBookTopic.bible_book_id !== undefined && (typeof bibleBookTopic.bible_book_id !== 'number' || bibleBookTopic.bible_book_id <= 0)) {
            throw new ValidationError('bible_book_id must be a positive number');
        }
        if (bibleBookTopic.topic_id !== undefined && (typeof bibleBookTopic.topic_id !== 'number' || bibleBookTopic.topic_id <= 0)) {
            throw new ValidationError('topic_id must be a positive number');
        }
        if (bibleBookTopic.sort_order !== undefined && (typeof bibleBookTopic.sort_order !== 'number' || bibleBookTopic.sort_order < 0)) {
            throw new ValidationError('sort_order must be a non-negative number');
        }
    }

    protected mapRowToEntity(row: any): BibleBookTopic {
        return {
            id: row.id,
            bible_book_id: row.bible_book_id,
            topic_id: row.topic_id,
            sort_order: row.sort_order,
            created_at: row.created_at
        };
    }

    protected getCreateSql(bibleBookTopic: CreateBibleBookTopic): { sql: string; params: any[] } {
        this.validateInput(bibleBookTopic);
        return {
            sql: `INSERT INTO bible_book_topics (bible_book_id, topic_id, sort_order, created_at) VALUES (?, ?, ?, datetime('now'))`,
            params: [
                bibleBookTopic.bible_book_id,
                bibleBookTopic.topic_id,
                bibleBookTopic.sort_order ?? 0
            ]
        };
    }

    protected getUpdateSql(bibleBookTopic: UpdateBibleBookTopic): { sql: string; params: any[] } {
        this.validateInput(bibleBookTopic);
        return {
            sql: `UPDATE bible_book_topics SET 
                    bible_book_id = COALESCE(?, bible_book_id),
                    topic_id = COALESCE(?, topic_id),
                    sort_order = COALESCE(?, sort_order)
                WHERE id = ?`,
            params: [
                bibleBookTopic.bible_book_id,
                bibleBookTopic.topic_id,
                bibleBookTopic.sort_order,
                bibleBookTopic.id
            ]
        };
    }

    /**
     * Finds all BibleBookTopic records ordered by topic_id and sort_order
     */
    async findAll(): Promise<BibleBookTopic[]> {
        return super.findAll('topic_id, sort_order');
    }

    /**
     * Finds BibleBookTopic records by topic_id
     */
    async findByTopicId(topicId: number): Promise<BibleBookTopic[]> {
        this.validateId(topicId, 'Topic ID');
        return this.findWhere('topic_id = ?', [topicId], 'sort_order');
    }

    /**
     * Finds BibleBookTopic records by bible_book_id
     */
    async findByBookId(bookId: number): Promise<BibleBookTopic[]> {
        this.validateId(bookId, 'Book ID');
        return this.findWhere('bible_book_id = ?', [bookId], 'sort_order');
    }
}

/**
 * Singleton instance of BibleBookTopicsRepository
 */
export const bibleBookTopicsRepository = new BibleBookTopicsRepository();
