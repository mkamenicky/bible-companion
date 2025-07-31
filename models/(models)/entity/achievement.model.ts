// achievement.models.ts - Add this file to your models directory

/**
 * Achievement definition model
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress: number;
    target: number; // For backward compatibility
    targetValue: number; // Database field name
    category: string;
    sortOrder: number;
    isActive: boolean;
    unlockedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: 'locked' | 'available' | 'ready_to_unlock' | 'unlocked';
}

/**
 * Create Achievement DTO
 */
export interface CreateAchievementDto {
    id: string;
    name: string;
    description: string;
    icon?: string;
    targetValue: number;
    category?: string;
    sortOrder?: number;
    isActive?: boolean;
}

/**
 * Update Achievement DTO
 */
export interface UpdateAchievementDto {
    id: string;
    name?: string;
    description?: string;
    icon?: string;
    targetValue?: number;
    category?: string;
    sortOrder?: number;
    isActive?: boolean;
}
