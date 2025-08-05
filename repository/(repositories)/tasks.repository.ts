import {BaseRepository} from '@/repository/base/base.repository';
import type {
    Task, 
    CreateTaskDto, 
    UpdateTaskDto 
} from '@/models';

/**
 * Repository class for managing Task entities
 */
export class TasksRepository extends BaseRepository<Task, CreateTaskDto, UpdateTaskDto> {
    protected tableName = 'tasks';
    protected primaryKeyColumn = 'id';

    /**
     * Validates Task input
     */
    private validateInput(task: Partial<CreateTaskDto | UpdateTaskDto>): void {
        if (task.date !== undefined) {
            this.validateString(task.date, 'date');
        }
        if (task.task_name !== undefined) {
            this.validateString(task.task_name, 'task_name');
        }
    }

    protected mapRowToEntity(row: any): Task {
        return {
            id: row.id,
            date: row.date,
            task_name: row.task_name,
            is_done: Boolean(row.is_done)
        };
    }

    protected getCreateSql(task: CreateTaskDto): { sql: string; params: any[] } {
        this.validateInput(task);
        return {
            sql: `INSERT INTO tasks (date, task_name, is_done) VALUES (?, ?, ?)`,
            params: [
                task.date,
                task.task_name,
                task.is_done ? 1 : 0
            ]
        };
    }

    protected getUpdateSql(task: UpdateTaskDto): { sql: string; params: any[] } {
        this.validateInput(task);
        return {
            sql: `UPDATE tasks SET 
                    date = COALESCE(?, date),
                    task_name = COALESCE(?, task_name),
                    is_done = COALESCE(?, is_done)
                WHERE id = ?`,
            params: [
                task.date,
                task.task_name,
                task.is_done !== undefined ? (task.is_done ? 1 : 0) : undefined,
                task.id
            ]
        };
    }

    /**
     * Finds all Task records ordered by date and name
     */
    async findAll(): Promise<Task[]> {
        return super.findAll('date DESC, task_name');
    }

}

/**
 * Singleton instance of TasksRepository
 */
export const tasksRepository = new TasksRepository();
