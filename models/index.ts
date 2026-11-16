// Bible structure and read-state
export type {
    BibleBookInfo,
    BibleChapterInfo,
    BibleProgressSummary,
    BookProgress,
    ChapterProgress,
    ProgressSource,
    VerseState,
} from '@/models/(models)/entity/bible.model';

// Tasks
export type {Task, CreateTaskDto, UpdateTaskDto} from '@/models/(models)/entity/task.model';

// Reading plan
export type {
    ReadingPlanConfig,
    CreateReadingPlanConfigDto,
    UpdateReadingPlanConfigDto
} from '@/models/(models)/entity/reading-plan-config.model';

export type {
    DailyReadingAssignment,
    CreateDailyReadingAssignmentDto,
    UpdateDailyReadingAssignmentDto,
    EnhancedDailyReadingAssignment
} from '@/models/(models)/entity/daily-reading-assignment.model';

export type {
    BibleBookTopic,
    UpdateBibleBookTopic,
    CreateBibleBookTopic
} from '@/models/(models)/entity/bible-book-topic.model';

export type {
    ReadingTopic,
    UpdateReadingTopic,
    CreateReadingTopic
} from '@/models/(models)/entity/reading-topic.model';

// Achievements
export type {
    Achievement,
    CreateAchievementDto,
    UpdateAchievementDto,
} from '@/models/(models)/entity/achievement.model';

export type {
    CreateAchievementProgressDto,
    UpdateAchievementProgressDto,
    AchievementProgressModel,
} from '@/models/(models)/entity/achievement-progress.model';

// Streak and preferences
export type {
    CreateReadingStreakDto,
    UpdateReadingStreakDto,
    ReadingStreak
} from '@/models/(models)/entity/reading-streak.model';

export type {
    ReadingPreferences,
    UpdateReadingPreferencesDto,
    CreateReadingPreferencesDto
} from '@/models/(models)/entity/reading-preference.model';

// View types
export type {AppSettings} from '@/models/(models)/type/settings.types';
export type {
    StreakInfo,
    PeriodStats,
    ProgressStats,
    AchievementStats,
    AchievementUnlockEvent,
} from '@/models/(models)/type/progress.types';
export type {
    ConsistencyOverview,
    HabitConsistency,
    HabitId,
} from '@/models/(models)/type/consistency.types';
export type {CustomColors} from '@/models/(models)/type/theme.types';
