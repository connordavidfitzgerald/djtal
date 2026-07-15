import { p as possibleStartHours } from './booking_C1UgfiBW.mjs';
import { c as computePriceCents } from './calendar_BRxYh5_w.mjs';

function computeAvailableStarts({ date, length, busy, now }) {
  const minStart = now && now.date === date ? Math.ceil(now.hour) : -Infinity;
  return possibleStartHours(length).filter((start) => start >= minStart).filter((start) => {
    const end = start + length;
    return !busy.some((b) => start < b.end && b.start < end);
  }).map((start) => ({ startHour: start, priceCents: computePriceCents(start, length) }));
}

export { computeAvailableStarts as c };
