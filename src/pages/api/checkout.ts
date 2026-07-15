import type { APIRoute } from 'astro';
import {
    CURRENCY,
    HOLD_MINUTES,
    formatHour,
    isValidDateStr,
    isValidLength,
    isValidStartHour,
    studioNow
} from '@lib/booking';
import { computeAvailableStarts } from '@lib/availability';
import { computePriceCents } from '@lib/pricing';
import { attachStripeSession, createPendingBooking, getBusyIntervals } from '@lib/db';
import { getCalendarBusy } from '@lib/calendar';
import { getStripe, stripeEnabled } from '@lib/stripe';

export const prerender = false;

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });

export const POST: APIRoute = async ({ request }) => {
    let body: { date?: string; length?: number; startHour?: number; email?: string };
    try {
        body = await request.json();
    } catch {
        return json({ error: 'invalid_body' }, 400);
    }

    const date = String(body.date ?? '');
    const length = Number(body.length);
    const startHour = Number(body.startHour);
    const email = body.email ? String(body.email) : undefined;

    if (!isValidDateStr(date)) return json({ error: 'invalid_date' }, 400);
    if (!isValidLength(length)) return json({ error: 'invalid_length' }, 400);
    if (!isValidStartHour(startHour, length)) return json({ error: 'invalid_start' }, 400);

    const now = studioNow();
    if (date < now.date) return json({ error: 'past_date' }, 400);

    if (!stripeEnabled()) return json({ error: 'payments_not_configured' }, 503);

    try {
        // Re-validate availability server-side (guards against races/stale UI).
        const [dbBusy, calBusy] = await Promise.all([getBusyIntervals(date), getCalendarBusy(date)]);
        const busy = [...dbBusy, ...calBusy];
        const isFree = computeAvailableStarts({ date, length, busy, now }).some(
            (s) => s.startHour === startHour
        );
        if (!isFree) return json({ error: 'slot_unavailable' }, 409);

        // Authoritative price — never trust anything from the client.
        const priceCents = computePriceCents(startHour, length);

        const bookingId = await createPendingBooking({
            date,
            startHour,
            length,
            priceCents,
            currency: CURRENCY,
            email
        });

        const origin = new URL(request.url).origin;
        const stripe = getStripe();

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: CURRENCY,
                        unit_amount: priceCents,
                        product_data: {
                            name: `DJTAL Studio Session — ${length}h`,
                            description: `${date} · ${formatHour(startHour)}–${formatHour(startHour + length)}`
                        }
                    },
                    quantity: 1
                }
            ],
            expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
            customer_email: email,
            metadata: { bookingId, date, startHour: String(startHour), length: String(length) },
            success_url: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/book`
        });

        await attachStripeSession(bookingId, session.id);

        return json({ url: session.url });
    } catch (err) {
        console.error('checkout error:', err);
        return json({ error: 'server_error' }, 500);
    }
};
