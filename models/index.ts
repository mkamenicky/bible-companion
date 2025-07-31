// Bible entities
export type {BibleBook, CreateBibleBookDto, UpdateBibleBookDto} from '@/models/(models)/entity/bible-book.model';
export type {
    BibleChapter, CreateBibleChapterDto, UpdateBibleChapterDto
} from '@/models/(models)/entity/bible-chapter.model';
export type {
    BibleVerse,
    BibleVerseDb,
    CreateBibleVerseDto,
    UpdateBibleVerseDto,
} from '@/models/(models)/entity/bible-verse.model';

// Reading plan and progress
export type {
    ReadingPlan,
    ProgressSummary,
    BookProgress,
    TaskState,
    TaskStates
} from '@/models/(models)/entity/reading-plan.model';

// Bible verse progress
export type {
    BibleVerseProgress,
    CreateBibleVerseProgressDto,
    UpdateBibleVerseProgressDto
} from '@/models/(models)/entity/bible-verse-progress.model';

// Reading records
export type {
    Reading,
    CreateReadingDto,
    UpdateReadingDto
} from '@/models/(models)/entity/reading.model';

// Feedback
export type {
    Feedback,
    CreateFeedbackDto,
    UpdateFeedbackDto
} from '@/models/(models)/entity/feedback.model';

// Tasks
export type {
    Task,
    CreateTaskDto,
    UpdateTaskDto
} from '@/models/(models)/entity/task.model';

// Reading plan configuration
export type {
    ReadingPlanConfig,
    CreateReadingPlanConfigDto,
    UpdateReadingPlanConfigDto
} from '@/models/(models)/entity/reading-plan-config.model';

// Daily reading assignments
export type {
    DailyReadingAssignment,
    CreateDailyReadingAssignmentDto,
    UpdateDailyReadingAssignmentDto,
    EnhancedDailyReadingAssignment
} from '@/models/(models)/entity/daily-reading-assignment.model';

// Achievement progress tracking
export type {
    CreateAchievementProgressDto,
    UpdateAchievementProgressDto,
    AchievementProgressModel,
} from '@/models/(models)/entity/achievement-progress.model';

export type {
    AchievementRule,
    CreateAchievementRuleDto,
    UpdateAchievementRuleDto,
} from '@/models/(models)/entity/achievement-rule.model';

export type {
    Achievement,
    CreateAchievementDto,
    UpdateAchievementDto,
} from '@/models/(models)/entity/achievement.model';

export type {
    CreateAchievementPrerequisiteDto,
    AchievementPrerequisite,
} from '@/models/(models)/entity/achievement-prerequisite.model';

// Reading session tracking for more granular analytics
export type {
    CreateReadingSessionDto,
    UpdateReadingSessionDto,
    ReadingSessionModel
} from '@/models/(models)/entity/reading-session.model';

// Database entities for persistent streak tracking
export type {
    CreateReadingStreakDto,
    UpdateReadingStreakDto,
    ReadingStreak
} from '@/models/(models)/entity/reading-streak.model';

// Database entities for persistent streak tracking
export type {
    ReadingGoal,
    UpdateReadingGoalDto,
    CreateReadingGoalDto
} from '@/models/(models)/entity/reading-goal.model';

// Database entities for persistent streak tracking
export type {
    ReadingPreferences,
    UpdateReadingPreferencesDto,
    CreateReadingPreferencesDto
} from '@/models/(models)/entity/reading-preference.model';

export type {
    BibleBookTopic,
    UpdateBibleBookTopic,
    CreateBibleBookTopic
} from '@/models/(models)/entity/bible-book-topic.model.ts';

export type {
    ReadingPlanProgress,
    UpdateReadingPlanProgress,
    CreateReadingPlanProgress
} from '@/models/(models)/entity/reading-plan-progress.model.ts';

export type {
    ReadingTopic,
    UpdateReadingTopic,
    CreateReadingTopic
} from '@/models/(models)/entity/reading-topic.model.ts';

// Re-export types and interfaces
export type {AppSettings} from '@/models/(models)/type/settings.types';
export type {
    StreakInfo,
    ReadingStats,
    PeriodStats,
    BibleProgress,
    ProgressStats,
    ReadingActivity,
    DetailedReadingStats,
    ProgressCalculationOptions,
    AchievementStats,
    AchievementUnlockEvent,
    UseProgressDataReturn,
    AchievementCalculationContext,
    AchievementCategory
} from '@/models/(models)/type/progress.types';

export type {CustomColors} from '@/models/(models)/type/theme.types';
export type {
    DatabaseConfig,
    DatabaseHealth,
    MutableTaskStates,
    TaskRow,
    CountRow,
    ProgressCountRow,
    TotalCountRow,
    VerseProgressRow,
    ReadingRow,
    ChapterRangeRow
} from '@/models/(models)/type/database.types';
