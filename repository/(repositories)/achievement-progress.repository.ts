import { BaseRepository } from '@/repository/base/base.repository';
import type {
    AchievementProgress,
    CreateAchievementProgressDto,
    UpdateAchievementProgressDto
} from '@/models';
import {ValidationError} from "@/errors";

export class AchievementProgressRepository extends BaseRepository<AchievementProgress, CreateAchievementProgressDto, UpdateAchievementProgressDto> {
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

    protected mapRowToEntity(row: any): AchievementProgress {
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
    async findByUserIdAndAchievementId(userId: number, achievementId: string): Promise<AchievementProgress | null> {
        this.validateId(userId, 'userId');
        this.validateString(achievementId, 'achievementId');
        const results = await this.findWhere('user_id = ? AND achievement_id = ?', [userId, achievementId]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Finds all AchievementProgress records by user ID
     */
    async findByUserId(userId: number): Promise<AchievementProgress[]> {
        this.validateId(userId, 'userId');
        return this.findWhere('user_id = ?', [userId], 'updated_at DESC');
    }

    /**
     * Finds all AchievementProgress records ordered by updated date
     */
    async findAll(): Promise<AchievementProgress[]> {
        return super.findAll('updated_at DESC');
    }
}

/**
 * Singleton instance of AchievementProgressRepository
 */
export const achievementProgressRepository = new AchievementProgressRepository();
