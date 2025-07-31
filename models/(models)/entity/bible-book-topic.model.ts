// Bible Book Topics Mapping
export interface BibleBookTopic {
    id: number;
    bible_book_id: number;
    topic_id: number;
    sort_order: number;
    created_at: string;
}

export interface CreateBibleBookTopic {
    bible_book_id: number;
    topic_id: number;
    sort_order?: number;
}

export interface UpdateBibleBookTopic {
    id: number;
    bible_book_id?: number;
    topic_id?: number;
    sort_order?: number;
}
