/**
 * Interface for ReadingPlanConfig entity
 */
export interface ReadingPlanConfig {
    readonly id: number;
    readonly plan_name: string;
    readonly plan_type: string;
    readonly is_active: boolean;
    readonly created_at: string;
}

/**
 * DTO for creating a new ReadingPlanConfig
 */
export interface CreateReadingPlanConfigDto {
    readonly plan_name: string;
    readonly plan_type?: string;
    readonly is_active?: boolean;
}

/**
 * DTO for updating an existing ReadingPlanConfig
 */
export interface UpdateReadingPlanConfigDto {
    readonly id: number;
    readonly plan_name?: string;
    readonly plan_type?: string;
    readonly is_active?: boolean;
}
