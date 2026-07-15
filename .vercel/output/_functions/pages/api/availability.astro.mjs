import { i as isValidDateStr, a as isValidLength, s as studioNow, f as formatHour, C as CURRENCY } from '../../chunks/booking_C1UgfiBW.mjs';
import { c as computeAvailableStarts } from '../../chunks/availability_hsHqhNl_.mjs';
import { g as getBusyIntervals, a as getCalendarBusy, f as formatCad } from '../../chunks/calendar_BRxYh5_w.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" }
});
const GET = async ({ request }) => {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const length = Number(url.searchParams.get("length"));
  if (!isValidDateStr(date)) return json({ error: "invalid_date" }, 400);
  if (!isValidLength(length)) return json({ error: "invalid_length" }, 400);
  const now = studioNow();
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
    console.error("availability error:", err);
    return json({ error: "server_error" }, 500);
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
