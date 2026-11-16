import {bibleVerseProgressRepository, tasksRepository} from '@/repository';
import type {ConsistencyOverview, HabitConsistency, HabitId} from '@/models';
import {
    DAILY_TEXT_TASK,
    FAMILY_WORSHIP_TASK,
    MIDWEEK_PREPARATION_TASK,
    WEEKEND_PREPARATION_TASK,
    WEEKLY_BIBLE_READING_TASK,
} from '@/constants/tasks';
import {diffInDays, toLocalDateString} from '@/utils/(utils)/date.utils';

/** A Monday; days and weeks are counted from here. */
const EPOCH_MONDAY = '1970-01-05';

const DAILY_RATE_WINDOW = 30;
const DAILY_RECENT_COUNT = 7;
const WEEKLY_RATE_WINDOW = 12;
const WEEKLY_RECENT_COUNT = 8;

/** Number of the day since EPOCH_MONDAY. */
const dayIndex = (date: string): number => diffInDays(EPOCH_MONDAY, date);
/** Number of the (Monday-based) week a day falls in. */
const weekIndex = (date: string): number => Math.floor(dayIndex(date) / 7);

export interface PeriodSummary {
    currentStreak: number;
    bestStreak: number;
    total: number;
    recentRate: number;
    recentWindow: number;
    recent: boolean[];
    doneThisPeriod: boolean;
}

/**
 * Summarises how regularly something was done.
 *
 * Works on period numbers, so the same logic serves daily routines (period =
 * day) and weekly ones (period = week).
 *
 * @param donePeriods   periods in which it was done
 * @param currentPeriod the period that is running now
 * @param rateWindow    how many recent periods the rate looks at
 * @param recentCount   how many recent periods to list individually
 */
export function summarizePeriods(
    donePeriods: Iterable<number>,
    currentPeriod: number,
    rateWindow: number,
    recentCount: number
): PeriodSummary {
    // Entries in the future (clock changes, travel) are ignored.
    const periods = [...new Set(donePeriods)].filter(period => period <= currentPeriod).sort((a, b) => a - b);
    const done = new Set(periods);

    let bestStreak = 0;
    let run = 0;
    periods.forEach((period, index) => {
        run = index > 0 && period === periods[index - 1] + 1 ? run + 1 : 1;
        bestStreak = Math.max(bestStreak, run);
    });

    // The current period is still open, so a streak that reaches the previous
    // period is not broken yet.
    const last = periods.length > 0 ? periods[periods.length - 1] : null;
    const currentStreak = last !== null && currentPeriod - last <= 1 ? run : 0;

    // Do not count periods before the routine was ever done as "missed".
    const recentWindow = periods.length > 0 ? Math.min(rateWindow, currentPeriod - periods[0] + 1) : 0;
    let doneInWindow = 0;
    for (let period = currentPeriod - recentWindow + 1; period <= currentPeriod; period++) {
        if (done.has(period)) doneInWindow += 1;
    }

    const recent: boolean[] = [];
    for (let period = currentPeriod - recentCount + 1; period <= currentPeriod; period++) {
        recent.push(done.has(period));
    }

    return {
        currentStreak,
        bestStreak,
        total: periods.length,
        recentRate: recentWindow > 0 ? doneInWindow / recentWindow : 0,
        recentWindow,
        recent,
        doneThisPeriod: done.has(currentPeriod),
    };
}

/**
 * How regularly the routines are kept: Bible reading, the daily text and the
 * weekly tasks. Everything is derived from what is already stored (read
 * verses and checked-off tasks); nothing extra is recorded.
 */
export class ConsistencyService {

    async getOverview(now: Date = new Date()): Promise<ConsistencyOverview> {
        const today = toLocalDateString(now);
        const currentDay = dayIndex(today);
        const currentWeek = weekIndex(today);

        const [readingDays, dailyTextDates, weeklyReading, midweek, weekend, familyWorship] = await Promise.all([
            bibleVerseProgressRepository.findDailyCounts().then(days => days.map(day => day.date)),
            tasksRepository.findCompletedDates(DAILY_TEXT_TASK),
            tasksRepository.findCompletedWeeks(WEEKLY_BIBLE_READING_TASK),
            tasksRepository.findCompletedWeeks(MIDWEEK_PREPARATION_TASK),
            tasksRepository.findCompletedWeeks(WEEKEND_PREPARATION_TASK),
            tasksRepository.findCompletedWeeks(FAMILY_WORSHIP_TASK),
        ]);

        const daily = (id: HabitId, dates: string[]): HabitConsistency =>
            toHabit(id, 'daily', summarizePeriods(dates.map(dayIndex), currentDay, DAILY_RATE_WINDOW, DAILY_RECENT_COUNT));
        const weekly = (id: HabitId, mondays: string[]): HabitConsistency =>
            toHabit(id, 'weekly', summarizePeriods(mondays.map(weekIndex), currentWeek, WEEKLY_RATE_WINDOW, WEEKLY_RECENT_COUNT));

        const habits = [
            daily('bibleReading', readingDays),
            daily('dailyText', dailyTextDates),
            weekly('weeklyBibleReading', weeklyReading),
            weekly('midweekPreparation', midweek),
            weekly('weekendPreparation', weekend),
            weekly('familyWorship', familyWorship),
        ];

        // Weeks in which several weekly tasks were all done.
        const weeksWithAll = (...lists: string[][]): number[] => {
            const sets = lists.map(list => new Set(list.map(weekIndex)));
            return [...sets[0]].filter(week => sets.every(set => set.has(week)));
        };
        const preparation = summarizePeriods(weeksWithAll(midweek, weekend), currentWeek, WEEKLY_RATE_WINDOW, 0);
        const perfect = summarizePeriods(weeksWithAll(weeklyReading, midweek, weekend, familyWorship), currentWeek, WEEKLY_RATE_WINDOW, 0);

        // This week so far: one check-off per day for each daily routine up to
        // today, plus one per weekly task.
        const daysIntoWeek = (currentDay % 7) + 1;
        const dailyHabits = habits.filter(habit => habit.cadence === 'daily');
        const weeklyHabits = habits.filter(habit => habit.cadence === 'weekly');
        const doneThisWeek =
            dailyHabits.reduce((sum, habit) => sum + habit.recent.slice(-daysIntoWeek).filter(Boolean).length, 0)
            + weeklyHabits.filter(habit => habit.doneThisPeriod).length;

        return {
            habits,
            thisWeek: {done: doneThisWeek, total: dailyHabits.length * daysIntoWeek + weeklyHabits.length},
            meetingPreparation: {currentStreak: preparation.currentStreak, bestStreak: preparation.bestStreak},
            perfectWeeks: {currentStreak: perfect.currentStreak, bestStreak: perfect.bestStreak, total: perfect.total},
        };
    }
}

function toHabit(id: HabitId, cadence: 'daily' | 'weekly', summary: PeriodSummary): HabitConsistency {
    return {
        id,
        cadence,
        currentStreak: summary.currentStreak,
        bestStreak: summary.bestStreak,
        totalCompletions: summary.total,
        recentRate: summary.recentRate,
        recentWindow: summary.recentWindow,
        recent: summary.recent,
        doneThisPeriod: summary.doneThisPeriod,
    };
}

export const consistencyService = new ConsistencyService();
