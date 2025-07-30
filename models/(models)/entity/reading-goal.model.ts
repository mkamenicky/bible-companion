/**
 * Interface for ReadingGoal entity
 */
export interface ReadingGoal {
    id: number;
    userId?: number;
    goalType: string;
    targetValue: number;
    currentProgress: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    isCompleted: boolean;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * DTO for creating a new ReadingGoal
 */
export interface CreateReadingGoalDto {
    userId?: number;
    goalType: string;
    targetValue: number;
    currentProgress?: number;
    startDate: string;
    endDate?: string;
    isActive?: boolean;
    isCompleted?: boolean;
    completedAt?: string;
}

/**
 * DTO for updating an existing ReadingGoal
 */
export interface UpdateReadingGoalDto {
    id: number;
    userId?: number;
    goalType?: string;
    targetValue?: number;
    currentProgress?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    isCompleted?: boolean;
    completedAt?: string;
}
