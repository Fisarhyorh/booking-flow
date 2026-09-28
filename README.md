# Book a Call

A public-facing appointment booking flow with real-time availability, double-booking protection enforced at the database level, and full form validation — built to demonstrate handling of edge cases most booking demos skip.

**Live demo:** _add your Vercel link here once deployed_

## Features

- **Service and time selection** — pick a service, a day, and an open time slot
- **Live availability** — already-booked slots are visibly disabled per service and date, not just rejected on submit
- **Past-time protection** — today's slots that have already passed are disabled automatically
- **Double-booking prevention, enforced twice:**
  - In the UI, by fetching taken slots before they're shown as selectable
  - In the database, via a unique constraint on service + date + time, so a race condition (two people booking the same slot seconds apart) can't slip through
- **Form validation** — required fields, valid email format, and no past dates, via `react-hook-form` + `zod`
- **Privacy-conscious data model** — the table holding names and emails is never readable through the public API; availability checks run against a separate table that only knows a slot is taken, not who booked it
- **Confirmation screen** — a clear summary after a successful booking, with an option to book another

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Validation:** react-hook-form + zod
- **Database:** Supabase (Postgres + Row Level Security)

## Why these choices

The data model is split into two tables on purpose. `bookings` holds contact details and is locked down so the public API can only insert into it, never read from it. `booked_slots` is a public-readable table that only stores which service/date/time combinations are taken, populated automatically by a database trigger whenever a booking is created. This means the app can show real-time availability to anyone visiting the page without ever exposing another person's name or email.

The unique constraint on `(service_id, booking_date, booking_time)` exists because a UI-only availability check has a race condition: two people could load the page, see the same open slot, and submit within moments of each other. The database constraint makes a true double-booking impossible regardless of timing, and the app catches that specific error to show a clear "that slot was just taken" message instead of a generic failure.

## Running it locally

1. Clone the repo:
   ```
   git clone https://github.com/YOUR-USERNAME/booking-flow.git
   cd booking-flow
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Supabase project at [supabase.com](https://supabase.com), then run the SQL in `bookings-schema.sql` and `services-rls-patch.sql` (both in this repo) via the Supabase SQL Editor.

4. Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
   Both values are in your Supabase dashboard under **Project Settings → API Keys**.

5. Run the dev server:
   ```
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Project structure

```
app/
  page.tsx              — the booking form and confirmation screen
lib/
  supabase.ts            — Supabase client setup
  schema.ts               — zod validation schema
bookings-schema.sql       — database schema, tables, and RLS policies
services-rls-patch.sql    — read-only access policy for the services table
```

## Known limitations

- No email confirmations are sent — the confirmation screen is the only record shown to the person booking. Adding transactional email (e.g. via Resend) would be a natural next step, but requires a verified sending domain to email arbitrary recipients reliably.
- Services and time slots are currently fixed in the code/database rather than admin-editable through a UI.