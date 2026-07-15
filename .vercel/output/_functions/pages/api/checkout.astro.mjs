import { i as isValidDateStr, a as isValidLength, b as isValidStartHour, s as studioNow, C as CURRENCY, H as HOLD_MINUTES, f as formatHour } from '../../chunks/booking_C1UgfiBW.mjs';
import { c as computeAvailableStarts } from '../../chunks/availability_hsHqhNl_.mjs';
import { g as getBusyIntervals, a as getCalendarBusy, c as computePriceCents, b as createPendingBooking, d as attachStripeSession } from '../../chunks/calendar_BRxYh5_w.mjs';
import { s as stripeEnabled, g as getStripe } from '../../chunks/stripe_DliEVPzT.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" }
});
const POST = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const date = String(body.date ?? "");
  const length = Number(body.length);
  const startHour = Number(body.startHour);
  const email = body.email ? String(body.email) : void 0;
  if (!isValidDateStr(date)) return json({ error: "invalid_date" }, 400);
  if (!isValidLength(length)) return json({ error: "invalid_length" }, 400);
  if (!isValidStartHour(startHour, length)) return json({ error: "invalid_start" }, 400);
  const now = studioNow();
  if (date < now.date) return json({ error: "past_date" }, 400);
  if (!stripeEnabled()) return json({ error: "payments_not_configured" }, 503);
  try {
    const [dbBusy, calBusy] = await Promise.all([getBusyIntervals(date), getCalendarBusy(date)]);
    const busy = [...dbBusy, ...calBusy];
    const isFree = computeAvailableStarts({ date, length, busy, now }).some(
      (s) => s.startHour === startHour
    );
    if (!isFree) return json({ error: "slot_unavailable" }, 409);
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
      mode: "payment",
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
      expires_at: Math.floor(Date.now() / 1e3) + HOLD_MINUTES * 60,
      customer_email: email,
      metadata: { bookingId, date, startHour: String(startHour), length: String(length) },
      success_url: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book`
    });
    await attachStripeSession(bookingId, session.id);
    return json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return json({ error: "server_error" }, 500);
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
