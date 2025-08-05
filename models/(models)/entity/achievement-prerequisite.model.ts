/**
 * Achievement Prerequisite model
 */
export interface AchievementPrerequisite {
    id: number;
    achievementId: string;
    prerequisiteAchievementId: string;
    createdAt: string;
}

/**
 * Create Achievement Prerequisite DTO
 */
export interface CreateAchievementPrerequisiteDto {
    achievementId: string;
    prerequisiteAchievementId: string;
}

