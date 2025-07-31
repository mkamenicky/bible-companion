// Reading Plan Type Enum
export type ReadingPlanType = 'sequential' | 'topical' | 'chronological';

// Reading Plan Status
export interface ReadingPlanStatus {
    current_plan: string;
    plan_type: ReadingPlanType;
    progress_percentage: number;
    current_book?: string;
    current_topic?: string;
    verses_read_today: number;
    daily_goal: number;
}
