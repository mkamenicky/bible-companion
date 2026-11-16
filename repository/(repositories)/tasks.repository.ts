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


    /** All tasks stored for one day (YYYY-MM-DD). */
    async findByDate(date: string): Promise<Task[]> {
        this.validateString(date, 'date');
        return this.findWhere('date = ?', [date], 'task_name');
    }

    /** Creates the task or updates its done-state (date + name are unique). */
    async upsert(date: string, taskName: string, isDone: boolean): Promise<void> {
        this.validateInput({date, task_name: taskName});
        await this.execute(
            `INSERT INTO tasks (date, task_name, is_done)
             VALUES (?, ?, ?)
             ON CONFLICT (date, task_name) DO UPDATE SET is_done = excluded.is_done`,
            [date, taskName, isDone ? 1 : 0]
        );
    }

    /** Days (YYYY-MM-DD, ascending) on which a daily task was done. */
    async findCompletedDates(taskName: string): Promise<string[]> {
        const rows = await this.query<{ date: string }>(
            'SELECT DISTINCT date FROM tasks WHERE is_done = 1 AND task_name = ? ORDER BY date',
            [taskName]
        );
        return rows.map(row => row.date);
    }

    /** Mondays (YYYY-MM-DD, ascending) of the weeks in which a weekly task was done. */
    async findCompletedWeeks(taskName: string): Promise<string[]> {
        const rows = await this.query<{ date: string }>(
            `SELECT DISTINCT date FROM tasks
             WHERE is_done = 1 AND task_name = ? || '_WEEKLY_' || date
             ORDER BY date`,
            [taskName]
        );
        return rows.map(row => row.date);
    }
}

/**
 * Singleton instance of TasksRepository
 */
export const tasksRepository = new TasksRepository();
