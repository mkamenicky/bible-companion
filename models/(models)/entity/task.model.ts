/**
 * Interface for Task entity
 */
export interface Task {
    readonly id: number;
    readonly date: string;
    readonly task_name: string;
    readonly is_done: boolean;
}

/**
 * DTO for creating a new Task
 */
export interface CreateTaskDto {
    readonly date: string;
    readonly task_name: string;
    readonly is_done?: boolean;
}

/**
 * DTO for updating an existing Task
 */
export interface UpdateTaskDto {
    readonly id: number;
    readonly date?: string;
    readonly task_name?: string;
    readonly is_done?: boolean;
}
