# Volunteer Shift Board

Volunteers browse upcoming events and sign up for shifts. Admins create events and shifts and see who's coming. A full-stack portfolio project, built in two days with spec-driven development.

- **Live demo:** https://lauritzkeans-volunteer-shift-board.vercel.app
- **API health:** https://lauritzkeans-volunteer-shift-board-api.onrender.com/api/health

## Demo logins

Both accounts are shared on purpose. The quickest way in is the **Continue as demo volunteer** or **Continue as demo admin** button on the login page.

| Account | Email | Password | What it can do |
|---|---|---|---|
| Demo volunteer | `demo.volunteer@example.com` | `123@Seaboo` | Browse events, sign up for shifts and manage them under My shifts. Starts with three upcoming shifts. |
| Demo admin | `demo.admin@example.com` | `123@Seaboo` | Everything a volunteer can, plus the Admin page: create events and shifts, see who signed up and remove volunteers. |

You can also create your own account on the sign-up page; new accounts are always volunteers. Only admins see the Admin link, and the API refuses admin requests from everyone else whatever the page shows. Shift sign-ups, My shifts and the Admin page are being built next (see Status), so for now every account can sign in and browse.

> The API runs on Render's free tier, which sleeps after 15 minutes without traffic. The first visit after a quiet spell shows a "Waking up the server…" notice for up to a minute.

## Status

Built one [OpenSpec](https://github.com/Fission-AI/OpenSpec) change at a time; the specs live in [`openspec/changes/`](openspec/changes/).

- Done: project setup, database schema, demo data, page layout, cold-start handling, deployment, browsing and filtering events, sign-in with roles and demo logins
- Next: shift sign-ups, the admin dashboard

## Tech stack

| Layer | Choice |
|---|---|
| Client | React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, React Router, React Hook Form |
| API | Express 5, TypeScript, Zod, in layers: routes → controllers → services → data |
| Sign-in | Firebase Authentication (email and password); the API verifies its ID tokens with `jose`, and roles live in the app database |
| Database | PostgreSQL on Neon, Prisma ORM 7 |
| Hosting | Vercel (client), Render (API), Neon (database), all on free tiers |
| Tests | Vitest and Supertest |

## Repository layout

```
client/     React app (Vite)
server/     Express API, Prisma schema, migrations and seed
openspec/   Specs and change proposals
```

## How sign-ups stay correct

Signing up is "check, then insert": is there a spot, is the volunteer already on this shift, does it clash with another of their shifts? Done naively, two requests can both read "7 of 8 taken" and both insert, leaving 9 people on an 8-person shift. The API closes that gap with one transaction ([`server/src/services/signups.ts`](server/src/services/signups.ts)):

1. **Lock the volunteer's row, then the shift's row**, with `SELECT … FOR UPDATE` ([`server/src/data/signups.ts`](server/src/data/signups.ts)). Any other sign-up that needs one of those rows waits until this transaction commits. Postgres runs at its default isolation level, READ COMMITTED, so once the waiting request continues, its checks see the sign-up that just committed.
   - The **shift** lock guards capacity. "At most 8 sign-ups" spans many rows, which a plain constraint can't express.
   - The **volunteer** lock guards overlaps. Two overlapping shifts are different rows, so only a lock on the person stops two requests from passing the overlap check at the same moment.
   - Every request locks the volunteer first and the shift second, so two transactions can never wait on each other in a circle (no deadlocks).
2. **Check the rules** in the same transaction: the shift exists and hasn't started, the volunteer isn't already on it, a spot is free, and it doesn't overlap another of their shifts.
3. **Insert the sign-up and commit**, which releases both locks.

Behind the duplicate check sits a database guarantee: `UNIQUE (user_id, shift_id)` on `signups` ([`server/prisma/schema.prisma`](server/prisma/schema.prisma)). If the check were ever bypassed, the insert fails with Prisma error P2002 and the API still answers `409 ALREADY_SIGNED_UP` ([`server/tests/signups.test.ts`](server/tests/signups.test.ts), "falls back on the unique constraint").

Cancelling, and an admin removing a volunteer, need no lock: deleting a sign-up can only free a spot, so it can't break a rule.

**Tested against real Postgres.** [`server/tests/signups-concurrency.test.ts`](server/tests/signups-concurrency.test.ts) fires simultaneous requests at the Neon `test` branch, through the same pooled connection the app uses:

| Race | Result |
|---|---|
| 10 volunteers, a capacity-3 shift | exactly 3 succeed, 7 get `SHIFT_FULL` |
| 2 volunteers, the last spot | exactly 1 succeeds |
| 1 volunteer double-clicks | exactly 1 sign-up |
| 1 volunteer, two overlapping shifts at once | exactly 1 succeeds |

To prove these tests can catch the race, they were run once with the two `FOR UPDATE` clauses removed. Three of the four failed, and all 10 volunteers got into the capacity-3 shift. The double-click test still passed, because the unique constraint caught the duplicate on its own.

**Alternatives.** SERIALIZABLE isolation would also be correct, but Postgres then aborts one of the racing transactions, and the API would need a retry loop. "Wait your turn" is simpler to reason about. At a larger scale, the overlap rule could move into the database as an exclusion constraint (`EXCLUDE USING gist (user_id WITH =, tstzrange(starts_at, ends_at) WITH &&)`, with the `btree_gist` extension). That needs the shift times copied onto every sign-up, which is more machinery than a volunteer board needs.

## Run it locally

You need Node 24 (`nvm use` reads `.nvmrc`) and a Neon project with `dev` and `test` branches.

1. Install dependencies:
   ```
   nvm use
   npm install
   npm --prefix server install
   npm --prefix client install
   ```
2. Copy `server/.env.example` to `server/.env` (Neon `dev` branch) and to `server/.env.test` (Neon `test` branch), then fill in the connection strings and your Firebase project id.
   Copy `client/.env.example` to `client/.env` and fill in the Firebase web app config (Firebase console → Project settings → Your apps) and the two demo passwords.
3. Prepare the databases:
   ```
   cd server
   npm run db:migrate        # apply migrations to dev and generate the Prisma client
   npm run db:migrate:test   # apply migrations to test
   npm run db:seed           # load the demo data into dev
   cd ..
   ```
4. Start both apps with `npm run dev`: the client runs on http://localhost:5173 and the API on http://localhost:4000.
5. Run every test with `npm test`. Server tests use the Neon `test` branch, never `dev`.

## Environment variables

**Server** (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection (host contains `-pooler`, `sslmode=verify-full`), used by the app |
| `DIRECT_URL` | Neon direct connection, used by Prisma migrations |
| `CLIENT_ORIGIN` | The client URL allowed to call the API (CORS) |
| `APP_TIMEZONE` | Time zone for "today", admin-entered times and display. Default `Asia/Manila` |
| `PORT` | API port. Default `4000`; Render sets its own |
| `FIREBASE_PROJECT_ID` | The Firebase project whose ID tokens the API accepts |

**Client** (`client/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL. Default http://localhost:4000 |
| `VITE_APP_TIMEZONE` | Display time zone; must match the server's `APP_TIMEZONE`. Default `Asia/Manila` |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` | Firebase web app config |
| `VITE_DEMO_VOLUNTEER_PASSWORD`, `VITE_DEMO_ADMIN_PASSWORD` | Passwords for the one-click demo logins |

Every `VITE_` variable is bundled into the browser code, so none of them may hold a secret.

## Deployment

- **Database (Neon):** the production branch is migrated and seeded from a laptop using a git-ignored `server/.env.production`:
  ```
  cd server
  ENV_FILE=.env.production npx prisma migrate deploy
  ENV_FILE=.env.production npm run db:seed
  ```
  Render also runs `prisma migrate deploy` on every build.
- **API (Render):** [`render.yaml`](render.yaml) defines the service as a Blueprint: free plan, Singapore, build and start commands, and the health check. In Render, choose **New → Blueprint** and pick this repo. It asks once for `DATABASE_URL` and `DIRECT_URL`.
- **Sign-in (Firebase):** a Firebase project with Email/Password sign-in enabled, the Vercel domain added under Authentication → Settings → Authorized domains, and the two demo users created by hand under Authentication → Users. The API needs no service account: it checks tokens against Google's public certificates.
- **Client (Vercel):** import the repo with Root Directory `client` (Vite preset), and set `VITE_API_URL` to the Render URL, `VITE_APP_TIMEZONE` to `Asia/Manila`, and the five Firebase and demo-login variables from `client/.env.example`. [`client/vercel.json`](client/vercel.json) serves `index.html` for every path, so deep links survive a reload.

Pushing to `main` redeploys both. Vercel preview deployments can't call the API, because CORS only allows the production client URL.

## API

Base URL: `https://lauritzkeans-volunteer-shift-board-api.onrender.com`. Every endpoint lives under `/api` and speaks JSON. Errors always have the same shape, and `details` appears only on validation errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some of the information sent is invalid.",
    "details": [{ "path": "when", "message": "Invalid option: expected one of \"next7\"|\"next30\"|\"all\"" }]
  }
}
```

Endpoints that need a user take a Firebase ID token as `Authorization: Bearer <token>`. Without a valid token they return `401 UNAUTHENTICATED`, and everything under `/api/admin` returns `403 FORBIDDEN` to anyone who isn't an admin. Roles come from the app database, never from the token.

Every event and shift carries a `status` computed on the server: `full` when no spots are left, `filling` when 75% or more are taken, otherwise `open`. Times are UTC instants; dates are `YYYY-MM-DD` in the app time zone (Asia/Manila).

### `GET /api/events`

Upcoming events (dated today or later) that have at least one shift, sorted by date, then by earliest shift. No sign-in needed.

| Parameter | Values | Default |
|---|---|---|
| `q` | Text matched in the title, location or description, ignoring case (up to 100 characters) | none |
| `cause` | `food`, `environment`, `education`, `community`, `seniors` or `animals` | every cause |
| `when` | `next7` or `next30` (today through 7 or 30 days ahead), or `all` | `all` |
| `openOnly` | `true` keeps only events with a shift that still has a spot | `false` |

```
curl "https://lauritzkeans-volunteer-shift-board-api.onrender.com/api/events?q=pantry"
```

```json
{
  "events": [
    {
      "id": "05b30ea8-0f23-4240-8e37-f19b545404af",
      "title": "Saturday Food Pantry Packing",
      "cause": "food",
      "date": "2026-10-17",
      "startsAt": "2026-10-17T01:00:00.000Z",
      "endsAt": "2026-10-17T05:00:00.000Z",
      "location": "Riverside Community Hall",
      "capacity": 20,
      "signedUpCount": 14,
      "spotsLeft": 6,
      "status": "open"
    }
  ],
  "total": 1
}
```

Returns `200`, or `400 VALIDATION_ERROR` for an unknown `cause` or `when`, or a `q` longer than 100 characters.

### `GET /api/events/:id`

One event with the same fields, plus its `description` and its `shifts` sorted by start time. No sign-in needed. Event ids change whenever the demo data is re-seeded, so take one from the list above:

```
curl "https://lauritzkeans-volunteer-shift-board-api.onrender.com/api/events/<id>"
```

```json
{
  "id": "05b30ea8-0f23-4240-8e37-f19b545404af",
  "title": "Saturday Food Pantry Packing",
  "…": "the list fields above",
  "description": "Help sort donated groceries and pack weekly boxes for local families. …",
  "shifts": [
    {
      "id": "54bd4e7f-018e-4983-8eb6-daf89fdfa447",
      "name": "Sort donations",
      "startsAt": "2026-10-17T01:00:00.000Z",
      "endsAt": "2026-10-17T02:30:00.000Z",
      "capacity": 8,
      "signedUpCount": 6,
      "spotsLeft": 2,
      "status": "filling"
    }
  ]
}
```

Returns `200`, or `404 NOT_FOUND` for an unknown or malformed id:

```
curl -i "https://lauritzkeans-volunteer-shift-board-api.onrender.com/api/events/not-a-real-id"
```

### `GET /api/me`

The signed-in user, as the app database knows them: `id`, `name`, `email`, `role` (`volunteer` or `admin`) and `initials`. On the first request, the API links the Firebase account to the user with the same email, or creates a new volunteer.

```
curl -i "https://lauritzkeans-volunteer-shift-board-api.onrender.com/api/me"
```

Returns `200`, or `401 UNAUTHENTICATED` without a valid token (as in this example).

## Accessibility (checked 2026-10-11)

Measured on the local app, signed in as each role where a screen needs it:

- **axe-core 4.13:** no violations on the events list, event detail (signed out and as a volunteer), My shifts and Admin, including the Add a shift form's error state and the New event dialog, at 1280px and 390px. Rerun it with `npm --prefix client run a11y` while `npm run dev` is running; it exits with an error on any serious or critical violation.
- **Lighthouse 13.5 accessibility score:** 100 on all four screens, with both the mobile and desktop presets.

## Free-tier notes (checked 2026-10-10)

- **Render free web service:** sleeps after 15 minutes idle and takes about a minute to wake; 750 instance hours a month.
- **Neon free:** 1 GB per project and 100 compute hours a month; scales to zero after 5 minutes idle.
- **Vercel Hobby:** for non-commercial, personal projects.

## Known issues

- `npm audit` in `server/` reports high-severity advisories in `deepmerge-ts` and `mysql2`, which the Prisma command-line tool pulls in. Neither touches untrusted input here: one merges Prisma's own config file, the other is a MySQL driver this project never loads. The only fix offered is a downgrade to Prisma 6.
- After signing out, a copied ID token keeps working until it expires (at most an hour). Checking for revoked tokens needs Firebase's Admin SDK and a service account on the API server, which this project deliberately avoids.
- `npm audit` in `client/` reports high-severity advisories in `@grpc/grpc-js`, pulled in by Firebase's Firestore package. The app imports only Firebase's `app` and `auth` modules, and the built bundle contains no gRPC code.
