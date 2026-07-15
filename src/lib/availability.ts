import { possibleStartHours, type Interval } from './booking';
import { computePriceCents } from './pricing';

export interface Slot {
    startHour: number;
    priceCents: number;
}

interface Args {
    date: string;
    length: number;
    busy: Interval[];
    /** Studio "now" — used to hide past start times when booking today. */
    now?: { date: string; hour: number };
}

/**
 * Start hours whose full [start, start+length) window is free of every busy
 * interval — i.e. the session has that many free hours in a row.
 */
export function computeAvailableStarts({ date, length, busy, now }: Args): Slot[] {
    const minStart = now && now.date === date ? Math.ceil(now.hour) : -Infinity;

    return possibleStartHours(length)
        .filter((start) => start >= minStart)
        .filter((start) => {
            const end = start + length;
            // Overlap test: two intervals overlap iff start < b.end && b.start < end.
            return !busy.some((b) => start < b.end && b.start < end);
        })
        .map((start) => ({ startHour: start, priceCents: computePriceCents(start, length) }));
}
