import type { APIRoute } from 'astro';
import { CURRENCY, isValidDateStr, isValidLength, studioNow, formatHour } from '@lib/booking';
import { computeAvailableStarts } from '@lib/availability';
import { formatCad } from '@lib/pricing';
import { getBusyIntervals } from '@lib/db';
import { getCalendarBusy } from '@lib/calendar';

export const prerender = false;

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? '';
    const length = Number(url.searchParams.get('length'));

    if (!isValidDateStr(date)) return json({ error: 'invalid_date' }, 400);
    if (!isValidLength(length)) return json({ error: 'invalid_length' }, 400);

    const now = studioNow();

    // Past dates have no availability.
    if (date < now.date) {
        return json({ date, length, currency: CURRENCY, slots: [] });
    }

    try {
        const [dbBusy, calBusy] = await Promise.all([getBusyIntervals(date), getCalendarBusy(date)]);
        const busy = [...dbBusy, ...calBusy];

        const slots = computeAvailableStarts({ date, length, busy, now }).map((s) => ({
            startHour: s.startHour,
            time: formatHour(s.startHour),
            endTime: formatHour(s.startHour + length),
            priceCents: s.priceCents,
            price: formatCad(s.priceCents)
        }));

        return json({ date, length, currency: CURRENCY, slots });
    } catch (err) {
        console.error('availability error:', err);
        return json({ error: 'server_error' }, 500);
    }
};
