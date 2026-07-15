# DJTAL

Website + booking system for DJTAL — a cost-friendly, accessible DJ studio in Montréal.

Stack:

- **[Astro](https://astro.build)** (SSR via `@astrojs/node`) — pages are static; the booking API routes render on-demand
- **[Tailwind CSS v4](https://tailwindcss.com)** — styling (via `@tailwindcss/vite`)
- **[GSAP](https://gsap.com)** — animation
- **[Stripe](https://stripe.com)** — payments (Checkout)
- **[libSQL / Turso](https://turso.tech)** — booking database (local SQLite file by default)
- **[Google Calendar](https://developers.google.com/calendar)** — staff-facing mirror + secondary busy source

## Getting started

```bash
npm install
cp .env.example .env   # fill in for payments + calendar (optional for local dev)
npm run dev
```

The site runs at `http://localhost:4321`. Availability works out of the box against a local SQLite file (`data/djtal.db`); payments and calendar sync require env vars.

## Scripts

| Command           | Action                                      |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the local dev server                  |
| `npm run build`   | Type-check and build to `./dist/`           |
| `npm run preview` | Preview the production build locally        |

## How booking works

**Flow:** pick date → pick length (1–6h) → the app shows only start times with that many free hours in a row → pick a start → see the total → **Checkout** → Stripe → on paid, the booking is confirmed and mirrored to Google Calendar.

- **Source of truth = the database.** Confirmed bookings (plus pending ones inside a 30-min hold) mark hours busy.
- **Google Calendar is both a mirror and a busy source.** Every paid booking is written there so staff see it on any device; any event staff add manually (maintenance, walk-ins) is read back as busy time. Staff self-serve blocking from Calendar; cancels/refunds run through the app.
- **Prices are always recomputed on the server** — the client price is display-only, never trusted.

### Pricing

Per-hour, billed by the tier each hour falls in. The **length** sets the rate bucket (1–2h vs 3h+); the **hour** sets early vs late.

| | Early (9am–4pm) | Late (4pm–12am) |
| --- | --- | --- |
| 1–2h | $22.00 / hr | $27.00 / hr |
| 3h+ | $19.67 / hr | $23.00 / hr |

A session that crosses 4pm is split per hour — e.g. a 3h session from 3pm = 1 early hour + 2 late hours at the 3h+ rates = `19.67 + 23 + 23 = $65.67`. Rates live in `src/lib/pricing.ts`; studio hours/lengths in `src/lib/booking.ts`.

### Setup for live payments

1. **Stripe:** put `STRIPE_SECRET_KEY` in `.env`. Create a webhook to `/api/stripe-webhook` for `checkout.session.completed` and `checkout.session.expired`, and set `STRIPE_WEBHOOK_SECRET`. Locally: `stripe listen --forward-to localhost:4321/api/stripe-webhook`.
2. **Database (prod):** point `DATABASE_URL` / `DATABASE_AUTH_TOKEN` at a hosted libSQL/Turso instance.
3. **Google Calendar:** create a service account with the Calendar API enabled, share the studio calendar with its email (edit access), and set `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`.

See `.env.example` for the full list.

## Structure

```
src/
├── assets/              # images + svgs
├── components/          # Nav, Meter, Footer, BookingWidget
├── layouts/             # Layout.astro — shared shell
├── lib/                 # booking domain: constants, pricing, availability, db, calendar, stripe
├── pages/
│   ├── index / about / book / book/success
│   └── api/             # availability (GET), checkout (POST), stripe-webhook (POST)
├── scripts/             # app.ts — GSAP entrance animations
└── styles/              # global.css — Tailwind theme + base styles
```

## Deploying elsewhere

The app uses the `@astrojs/node` adapter (portable, self-hostable). To deploy on Vercel/Netlify instead, swap the adapter in `astro.config.mjs` and set the same env vars in the host's dashboard.
