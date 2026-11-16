/**
 * Text of the scheduled reminders.
 *
 * A local notification's text is fixed at the moment it is scheduled; the OS
 * cannot ask the app for fresh numbers when it fires. The app therefore
 * schedules one notification per day for the coming days and rewrites them
 * whenever the progress changes or the app comes to the foreground.
 *
 * That makes the text for future days predictable: a notification scheduled
 * for a later day is only ever delivered unchanged if the app was not opened
 * in between, and without opening the app nothing can have been read. So for
 * every day after today "nothing read yet" is the correct text, and today's
 * notification always carries the real numbers.
 */

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface ReminderText {
    title: string;
    body: string;
}

export interface ReminderProgress {
    /** Verses read today. */
    versesReadToday: number;
    dailyVerseGoal: number;
    /** Current streak in days, as of today. */
    currentStreak: number;
    readToday: boolean;
}

/** Morning reminder; identical every day. */
export function buildDailyReminder(progress: ReminderProgress, t: Translate): ReminderText {
    return {
        title: t('notifications.daily.title'),
        body: t('notifications.daily.body', {goal: progress.dailyVerseGoal}),
    };
}

/**
 * Daily goal check.
 * @param dayOffset 0 = today, 1 = tomorrow, ...
 */
export function buildGoalReminder(dayOffset: number, progress: ReminderProgress, t: Translate): ReminderText {
    const read = dayOffset === 0 ? progress.versesReadToday : 0;
    const goal = progress.dailyVerseGoal;
    const title = t('notifications.goal.title');

    if (read >= goal) {
        return {title, body: t('notifications.goal.completed', {goal})};
    }
    if (read > 0) {
        return {title, body: t('notifications.goal.partial', {read, goal})};
    }
    return {title, body: t('notifications.goal.notStarted', {goal})};
}

/**
 * Evening streak reminder. Returns null when no reminder is needed
 * (today's reading is already done, so the streak is safe).
 * @param dayOffset 0 = today, 1 = tomorrow, ...
 */
export function buildStreakReminder(dayOffset: number, progress: ReminderProgress, t: Translate): ReminderText | null {
    if (dayOffset === 0 && progress.readToday) return null;

    // The streak the user will be defending on that day, assuming the app is
    // not opened before then: today's streak today, the same streak tomorrow
    // if today was read, and a broken streak after any missed day.
    let streak = 0;
    if (dayOffset === 0 || (dayOffset === 1 && progress.readToday)) {
        streak = progress.currentStreak;
    }

    if (streak === 0) {
        return {title: t('notifications.streak.startTitle'), body: t('notifications.streak.startBody')};
    }
    if (streak < 7) {
        return {
            title: t('notifications.streak.keepTitle'),
            body: t('notifications.streak.keepBody', {count: streak}),
        };
    }
    return {
        title: t('notifications.streak.protectTitle'),
        body: t('notifications.streak.protectBody', {count: streak}),
    };
}
