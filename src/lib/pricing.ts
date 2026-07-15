/**
 * Pricing. Per-hour, by tier — each hour is billed at the rate for the period
 * it falls in (early = before 4pm, late = 4pm onward). The 1–2h vs 3h+ rate
 * bucket is set by the *total* session length.
 *
 * All amounts are integer cents (CAD) to avoid floating-point drift.
 * Shared by the client (display) and the server (authoritative charge).
 */

import { EARLY_END_HOUR } from './booking';

type Period = 'early' | 'late';
type Bucket = 'short' | 'long';

// cents per hour
const RATES: Record<Period, Record<Bucket, number>> = {
    early: { short: 2200, long: 1967 }, // $22.00 / $19.67
    late: { short: 2700, long: 2300 } //  $27.00 / $23.00
};

/** 1–2h → short, 3h+ → long. Determined by total length. */
export function rateBucket(length: number): Bucket {
    return length <= 2 ? 'short' : 'long';
}

/** An hour block starting before 4pm is early; 4pm or later is late. */
export function periodForHour(hour: number): Period {
    return hour < EARLY_END_HOUR ? 'early' : 'late';
}

/** Total price in cents for a session of `length` hours starting at `startHour`. */
export function computePriceCents(startHour: number, length: number): number {
    const bucket = rateBucket(length);
    let cents = 0;
    for (let i = 0; i < length; i++) {
        cents += RATES[periodForHour(startHour + i)][bucket];
    }
    return cents;
}

/** 6567 → "$65.67". */
export function formatCad(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
