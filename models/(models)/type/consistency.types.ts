/** A routine whose regularity is tracked. */
export type HabitId =
    | 'bibleReading'
    | 'dailyText'
    | 'weeklyBibleReading'
    | 'midweekPreparation'
    | 'weekendPreparation'
    | 'familyWorship';

/** How regularly one routine has been kept. */
export interface HabitConsistency {
    id: HabitId;
    /** Daily routines are measured in days, weekly ones in weeks. */
    cadence: 'daily' | 'weekly';
    /** Consecutive periods up to now; still alive while the current period is open. */
    currentStreak: number;
    bestStreak: number;
    /** Number of days / weeks the routine was done, ever. */
    totalCompletions: number;
    /**
     * Share (0-1) of the recent periods in which it was done: the last 30
     * days or 12 weeks, or fewer if the routine is younger than that.
     */
    recentRate: number;
    /** Number of periods `recentRate` is based on (0 = never done yet). */
    recentWindow: number;
    /** The last 7 days / 8 weeks, oldest first; the last entry is the current one. */
    recent: boolean[];
    doneThisPeriod: boolean;
}

/** Regularity of all routines plus the totals the achievements are based on. */
export interface ConsistencyOverview {
    habits: HabitConsistency[];
    /** Completed and possible check-offs in the current week so far. */
    thisWeek: { done: number; total: number };
    /** Weeks in which both meeting preparations were done. */
    meetingPreparation: { currentStreak: number; bestStreak: number };
    /** Weeks in which all weekly tasks were done. */
    perfectWeeks: { currentStreak: number; bestStreak: number; total: number };
}
