/**
* Reading session tracking for more granular analytics
*/
export interface ReadingSessionModel {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    versesRead: number;
    chaptersRead: number;
    booksRead: string[]; // JSON array of book names
    readingPlan?: string;
    notes?: string;
    createdAt: string;
}

export interface CreateReadingSessionDto {
    date: string;
    startTime: string;
    endTime: string;
    versesRead: number;
    chaptersRead: number;
    booksRead: string[];
    readingPlan?: string;
    notes?: string;
}

export interface UpdateReadingSessionDto {
    id: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    versesRead?: number;
    chaptersRead?: number;
    booksRead?: string[];
    readingPlan?: string;
    notes?: string;
}
