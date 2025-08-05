// Reading Plan Progress
export interface ReadingPlanProgress {
    id: number;
    plan_config_id: number;
    current_book_id?: number;
    current_chapter_id?: number;
    current_verse_id?: number;
    last_topic_id?: number;
    verses_read_today: number;
    last_updated: string;
    created_at: string;
}

export interface CreateReadingPlanProgress {
    plan_config_id: number;
    current_book_id?: number;
    current_chapter_id?: number;
    current_verse_id?: number;
    last_topic_id?: number;
    verses_read_today?: number;
    last_updated: string;
    created_at: string;
}

export interface UpdateReadingPlanProgress {
    id: number;
    current_book_id?: number;
    current_chapter_id?: number;
    current_verse_id?: number;
    last_topic_id?: number;
    verses_read_today?: number;
    last_updated?: string;
}
