import { BaseRepository } from '@/repository/base/base.repository';
import type {
    AchievementRule,
} from '@/models';

export class AchievementRuleRepository extends BaseRepository<AchievementRule, any, any> {
    protected tableName = 'achievement_rules';
    protected primaryKeyColumn = 'id';

    protected mapRowToEntity(row: any): AchievementRule {
        return {
            id: row.id,
            achievementId: row.achievement_id,
            ruleType: row.rule_type,
            calculationField: row.calculation_field,
            calculationQuery: row.calculation_query,
            sortOrder: row.sort_order,
            isActive: Boolean(row.is_active),
            createdAt: row.created_at
        };
    }

    protected getCreateSql(rule: any): { sql: string; params: any[] } {
        return {
            sql: `INSERT INTO achievement_rules (achievement_id, rule_type, calculation_field, calculation_query, sort_order, is_active)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            params: [
                rule.achievementId,
                rule.ruleType,
                rule.calculationField,
                rule.calculationQuery,
                rule.sortOrder || 0,
                rule.isActive !== false ? 1 : 0
            ]
        };
    }

    protected getUpdateSql(rule: any): { sql: string; params: any[] } {
        return {
            sql: `UPDATE achievement_rules SET 
                    rule_type = COALESCE(?, rule_type),
                    calculation_field = COALESCE(?, calculation_field),
                    calculation_query = COALESCE(?, calculation_query),
                    sort_order = COALESCE(?, sort_order),
                    is_active = COALESCE(?, is_active)
                WHERE id = ?`,
            params: [
                rule.ruleType,
                rule.calculationField,
                rule.calculationQuery,
                rule.sortOrder,
                rule.isActive !== undefined ? (rule.isActive ? 1 : 0) : undefined,
                rule.id
            ]
        };
    }

    async findByAchievementId(achievementId: string): Promise<AchievementRule[]> {
        return this.findWhere('achievement_id = ? AND is_active = 1', [achievementId], 'sort_order');
    }
}

export const achievementRuleRepository = new AchievementRuleRepository();
