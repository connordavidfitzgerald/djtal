import { createClient } from '@libsql/client';
import fs from 'node:fs';
import { HOLD_MINUTES, type Interval } from './booking';
import { readEnv } from './env';

/**
 * Source of truth for bookings. Defaults to a local SQLite file so the app
 * runs with no setup; point DATABASE_URL at a hosted libSQL/Turso instance
 * (with DATABASE_AUTH_TOKEN) for production.
 */

const url = readEnv('DATABASE_URL') ?? 'file:./data/djtal.db';

// Ensure the parent directory exists for local file databases.
if (url.startsWith('file:')) {
    const path = url.slice('file:'.length);
    const dir = path.split('/').slice(0, -1).join('/');
    if (dir) fs.mkdirSync(dir, { recursive: true });
}

const client = createClient({ url, authToken: readEnv('DATABASE_AUTH_TOKEN') });

let initialized: Promise<void> | null = null;

export function initDb(): Promise<void> {
    if (!initialized) {
        initialized = client
            .execute(
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
            )
            .then(() => undefined);
    }
    return initialized;
}

export interface BookingRow {
    id: string;
    date: string;
    start_hour: number;
    length: number;
    price_cents: number;
    currency: string;
    status: string;
    customer_name: string | null;
    customer_email: string | null;
    stripe_session_id: string | null;
    stripe_payment_intent: string | null;
    google_event_id: string | null;
    created_at: string;
}

/**
 * Busy intervals for a date: confirmed bookings, plus pending ones still
 * within their hold window (a soft hold so two people can't pay for the
 * same slot at once). Abandoned/expired pendings are ignored.
 */
export async function getBusyIntervals(date: string): Promise<Interval[]> {
    await initDb();
    const cutoff = new Date(Date.now() - HOLD_MINUTES * 60_000).toISOString();
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

export interface NewBooking {
    date: string;
    startHour: number;
    length: number;
    priceCents: number;
    currency: string;
    email?: string | null;
}

export async function createPendingBooking(b: NewBooking): Promise<string> {
    await initDb();
    const id = crypto.randomUUID();
    await client.execute({
        sql: `INSERT INTO bookings
                (id, date, start_hour, length, price_cents, currency, status, customer_email, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        args: [id, b.date, b.startHour, b.length, b.priceCents, b.currency, b.email ?? null, new Date().toISOString()]
    });
    return id;
}

export async function attachStripeSession(id: string, sessionId: string): Promise<void> {
    await client.execute({
        sql: `UPDATE bookings SET stripe_session_id = ? WHERE id = ?`,
        args: [sessionId, id]
    });
}

export async function getBooking(id: string): Promise<BookingRow | null> {
    await initDb();
    const res = await client.execute({ sql: `SELECT * FROM bookings WHERE id = ?`, args: [id] });
    return (res.rows[0] as unknown as BookingRow) ?? null;
}

export interface ConfirmData {
    paymentIntent?: string | null;
    name?: string | null;
    email?: string | null;
    googleEventId?: string | null;
}

export async function confirmBooking(id: string, data: ConfirmData): Promise<void> {
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

/** Release a slot when its checkout session expires unpaid. */
export async function markSessionExpired(sessionId: string): Promise<void> {
    await client.execute({
        sql: `UPDATE bookings SET status = 'expired'
              WHERE stripe_session_id = ? AND status = 'pending'`,
        args: [sessionId]
    });
}
