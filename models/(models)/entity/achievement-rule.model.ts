/**
 * Achievement Rule model
 */
export interface AchievementRule {
    id: number;
    achievementId: string;
    ruleType: 'total_verses' | 'consecutive_days' | 'chapters_read' | 'books_started' | 'custom';
    calculationField?: string;
    calculationQuery?: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

/**
 * Create Achievement Rule DTO
 */
export interface CreateAchievementRuleDto {
    achievementId: string;
    ruleType: 'total_verses' | 'consecutive_days' | 'chapters_read' | 'books_started' | 'custom';
    calculationField?: string;
    calculationQuery?: string;
    sortOrder?: number;
    isActive?: boolean;
}

/**
 * Update Achievement Rule DTO
 */
export interface UpdateAchievementRuleDto {
    id: number;
    achievementId?: string;
    ruleType?: 'total_verses' | 'consecutive_days' | 'chapters_read' | 'books_started' | 'custom';
    calculationField?: string;
    calculationQuery?: string;
    sortOrder?: number;
    isActive?: boolean;
}

