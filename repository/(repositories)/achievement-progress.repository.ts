import { BaseRepository } from '@/repository/base/base.repository';
import type {
    AchievementProgressModel,
    CreateAchievementProgressDto,
    UpdateAchievementProgressDto,
    Achievement
} from '@/models';
import {ValidationError} from "@/errors";

export class AchievementProgressRepository extends BaseRepository<AchievementProgressModel, CreateAchievementProgressDto, UpdateAchievementProgressDto> {
    protected tableName = 'achievement_progress';
    protected primaryKeyColumn = 'id';

    /**
     * Validates AchievementProgress input
     */
    private validateInput(achievement: Partial<CreateAchievementProgressDto | UpdateAchievementProgressDto>): void {
        if (achievement.achievementId !== undefined) {
            this.validateString(achievement.achievementId, 'achievementId');
        }
        if (achievement.progress !== undefined && (typeof achievement.progress !== 'number' || achievement.progress < 0)) {
            throw new ValidationError('progress must be a non-negative number');
        }
    }

    protected mapRowToEntity(row: any): AchievementProgressModel {
        return {
            id: row.id,
            achievementId: row.achievement_id,
            userId: row.user_id,
            progress: row.progress,
            isUnlocked: Boolean(row.is_unlocked),
            unlockedAt: row.unlocked_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    protected getCreateSql(achievement: CreateAchievementProgressDto): { sql: string; params: any[] } {
        this.validateInput(achievement);
        return {
            sql: `INSERT INTO achievement_progress (achievement_id, user_id, progress, is_unlocked, unlocked_at)
                  VALUES (?, ?, ?, ?, ?)`,
            params: [
                achievement.achievementId,
                achievement.userId ?? 1,
                achievement.progress,
                achievement.isUnlocked ? 1 : 0,
                achievement.unlockedAt ?? null
            ]
        };
    }

    protected getUpdateSql(achievement: UpdateAchievementProgressDto): { sql: string; params: any[] } {
        this.validateInput(achievement);
        return {
            sql: `UPDATE achievement_progress SET
                                                  progress = COALESCE(?, progress),
                                                  is_unlocked = COALESCE(?, is_unlocked),
                                                  unlocked_at = COALESCE(?, unlocked_at),
                                                  updated_at = datetime('now')
                  WHERE id = ?`,
            params: [
                achievement.progress,
                achievement.isUnlocked !== undefined ? (achievement.isUnlocked ? 1 : 0) : undefined,
                achievement.unlockedAt,
                achievement.id
            ]
        };
    }

    /**
     * Finds AchievementProgress by user ID and achievement ID
     */
    async findByUserIdAndAchievementId(userId: number, achievementId: string): Promise<AchievementProgressModel | null> {
        this.validateId(userId, 'userId');
        this.validateString(achievementId, 'achievementId');
        const results = await this.findWhere('user_id = ? AND achievement_id = ?', [userId, achievementId]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Finds all AchievementProgress records by user ID
     */
    async findByUserId(userId: number): Promise<AchievementProgressModel[]> {
        this.validateId(userId, 'userId');
        return this.findWhere('user_id = ?', [userId], 'updated_at DESC');
    }

    /**
     * Finds all AchievementProgress records ordered by updated date
     */
    async findAll(): Promise<AchievementProgressModel[]> {
        return super.findAll('updated_at DESC');
    }

    /**
     * Get achievements with their progress for a specific user using repository methods
     */
    async getAchievementsWithProgress(userId: number = 1): Promise<Achievement[]> {
        const sql = `
            SELECT
                a.id,
                a.name,
                a.description,
                a.icon,
                a.target_value,
                a.category,
                a.sort_order,
                a.is_active,
                a.created_at,
                a.updated_at,
                COALESCE(ap.progress, 0) as progress,
                COALESCE(ap.is_unlocked, 0) as unlocked,
                ap.unlocked_at
            FROM achievements a
                     LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = ?
            WHERE a.is_active = 1
            ORDER BY a.sort_order, a.created_at
        `;

        const results = await this.executeCustomQuery(sql, [userId]);
        return results.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            unlocked: Boolean(row.unlocked),
            progress: row.progress,
            target: row.target_value,
            targetValue: row.target_value,
            category: row.category,
            sortOrder: row.sort_order,
            isActive: Boolean(row.is_active),
            unlockedAt: row.unlocked_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    /**
     * Get available achievements using the database view
     */
    async getAvailableAchievements(userId: number = 1): Promise<Achievement[]> {
        const sql = `
            SELECT * FROM available_achievements
            WHERE status IN ('available', 'ready_to_unlock', 'unlocked')
            ORDER BY sort_order
        `;

        const results = await this.executeCustomQuery(sql, []);
        return results.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            unlocked: Boolean(row.is_unlocked),
            progress: row.current_progress,
            target: row.target_value,
            targetValue: row.target_value,
            category: row.category,
            sortOrder: row.sort_order,
            isActive: Boolean(row.is_active),
            status: row.status,
            unlockedAt: row.unlocked_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    /**
     * Get achievements by category
     */
    async getAchievementsByCategory(category: string, userId: number = 1): Promise<Achievement[]> {
        const sql = `
            SELECT
                a.id,
                a.name,
                a.description,
                a.icon,
                a.target_value,
                a.category,
                a.sort_order,
                a.is_active,
                a.created_at,
                a.updated_at,
                COALESCE(ap.progress, 0) as progress,
                COALESCE(ap.is_unlocked, 0) as unlocked,
                ap.unlocked_at
            FROM achievements a
                     LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = ?
            WHERE a.category = ? AND a.is_active = 1
            ORDER BY a.sort_order, a.created_at
        `;

        const results = await this.executeCustomQuery(sql, [userId, category]);
        return results.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            unlocked: Boolean(row.unlocked),
            progress: row.progress,
            target: row.target_value,
            targetValue: row.target_value,
            category: row.category,
            sortOrder: row.sort_order,
            isActive: Boolean(row.is_active),
            unlockedAt: row.unlocked_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    /**
     * Get achievement statistics for a user
     */
    async getAchievementStats(userId: number = 1): Promise<{
        total: number;
        unlocked: number;
        available: number;
        locked: number;
        completionPercentage: number;
    }> {
        const sql = `
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN ap.is_unlocked = 1 THEN 1 END) as unlocked
            FROM achievements a
                     LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = ?
            WHERE a.is_active = 1
        `;

        const results = await this.executeCustomQuery(sql, [userId]);
        const row = results[0];
        const total = row.total;
        const unlocked = row.unlocked;
        const available = total - unlocked;

        return {
            total,
            unlocked,
            available,
            locked: 0, // Would need prerequisite logic for accurate count
            completionPercentage: total > 0 ? Math.round((unlocked / total) * 100) : 0
        };
    }

    /**
     * Get achievement rules for a specific achievement
     */
    async getAchievementRules(achievementId: string): Promise<Array<{
        rule_type: string;
        calculation_field?: string;
        calculation_query?: string;
    }>> {
        const sql = `
            SELECT rule_type, calculation_field, calculation_query
            FROM achievement_rules
            WHERE achievement_id = ? AND is_active = 1
            ORDER BY sort_order
        `;

        return await this.executeCustomQuery(sql, [achievementId]);
    }

    /**
     * Get all active achievement IDs
     */
    async getActiveAchievementIds(): Promise<string[]> {
        const sql = `SELECT id FROM achievements WHERE is_active = 1`;
        const results = await this.executeCustomQuery(sql, []);
        return results.map(row => row.id);
    }

    /**
     * Execute custom SQL query using the database connection from BaseRepository
     */
    private async executeCustomQuery(sql: string, params: any[]): Promise<any[]> {
        return await this.executeQuery(sql, params);
    }

    /**
     * Public method to execute queries - needed by ProgressService
     */
    async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
        return await super.executeQuery(sql, params);
    }
}

/**
 * Singleton instance of AchievementProgressRepository
 */
export const achievementProgressRepository = new AchievementProgressRepository();
