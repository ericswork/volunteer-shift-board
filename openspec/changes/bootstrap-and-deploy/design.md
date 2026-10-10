# Design: Bootstrap and deploy

## Context

The repo is empty apart from `docs/`. The motivation is in proposal.md. Free-tier terms were checked on 2026-10-10:

- Render free web service: sleeps after 15 minutes idle and takes about a minute to wake. 750 instance hours, 5 GB bandwidth and 500 build minutes per month.
- Neon free: 1 GB storage, 100 compute-hours per month, scales to zero after 5 minutes. Its connection pooler (PgBouncer) runs in transaction mode.
- Vercel Hobby: limited to non-commercial personal use, which a portfolio piece fits.

Library versions on npm that day: Express 5.3, Zod 4.6, React 19.3, Vite 8.3, Tailwind 4.3, TanStack Query 5, Prisma 7.10.

## Goals / Non-Goals

**Goals:**
- A deployed, working pipeline (Vercel → Render → Neon) before any feature work.
- The whole data model in one migration, so later changes only add code.
- A code layout simple enough for the owner to explain each folder's job in one sentence.

**Non-Goals:**
- Authentication (see `auth-and-roles`). This change has no protected routes.
- Any feature UI beyond the page frame and placeholder pages.
- Frontend component tests. Server tests cover behavior, and the UI is checked by hand against the specs. Only pure client helpers (date formatting) get unit tests.

## Decisions

### 1. Two independent projects, `/client` and `/server`
Each folder has its own `package.json`, and there is no shared package.
- **Why:** Vercel builds `/client` and Render builds `/server`, each from its own root, with no extra tooling.
- **One command for local development:** a root `package.json` holds only `concurrently`, so `npm run dev` starts both apps and `npm test` runs both suites. It isn't a workspace, so each app still installs and deploys from its own folder.
- **Alternative rejected:** Turborepo. It needs npm workspaces, which would move Render's and Vercel's builds to the repo root, and its caching and task ordering pay off only with shared packages.
- **Alternative rejected:** npm workspaces with a `shared/` package for Zod schemas. Only two forms share rules, and a workspace adds build-order and deploy configuration on both hosts. The client copies small form schemas for instant feedback; the server's schemas are the authority.

### 2. Server layers and their single responsibility
```
server/src/
  server.ts         starts the HTTP listener
  app.ts            builds the Express app (tests import this, no port needed)
  config/env.ts     reads and validates env vars with Zod; refuses to start if any are missing
  routes/           URL + middleware chain → controller. No logic.
  controllers/      read the validated request, call one service, shape the HTTP response
  services/         business rules and transactions. Know nothing about req/res.
  data/             every Prisma query lives here, and nowhere else
  middleware/       validate(schema), errorHandler, notFound (auth added later)
  lib/errors.ts     AppError(status, code, message) plus helpers: notFound(), conflict()
  lib/time.ts       "today" and date/time conversions in APP_TIMEZONE
```
Data functions take an optional `db` argument (the Prisma client or a transaction). A service can then run several of them inside one transaction, which `shift-signups` needs.
- **Alternative rejected:** handlers that query the database directly. It's faster to write, but business rules can't be tested without HTTP, and the brief asks for layers.

### 3. Prisma ORM 7 on Neon
- `server/prisma/schema.prisma` defines the models. `server/prisma.config.ts` points the Prisma CLI (migrations, seed) at `DIRECT_URL`.
- At runtime the app connects through the pooled `DATABASE_URL` using `@prisma/adapter-pg`. Prisma 7 requires a driver adapter.
- Pin `prisma`, `@prisma/client` and `@prisma/adapter-pg` to the same exact version (7.10.0). On 2026-10-10, npm's `latest` tag for the `prisma` CLI pointed at a release candidate (8.0.0-rc.22), so a plain `npm install prisma` would mismatch the client.
- Prisma 7 no longer generates the client or seeds automatically, so the build runs `prisma generate` and seeding is a deliberate command.
- **Why Prisma:** the schema file reads like the data model itself, migrations are generated, and the owner already knows it.
- **Alternative rejected:** Drizzle, which the owner doesn't know.
- **Cost:** the schema language can't express CHECK constraints, and the query API can't express row locks. Both are hand-written SQL: CHECK constraints go in the migration, and the lock in `shift-signups` uses `$queryRaw`. That keeps the two most important integrity mechanisms as literal, visible SQL.

### 4. Data model (the complete schema, created in this change)

| Table | Column | Type | Notes |
|---|---|---|---|
| **users** | id | uuid PK | default `gen_random_uuid()` |
| | firebase_uid | text, unique, nullable | set on first sign-in. Null for fictional seed volunteers, who never log in |
| | email | text, unique | stored lowercase |
| | name | text | |
| | role | enum `user_role` (`volunteer`, `admin`) | default `volunteer` |
| | seeded | boolean | `true` only for fictional volunteers, so a re-seed can delete them safely |
| | created_at | timestamptz | default `now()` |
| **events** | id | uuid PK | |
| | title, location, description | text | |
| | cause | enum `cause` (`food`, `environment`, `education`, `community`, `seniors`, `animals`) | |
| | date | date | calendar date in the app time zone. Indexed |
| | created_at | timestamptz | |
| **shifts** | id | uuid PK | |
| | event_id | uuid FK → events, `ON DELETE CASCADE` | indexed with `starts_at` |
| | name | text | |
| | starts_at, ends_at | timestamptz | `CHECK (ends_at > starts_at)` |
| | capacity | integer | `CHECK (capacity > 0)` |
| | created_at | timestamptz | |
| **signups** | id | uuid PK | |
| | shift_id | uuid FK → shifts, `ON DELETE CASCADE` | indexed |
| | user_id | uuid FK → users, `ON DELETE CASCADE` | |
| | created_at | timestamptz | shown as "Signed up Oct 3" |
| | | | `UNIQUE (user_id, shift_id)`: the database itself refuses duplicate sign-ups |

Design choices in the schema:
- **Derived, not stored:** an event's start and end times, capacity, sign-up count, spots left and status are all computed from its shifts and sign-ups.
  - **Why:** a stored copy can drift out of sync, and every write path would have to update it.
  - **Alternative rejected:** a `signed_up_count` column on shifts. Counting a few dozen rows is instant at this scale.
- **Events keep their own `date`:** an admin creates an event before adding its shifts, and the add-shift form only asks for times.
- **Cancelling deletes the sign-up row:** the unique constraint then allows signing up again later.
  - **Alternative rejected:** a soft-delete `cancelled_at` column. It needs a partial unique index, and nothing in the brief needs a cancellation history.
- **uuid ids:** event and sign-up URLs can't be guessed or counted.
- **Cause as an enum:** the list is fixed.
  - **Alternative rejected:** a causes table, which would need an admin screen no one asked for.

### 5. One app time zone
- `APP_TIMEZONE` (server) and `VITE_APP_TIMEZONE` (client) name a single IANA zone: `Asia/Manila` (UTC+8, no daylight saving).
- The database stores instants in UTC. The zone is used to:
  - decide what "today" is,
  - turn an admin's "10:30" on the event's date into an instant,
  - display every date and time.
- **Alternative rejected:** each viewer's browser time zone. These are in-person events, and a reviewer in another zone would see a 9 AM shift as 6 AM.

### 6. Health check and cold-start handling
- `GET /api/health` runs `SELECT 1` with a 10-second timeout. Because it touches the database, it also wakes Neon.
- Render's health-check path is set to it.
- On the client, a `useServerHealth` hook (TanStack Query) polls health on app load:
  - every 3 s, for up to 90 s,
  - a non-JSON or non-200 response counts as "not ready", because Render's proxy may answer with an HTML page while it spins up,
  - a 3-second timer decides when to show the notice.
- Data queries are disabled until health succeeds, so they don't each time out separately during a cold start. On a warm server that costs one extra fast round trip.
- **Alternative rejected:** firing all queries at once with long timeouts. Failures scatter across every component and the notice is harder to get right.

### 7. Styling and fonts
- Tailwind v4 tokens live in `client/src/styles.css` under `@theme`, with the same names as tokens.md (`bg`, `surface`, `primary`, `primary-ink`, `status-filling-bg`, …). Classes then read like the design file, for example `bg-surface text-primary-ink`.
- Figtree is self-hosted via `@fontsource-variable/figtree`: one variable-weight file covers 400–700. That's one less third-party request and no layout shift.
- shadcn/ui gets initialised when the first change needs a Dialog, Tabs or toast, not now.

### 8. Hosting setup
- **Region:** Singapore for both Render and Neon (AWS `ap-southeast-1`). It's the closest region to Manila for both providers, and keeping the API and database in the same region keeps every query a short hop.
- **Neon:** one project with three branches:
  - `main` for production,
  - `dev` for local development,
  - `test` for automated tests.
- **Render:** a Web Service with root directory `server`.
  - Defined as code in `render.yaml` (a Render Blueprint). Build command: `npm ci --include=dev && npx prisma migrate deploy && npm run build`; `npm run build` runs `prisma generate` itself.
  - Start command: `npm start` (`node dist/server.js`).
  - Health check path: `/api/health`. Node 24 LTS, set explicitly by `NODE_VERSION` in `render.yaml`, because Render's docs don't say whether `.nvmrc` is read when a service has its own root directory.
  - Migrations run during the build because Render's pre-deploy command isn't offered on free instances. Confirm this during setup.
- **Vercel:** root directory `client`, Vite preset. `vercel.json` rewrites every path to `/index.html` so client-side routes survive a reload.
- **Cross-origin calls:** the browser calls Render directly (`VITE_API_URL`), and the server allowlists `CLIENT_ORIGIN`. Auth will use a Bearer header, not cookies, so CORS doesn't need credentials.

### 9. Testing approach
- Server tests use Vitest and Supertest against `app.ts`.
- Tests that touch the database run against the Neon `test` branch (`TEST_DATABASE_URL`). It is reset by migrating and truncating before each run.
- A real Postgres is required because the race-condition tests in `shift-signups` can't be faked.
- Pure functions (seed dates, time helpers) get plain unit tests.

## Risks / Trade-offs

- [Cold start: Render (~1 min) plus Neon (~1 s)] → Waking-up notice, gated queries, and an honest message after 90 s.
- [Render's proxy returns HTML while spinning up] → The health hook treats anything but a JSON 200 as "not ready".
- [Prisma's `latest` tag points at an RC] → Exact version pins, all three Prisma packages on the same version.
- [Prisma 7 rejects Neon's TLS certificate (error P1010)] → Use `sslmode=require` in the URLs. If it still fails, set the adapter's `ssl` option, as Prisma's upgrade guide describes.
- [The pooled URL can't run migrations] → The CLI always uses `DIRECT_URL`. The app uses the pooled URL.
- [Free-tier terms change] → Re-checked 2026-10-10. The README notes the date.
- [Secrets leak] → `.env` is git-ignored, and `.env.example` lists every variable with placeholder values.

## Migration Plan

1. The owner creates the GitHub repo and pushes `main`. They also create the Neon project and its `dev` and `test` branches.
2. Run `prisma migrate dev` locally against `dev`, then seed `dev`.
3. Create the Render service pointing at `main` (it migrates `main` during the build), then migrate and seed production once from a laptop with `ENV_FILE=.env.production` (a git-ignored file holding the production connection strings).
4. Create the Vercel project with `VITE_API_URL` set to the Render URL. Set Render's `CLIENT_ORIGIN` to the Vercel URL.
5. **Rollback:** Render and Vercel can each redeploy a previous build in one click. The database can always be rebuilt with migrate and seed, since it only holds demo data.
