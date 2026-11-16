/**
 * The checklist tasks. The names double as storage keys in the `tasks`
 * table, so they must not be changed; display names come from the
 * translations (`tasks.*`).
 */
export const DAILY_TEXT_TASK = 'Daily Text';
export const WEEKLY_BIBLE_READING_TASK = 'Weekly Bible Reading (Meeting)';
export const MIDWEEK_PREPARATION_TASK = 'Midweek Meeting Preparation';
export const WEEKEND_PREPARATION_TASK = 'Weekend Meeting Preparation';
export const FAMILY_WORSHIP_TASK = 'Family Worship';

/** Tasks that are done once per week. */
export const WEEKLY_TASKS = [
    WEEKLY_BIBLE_READING_TASK,
    MIDWEEK_PREPARATION_TASK,
    WEEKEND_PREPARATION_TASK,
    FAMILY_WORSHIP_TASK,
];

/** Tasks that are done every day. */
export const DAILY_TASKS = [DAILY_TEXT_TASK];

/**
 * Weekly tasks are stored once per week under the week's Monday, with the
 * Monday appended to the name: "Family Worship_WEEKLY_2025-08-04".
 */
export const weeklyTaskKey = (taskName: string, monday: string): string => `${taskName}_WEEKLY_${monday}`;
