import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { getStripe, stripeEnabled } from '@lib/stripe';
import { confirmBooking, getBooking, markSessionExpired } from '@lib/db';
import { createCalendarEvent } from '@lib/calendar';
import { readEnv } from '@lib/env';

export const prerender = false;

/**
 * Stripe webhook. A booking is only ever confirmed here — after payment
 * actually succeeds — and then mirrored into Google Calendar.
 */
export const POST: APIRoute = async ({ request }) => {
    const secret = readEnv('STRIPE_WEBHOOK_SECRET');
    if (!stripeEnabled() || !secret) {
        return new Response('webhook not configured', { status: 503 });
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) return new Response('missing signature', { status: 400 });

    const raw = await request.text();

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(raw, signature, secret);
    } catch (err) {
        console.error('webhook signature verification failed:', err);
        return new Response('invalid signature', { status: 400 });
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const bookingId = session.metadata?.bookingId;

            if (bookingId) {
                const booking = await getBooking(bookingId);
                if (booking && booking.status !== 'confirmed') {
                    const name = session.customer_details?.name ?? null;
                    const email = session.customer_details?.email ?? null;

                    let googleEventId: string | null = null;
                    try {
                        googleEventId = await createCalendarEvent({
                            date: booking.date,
                            startHour: Number(booking.start_hour),
                            length: Number(booking.length),
                            priceCents: Number(booking.price_cents),
                            customerName: name,
                            email
                        });
                    } catch (calErr) {
                        // Don't fail the booking if the calendar mirror hiccups.
                        console.error('calendar mirror failed:', calErr);
                    }

                    await confirmBooking(bookingId, {
                        paymentIntent:
                            typeof session.payment_intent === 'string' ? session.payment_intent : null,
                        name,
                        email,
                        googleEventId
                    });
                }
            }
        } else if (event.type === 'checkout.session.expired') {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.id) await markSessionExpired(session.id);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('webhook handler error:', err);
        return new Response('handler error', { status: 500 });
    }
};
