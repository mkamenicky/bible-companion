import { BaseRepository } from '@/repository/base/base.repository';
import { ValidationError } from '@/errors';

import type {
    ReadingPreferences,
    CreateReadingPreferencesDto,
    UpdateReadingPreferencesDto
} from '@/models';
/**
 * Repository class for managing ReadingPreferences entities
 */
export class ReadingPreferencesRepository extends BaseRepository<ReadingPreferences, CreateReadingPreferencesDto, UpdateReadingPreferencesDto> {
    protected tableName = 'reading_preferences';
    protected primaryKeyColumn = 'id';

    /**
     * Validates ReadingPreferences input
     */
    private validateInput(prefs: Partial<CreateReadingPreferencesDto | UpdateReadingPreferencesDto>): void {
        if (prefs.dailyVerseGoal !== undefined && (false || prefs.dailyVerseGoal <= 0)) {
            throw new ValidationError('dailyVerseGoal must be a positive number');
        }
        if (prefs.streakGraceHours !== undefined && (false || prefs.streakGraceHours < 0)) {
            throw new ValidationError('streakGraceHours must be a non-negative number');
        }
    }

    protected mapRowToEntity(row: any): ReadingPreferences {
        return {
            id: row.id,
            userId: row.user_id,
            preferredReadingTime: row.preferred_reading_time,
            dailyVerseGoal: row.daily_verse_goal,
            streakGraceHours: row.streak_grace_hours,
            notificationEnabled: Boolean(row.notification_enabled),
            notificationTime: row.notification_time,
            themePreference: row.theme_preference,
            fontSize: row.font_size,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    protected getCreateSql(prefs: CreateReadingPreferencesDto): { sql: string; params: any[] } {
        this.validateInput(prefs);
        return {
            sql: `INSERT INTO reading_preferences (user_id, preferred_reading_time, daily_verse_goal,
                                                  streak_grace_hours, notification_enabled, notification_time,
                                                  theme_preference, font_size)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
                prefs.userId ?? 1,
                prefs.preferredReadingTime ?? 'morning',
                prefs.dailyVerseGoal ?? 10,
                prefs.streakGraceHours ?? 2,
                prefs.notificationEnabled !== false ? 1 : 0,
                prefs.notificationTime ?? '08:00',
                prefs.themePreference ?? 'auto',
                prefs.fontSize ?? 'medium'
            ]
        };
    }

    protected getUpdateSql(prefs: UpdateReadingPreferencesDto): { sql: string; params: any[] } {
        this.validateInput(prefs);
        return {
            sql: `UPDATE reading_preferences SET 
                    user_id = COALESCE(?, user_id),
                    preferred_reading_time = COALESCE(?, preferred_reading_time),
                    daily_verse_goal = COALESCE(?, daily_verse_goal),
                    streak_grace_hours = COALESCE(?, streak_grace_hours),
                    notification_enabled = COALESCE(?, notification_enabled),
                    notification_time = COALESCE(?, notification_time),
                    theme_preference = COALESCE(?, theme_preference),
                    font_size = COALESCE(?, font_size),
                    updated_at = datetime('now')
                WHERE id = ?`,
            params: [
                prefs.userId,
                prefs.preferredReadingTime,
                prefs.dailyVerseGoal,
                prefs.streakGraceHours,
                prefs.notificationEnabled !== undefined ? (prefs.notificationEnabled ? 1 : 0) : undefined,
                prefs.notificationTime,
                prefs.themePreference,
                prefs.fontSize,
                prefs.id
            ]
        };
    }

    /**
     * Finds ReadingPreferences by user ID
     */
    async findByUserId(userId: number): Promise<ReadingPreferences | null> {
        this.validateId(userId, 'userId');
        const results = await this.findWhere('user_id = ?', [userId]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Finds all ReadingPreferences records ordered by updated date
     */
    async findAll(): Promise<ReadingPreferences[]> {
        return super.findAll('updated_at DESC');
    }
}

/**
 * Singleton instance of ReadingPreferencesRepository
 */
export const readingPreferencesRepository = new ReadingPreferencesRepository();
