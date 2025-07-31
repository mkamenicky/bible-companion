// Reading Topics
export interface ReadingTopic {
    id: number;
    topic_name: string; // 'Law', 'History', 'Psalms', etc.
    display_name: string; // 'The Law', 'Historical Books', etc.
    day_of_week?: number; // 1-7, NULL for sequential mode
    color_hex?: string;
    icon_name?: string;
    is_active: boolean;
    created_at: string;
}

export interface CreateReadingTopic {
    topic_name: string;
    display_name: string;
    day_of_week?: number;
    color_hex?: string;
    icon_name?: string;
    is_active?: boolean;
}

export interface UpdateReadingTopic {
    id: number;
    topic_name?: string;
    display_name?: string;
    day_of_week?: number;
    color_hex?: string;
    icon_name?: string;
    is_active?: boolean;
}
