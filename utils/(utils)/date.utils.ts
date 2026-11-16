/**
 * Date helpers.
 *
 * Every date the app stores is a *local* calendar day formatted as YYYY-MM-DD.
 * Never use `date.toISOString().split('T')[0]` for this: toISOString() converts
 * to UTC first, so in any timezone ahead of UTC the result is yesterday's date
 * for the first hours of the day (and always for a Date set to local midnight).
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/** Formats a Date as a local calendar day (YYYY-MM-DD). */
export function toLocalDateString(date: Date = new Date()): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses a YYYY-MM-DD string as local midnight of that day. */
export function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}

/** Returns a copy of the date at local midnight. */
export function startOfDay(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Returns a new date shifted by the given number of calendar days. */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/** Local midnight of the Monday of the week the date falls in. */
export function startOfWeek(date: Date = new Date()): Date {
    const day = startOfDay(date);
    return addDays(day, -((day.getDay() + 6) % 7));
}

/** The Monday of the date's week as YYYY-MM-DD. */
export function getMondayOfWeek(date: Date = new Date()): string {
    return toLocalDateString(startOfWeek(date));
}

/**
 * Whole calendar days from `from` to `to` (both YYYY-MM-DD).
 * Positive when `to` is later. Daylight-saving safe.
 */
export function diffInDays(from: string, to: string): number {
    const [fy, fm, fd] = from.split('-').map(Number);
    const [ty, tm, td] = to.split('-').map(Number);
    return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Validates an "HH:MM" 24h time string and returns its parts, or null. */
export function parseTime(time: string | null | undefined): { hour: number; minute: number } | null {
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time ?? '');
    return match ? {hour: Number(match[1]), minute: Number(match[2])} : null;
}

/** Formats a Date's local time as "HH:MM". */
export function toTimeString(date: Date): string {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The Monday-Sunday range of the date's week as "DD.MM - DD.MM". */
export function formatWeekRange(date: Date = new Date()): string {
    const monday = startOfWeek(date);
    const sunday = addDays(monday, 6);
    const format = (day: Date) => `${pad(day.getDate())}.${pad(day.getMonth() + 1)}`;
    return `${format(monday)} - ${format(sunday)}`;
}
