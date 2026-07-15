import { google } from 'googleapis';
import { CLOSE_HOUR, OPEN_HOUR, TIMEZONE, tzParts, type Interval } from './booking';
import { formatCad } from './pricing';
import { readEnv } from './env';

/**
 * Google Calendar as staff-facing mirror + a secondary busy source.
 * Confirmed bookings are written here; any event staff add manually
 * (maintenance, walk-ins) is read back as busy time.
 *
 * All functions no-op safely until a service account is configured, so the
 * rest of the app works without Google credentials.
 */

interface Config {
    email: string;
    key: string;
    calendarId: string;
}

function getConfig(): Config | null {
    const email = readEnv('GOOGLE_CLIENT_EMAIL');
    const key = readEnv('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    const calendarId = readEnv('GOOGLE_CALENDAR_ID');
    if (!email || !key || !calendarId) return null;
    return { email, key, calendarId };
}

export function calendarEnabled(): boolean {
    return getConfig() !== null;
}

function getCalendar(cfg: Config) {
    const auth = new google.auth.JWT({
        email: cfg.email,
        key: cfg.key,
        scopes: ['https://www.googleapis.com/auth/calendar']
    });
    return google.calendar({ version: 'v3', auth });
}

function nextDay(date: string): string {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

/** Busy intervals (studio hour-of-day) contributed by calendar events on `date`. */
export async function getCalendarBusy(date: string): Promise<Interval[]> {
    const cfg = getConfig();
    if (!cfg) return [];

    const cal = getCalendar(cfg);
    const res = await cal.events.list({
        calendarId: cfg.calendarId,
        // Wide UTC window that safely brackets the studio-local day (UTC-4/-5).
        timeMin: `${date}T00:00:00Z`,
        timeMax: `${nextDay(date)}T08:00:00Z`,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
    });

    const intervals: Interval[] = [];

    for (const ev of res.data.items ?? []) {
        if (ev.status === 'cancelled') continue;

        // All-day event: block the whole day if it covers `date`.
        if (ev.start?.date && ev.end?.date) {
            if (ev.start.date <= date && date < ev.end.date) {
                intervals.push({ start: OPEN_HOUR, end: CLOSE_HOUR });
            }
            continue;
        }

        if (!ev.start?.dateTime || !ev.end?.dateTime) continue;

        const s = tzParts(new Date(ev.start.dateTime));
        const e = tzParts(new Date(ev.end.dateTime));

        // Skip events that don't touch our date at all.
        if (s.date > date || e.date < date) continue;

        const start = s.date < date ? OPEN_HOUR : s.hour;
        const end = e.date > date ? CLOSE_HOUR : e.hour;

        const clampedStart = Math.max(OPEN_HOUR, start);
        const clampedEnd = Math.min(CLOSE_HOUR, end);
        if (clampedEnd > clampedStart) {
            intervals.push({ start: clampedStart, end: clampedEnd });
        }
    }

    return intervals;
}

export interface CalendarBooking {
    date: string;
    startHour: number;
    length: number;
    priceCents: number;
    customerName?: string | null;
    email?: string | null;
}

/** Mirror a confirmed booking into the calendar. Returns the event id (or null). */
export async function createCalendarEvent(b: CalendarBooking): Promise<string | null> {
    const cfg = getConfig();
    if (!cfg) return null;

    const cal = getCalendar(cfg);
    const who = b.customerName || b.email || 'Booking';
    const start = `${b.date}T${pad2(b.startHour)}:00:00`;
    const end = `${b.date}T${pad2(b.startHour + b.length)}:00:00`;

    const res = await cal.events.insert({
        calendarId: cfg.calendarId,
        requestBody: {
            summary: `Studio — ${who} (${b.length}h)`,
            description: [
                `Booked & paid via djt.al`,
                b.email ? `Email: ${b.email}` : null,
                `Total: ${formatCad(b.priceCents)} CAD`
            ]
                .filter(Boolean)
                .join('\n'),
            start: { dateTime: start, timeZone: TIMEZONE },
            end: { dateTime: end, timeZone: TIMEZONE }
        }
    });

    return res.data.id ?? null;
}
