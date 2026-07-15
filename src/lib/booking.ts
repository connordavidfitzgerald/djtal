/**
 * Core booking domain constants + pure helpers.
 * Safe to import from both the browser and the server (no Node/DB deps here).
 */

export const TIMEZONE = 'America/Toronto'; // Montréal
export const OPEN_HOUR = 9; // studio opens 9am
export const CLOSE_HOUR = 24; // closes at midnight
export const EARLY_END_HOUR = 16; // early rate applies before 4pm, late from 4pm
export const MIN_LENGTH = 1;
export const MAX_LENGTH = 6;
export const CURRENCY = 'cad';

/** How long an unpaid pending booking holds its slot (also the Stripe session TTL). */
export const HOLD_MINUTES = 30;

export const LENGTHS: number[] = Array.from(
    { length: MAX_LENGTH - MIN_LENGTH + 1 },
    (_, i) => MIN_LENGTH + i
);

export interface Interval {
    start: number; // hour-of-day, 0–24 (fractional allowed)
    end: number;
}

export function isValidLength(length: number): boolean {
    return Number.isInteger(length) && length >= MIN_LENGTH && length <= MAX_LENGTH;
}

/** Every hour a session of `length` could start on, keeping it inside opening hours. */
export function possibleStartHours(length: number): number[] {
    const out: number[] = [];
    for (let h = OPEN_HOUR; h <= CLOSE_HOUR - length; h++) out.push(h);
    return out;
}

export function isValidStartHour(startHour: number, length: number): boolean {
    return possibleStartHours(length).includes(startHour);
}

export function isValidDateStr(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Break a Date into the studio timezone's calendar date + fractional hour-of-day. */
export function tzParts(date: Date): { date: string; hour: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    let hour = parseInt(get('hour'), 10);
    if (hour === 24) hour = 0; // some engines emit 24 at midnight
    const minute = parseInt(get('minute'), 10);

    return {
        date: `${get('year')}-${get('month')}-${get('day')}`,
        hour: hour + minute / 60
    };
}

/** Current studio-local date + hour. */
export function studioNow(now: Date = new Date()): { date: string; hour: number } {
    return tzParts(now);
}

/** "9:00 AM", "12:00 AM" (midnight), "12:00 PM" (noon). */
export function formatHour(hour: number): string {
    const h = (((hour % 24) + 24) % 24) | 0;
    const period = h < 12 ? 'AM' : 'PM';
    let display = h % 12;
    if (display === 0) display = 12;
    return `${display}:00 ${period}`;
}
