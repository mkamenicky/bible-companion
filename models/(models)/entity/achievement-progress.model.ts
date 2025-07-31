/**
 * Achievement progress tracking
 */
export interface AchievementProgressModel {
    id: number;
    achievementId: string;
    userId?: number;
    progress: number;
    isUnlocked: boolean;
    unlockedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAchievementProgressDto {
    achievementId: string;
    userId?: number;
    progress: number;
    isUnlocked: boolean;
    unlockedAt?: string;
}

export interface UpdateAchievementProgressDto {
    id: number;
    userId?: number;
    achievementId: string;
    progress?: number;
    isUnlocked?: boolean;
    unlockedAt?: string;
}
