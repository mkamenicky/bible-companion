import {BaseRepository} from '@/repository/base/base.repository';
import type {Achievement, CreateAchievementDto, UpdateAchievementDto} from '@/models';
import {ValidationError} from "@/errors";

export class AchievementRepository extends BaseRepository<Achievement, CreateAchievementDto, UpdateAchievementDto> {
    protected tableName = 'achievements';
    protected primaryKeyColumn = 'id';

    /**
     * Find achievement by string ID (overrides base findById which expects number)
     */
    async findByStringId(id: string): Promise<Achievement | null> {
        this.validateString(id, 'id');
        const results = await this.findWhere('id = ?', [id]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Get all active achievements
     */
    async findAllActive(): Promise<Achievement[]> {
        return this.findWhere('is_active = 1', [], 'sort_order, created_at');
    }

    /**
     * Get achievements by category
     */
    async findByCategory(category: string): Promise<Achievement[]> {
        return this.findWhere('category = ? AND is_active = 1', [category], 'sort_order, created_at');
    }

    protected mapRowToEntity(row: any): Achievement {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            targetValue: row.target_value,
            category: row.category,
            sortOrder: row.sort_order,
            isActive: Boolean(row.is_active),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            // These will be populated by joins or separate queries
            progress: 0,
            unlocked: false,
            target: row.target_value // alias for compatibility
        };
    }

    protected getCreateSql(achievement: CreateAchievementDto): { sql: string; params: any[] } {
        this.validateInput(achievement);
        return {
            sql: `INSERT INTO achievements (id, name, description, icon, target_value, category, sort_order, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                achievement.id,
                achievement.name,
                achievement.description,
                achievement.icon || '🏆',
                achievement.targetValue,
                achievement.category || 'general',
                achievement.sortOrder || 0,
                achievement.isActive !== false ? 1 : 0
            ]
        };
    }

    protected getUpdateSql(achievement: UpdateAchievementDto): { sql: string; params: any[] } {
        this.validateInput(achievement);
        return {
            sql: `UPDATE achievements
                  SET name         = COALESCE(?, name),
                      description  = COALESCE(?, description),
                      icon         = COALESCE(?, icon),
                      target_value = COALESCE(?, target_value),
                      category     = COALESCE(?, category),
                      sort_order   = COALESCE(?, sort_order),
                      is_active    = COALESCE(?, is_active),
                      updated_at   = datetime('now')
                  WHERE id = ?`,
            params: [
                achievement.name,
                achievement.description,
                achievement.icon,
                achievement.targetValue,
                achievement.category,
                achievement.sortOrder,
                achievement.isActive !== undefined ? (achievement.isActive ? 1 : 0) : undefined,
                achievement.id
            ]
        };
    }

    private validateInput(achievement: Partial<CreateAchievementDto | UpdateAchievementDto>): void {
        if (achievement.id !== undefined) {
            this.validateString(achievement.id, 'id');
        }
        if (achievement.name !== undefined) {
            this.validateString(achievement.name, 'name');
        }
        if (achievement.description !== undefined) {
            this.validateString(achievement.description, 'description');
        }
        if (achievement.targetValue !== undefined && (typeof achievement.targetValue !== 'number' || achievement.targetValue <= 0)) {
            throw new ValidationError('targetValue must be a positive number');
        }
    }
}

// Singleton instances
export const achievementRepository = new AchievementRepository();
