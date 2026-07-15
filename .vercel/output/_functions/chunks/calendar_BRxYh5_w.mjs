import { createClient } from '@libsql/client';
import fs from 'node:fs';
import { E as EARLY_END_HOUR, H as HOLD_MINUTES, t as tzParts, T as TIMEZONE, c as CLOSE_HOUR, O as OPEN_HOUR } from './booking_C1UgfiBW.mjs';
import { google } from 'googleapis';
import { g as getEnv$1, s as setOnSetGetEnv } from './runtime_1tkDUGik.mjs';

const RATES = {
  early: { short: 2200, long: 1967 },
  // $22.00 / $19.67
  late: { short: 2700, long: 2300 }
  //  $27.00 / $23.00
};
function rateBucket(length) {
  return length <= 2 ? "short" : "long";
}
function periodForHour(hour) {
  return hour < EARLY_END_HOUR ? "early" : "late";
}
function computePriceCents(startHour, length) {
  const bucket = rateBucket(length);
  let cents = 0;
  for (let i = 0; i < length; i++) {
    cents += RATES[periodForHour(startHour + i)][bucket];
  }
  return cents;
}
function formatCad(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check

// @ts-expect-error
/** @returns {string} */
// used while generating the virtual module
// biome-ignore lint/correctness/noUnusedFunctionParameters: `key` is used by the generated code
const getEnv = (key) => {
	return getEnv$1(key);
};

const getSecret = (key) => {
	return getEnv(key);
};

setOnSetGetEnv(() => {
	
});

function readEnv(key) {
  let value;
  try {
    value = getSecret(key) ?? void 0;
  } catch {
    value = void 0;
  }
  return value && value !== "" ? value : process.env[key];
}

const url = readEnv("DATABASE_URL") ?? "file:./data/djtal.db";
if (url.startsWith("file:")) {
  const path = url.slice("file:".length);
  const dir = path.split("/").slice(0, -1).join("/");
  if (dir) fs.mkdirSync(dir, { recursive: true });
}
const client = createClient({ url, authToken: readEnv("DATABASE_AUTH_TOKEN") });
let initialized = null;
function initDb() {
  if (!initialized) {
    initialized = client.execute(
      `CREATE TABLE IF NOT EXISTS bookings (
                    id TEXT PRIMARY KEY,
                    date TEXT NOT NULL,
                    start_hour INTEGER NOT NULL,
                    length INTEGER NOT NULL,
                    price_cents INTEGER NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'cad',
                    status TEXT NOT NULL DEFAULT 'pending',
                    customer_name TEXT,
                    customer_email TEXT,
                    stripe_session_id TEXT,
                    stripe_payment_intent TEXT,
                    google_event_id TEXT,
                    created_at TEXT NOT NULL
                )`
    ).then(() => void 0);
  }
  return initialized;
}
async function getBusyIntervals(date) {
  await initDb();
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 6e4).toISOString();
  const res = await client.execute({
    sql: `SELECT start_hour, length FROM bookings
              WHERE date = ?
                AND (status = 'confirmed' OR (status = 'pending' AND created_at > ?))`,
    args: [date, cutoff]
  });
  return res.rows.map((r) => {
    const start = Number(r.start_hour);
    return { start, end: start + Number(r.length) };
  });
}
async function createPendingBooking(b) {
  await initDb();
  const id = crypto.randomUUID();
  await client.execute({
    sql: `INSERT INTO bookings
                (id, date, start_hour, length, price_cents, currency, status, customer_email, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    args: [id, b.date, b.startHour, b.length, b.priceCents, b.currency, b.email ?? null, (/* @__PURE__ */ new Date()).toISOString()]
  });
  return id;
}
async function attachStripeSession(id, sessionId) {
  await client.execute({
    sql: `UPDATE bookings SET stripe_session_id = ? WHERE id = ?`,
    args: [sessionId, id]
  });
}
async function getBooking(id) {
  await initDb();
  const res = await client.execute({ sql: `SELECT * FROM bookings WHERE id = ?`, args: [id] });
  return res.rows[0] ?? null;
}
async function confirmBooking(id, data) {
  await client.execute({
    sql: `UPDATE bookings
              SET status = 'confirmed',
                  stripe_payment_intent = ?,
                  customer_name = COALESCE(?, customer_name),
                  customer_email = COALESCE(?, customer_email),
                  google_event_id = ?
              WHERE id = ?`,
    args: [data.paymentIntent ?? null, data.name ?? null, data.email ?? null, data.googleEventId ?? null, id]
  });
}
async function markSessionExpired(sessionId) {
  await client.execute({
    sql: `UPDATE bookings SET status = 'expired'
              WHERE stripe_session_id = ? AND status = 'pending'`,
    args: [sessionId]
  });
}

function getConfig() {
  const email = readEnv("GOOGLE_CLIENT_EMAIL");
  const key = readEnv("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  const calendarId = readEnv("GOOGLE_CALENDAR_ID");
  if (!email || !key || !calendarId) return null;
  return { email, key, calendarId };
}
function getCalendar(cfg) {
  const auth = new google.auth.JWT({
    email: cfg.email,
    key: cfg.key,
    scopes: ["https://www.googleapis.com/auth/calendar"]
  });
  return google.calendar({ version: "v3", auth });
}
function nextDay(date) {
  const d = /* @__PURE__ */ new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
async function getCalendarBusy(date) {
  const cfg = getConfig();
  if (!cfg) return [];
  const cal = getCalendar(cfg);
  const res = await cal.events.list({
    calendarId: cfg.calendarId,
    // Wide UTC window that safely brackets the studio-local day (UTC-4/-5).
    timeMin: `${date}T00:00:00Z`,
    timeMax: `${nextDay(date)}T08:00:00Z`,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250
  });
  const intervals = [];
  for (const ev of res.data.items ?? []) {
    if (ev.status === "cancelled") continue;
    if (ev.start?.date && ev.end?.date) {
      if (ev.start.date <= date && date < ev.end.date) {
        intervals.push({ start: OPEN_HOUR, end: CLOSE_HOUR });
      }
      continue;
    }
    if (!ev.start?.dateTime || !ev.end?.dateTime) continue;
    const s = tzParts(new Date(ev.start.dateTime));
    const e = tzParts(new Date(ev.end.dateTime));
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
async function createCalendarEvent(b) {
  const cfg = getConfig();
  if (!cfg) return null;
  const cal = getCalendar(cfg);
  const who = b.customerName || b.email || "Booking";
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
      ].filter(Boolean).join("\n"),
      start: { dateTime: start, timeZone: TIMEZONE },
      end: { dateTime: end, timeZone: TIMEZONE }
    }
  });
  return res.data.id ?? null;
}

export { getCalendarBusy as a, createPendingBooking as b, computePriceCents as c, attachStripeSession as d, getBooking as e, formatCad as f, getBusyIntervals as g, createCalendarEvent as h, confirmBooking as i, markSessionExpired as m, readEnv as r };
