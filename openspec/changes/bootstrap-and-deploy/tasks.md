# Tasks: Bootstrap and deploy

Each numbered group is one commit. The owner reviews it before the next group starts. Group 1 is setup only and produces no commit.

## 1. Owner setup

- [x] 1.1 (owner) Create an empty GitHub repository and add it as `origin`; verify `git remote -v` shows it
- [ ] 1.2 (owner) Create a Neon project in AWS Singapore (`ap-southeast-1`) with branches `dev` and `test`; once group 2 adds `server/.env.example`, paste the `dev` strings into `server/.env` and the `test` strings into `server/.env.test`; verify neither file appears in `git status`

## 2. Repo hygiene and server skeleton

- [x] 2.1 Add `.nvmrc` (24), which both nvm and Render read; the root `.gitignore` was created during planning. Verify `git status` lists neither `.DS_Store` nor `docs/design/`
- [x] 2.2 Initialise `server/` (ESM, TypeScript strict, `tsx` for dev, `vitest` + `supertest`) with scripts `dev`, `build`, `start`, `test`, and add `app.ts` and `server.ts`; verify `npm run build` compiles and `npm run dev` starts
- [x] 2.3 Add `config/env.ts` validating `DATABASE_URL`, `DIRECT_URL`, `CLIENT_ORIGIN`, `APP_TIMEZONE` (default `Asia/Manila`) and `PORT` with Zod, plus `server/.env.example`; verify with unit tests in `tests/env.test.ts` (defaults applied, missing variable named, unknown time zone rejected) and by hand that the server refuses to start with a clear message when a required variable is missing

## 3. Errors, validation and CORS

- [x] 3.1 Add `lib/errors.ts`, the `errorHandler` and `notFound` middleware, and `validate(schema)`; verify with Supertest that `GET /api/nope` returns the 404 `NOT_FOUND` envelope, a throwing route returns the 500 `INTERNAL_ERROR` envelope without a stack, and an invalid query returns `400 VALIDATION_ERROR` with `details`
- [x] 3.2 Add the CORS allowlist; verify with Supertest that the configured origin and `http://localhost:5173` get `Access-Control-Allow-Origin` and `https://evil.example` does not

## 4. Database schema

- [x] 4.1 Install Prisma 7.10.0 (CLI, client and `@prisma/adapter-pg`, exact pins), add `prisma.config.ts` and `schema.prisma` with the four models and two enums from design.md; verify `npx prisma validate` passes
- [x] 4.2 Create the first migration with `--create-only`, append the two CHECK constraints by hand, and apply it to `dev` and `test`; verify with a test that a shift ending before it starts, or with capacity 0, is rejected by the database
- [x] 4.3 Add `db/client.ts` (PrismaClient with the pg adapter on `DATABASE_URL`); verify the dev server connects to Neon `dev`

## 5. Health endpoint

- [x] 5.1 Add `GET /api/health` through route → controller → service → data (`SELECT 1`, 10 s timeout); verify with Supertest that it returns 200 `{"status":"ok"}` against the `test` branch and 503 `DATABASE_UNAVAILABLE` when the data function fails, and with a fake-timer unit test that `checkHealth` gives up after exactly 10 s when the data function hangs

## 6. Seed

- [x] 6.1 Add the pure `seedAnchorDate(seedDay)` helper; verify unit tests for 2026-10-10 → 2026-10-17 and 2026-10-14 → 2026-10-24
- [x] 6.2 Write `prisma/seed.ts` and its data file per the `demo-data` spec; verify a test against `test` checks the totals table, the Sort donations roster and its dates, and that no user holds overlapping sign-ups
- [x] 6.3 Make the seed re-runnable (delete events and `seeded` users, upsert demo accounts by email); verify two consecutive runs leave identical row counts

## 7. Client setup and tokens

- [ ] 7.1 Initialise `client/` (Vite React TypeScript, Tailwind v4, React Router, TanStack Query, `@fontsource/figtree`) with `client/.env.example`; verify `npm run build` succeeds
- [ ] 7.2 Add the tokens to `styles.css` under `@theme`, using the tokens.md names; verify on a scratch page that the base and status colors match the hex values
- [ ] 7.3 Add `lib/api.ts` (base URL, JSON, `ApiError` with `code` and `message`) and `lib/format.ts` (dates and times in `VITE_APP_TIMEZONE`); verify a unit test that formats a seeded instant as "Sat, Oct 17" and "9:00 AM" whatever the laptop's time zone

## 8. Layout and routes

- [ ] 8.1 Add Header (wordmark, nav with `aria-current`, compact "Shift Board" header with a menu button below 640px), Footer, page container and focus ring styles; verify by keyboard (tab order, focus ring, Escape closes the menu) and at 360px (no sideways scroll)
- [ ] 8.2 Add the routes `/`, `/events/:id`, `/my-shifts` and `/admin` as placeholders, plus the not-found page and the crash fallback; verify `/does-not-exist` shows "Page not found" and a deliberately throwing component shows "Something went wrong"

## 9. Waking-up notice

- [ ] 9.1 Add `useServerHealth` and the notice (3 s → "Waking up the server…", 90 s → "We couldn't reach the server." with "Try again") and gate data queries on health; verify with the server stopped (notice after 3 s), started mid-wait (clears without a reload) and left stopped (give-up message after 90 s, and "Try again" restarts the check)

## 10. Deploy and README

- [ ] 10.1 (owner) Create the Render web service in Singapore (root `server`, build and start commands and health-check path from design.md, environment variables) and check whether free instances offer pre-deploy commands; verify the deploy shows "Live" and `/api/health` returns 200
- [ ] 10.2 Seed production once from a laptop with `npm run db:seed`, temporarily pointing `DATABASE_URL` at the production branch; verify the event count with a quick query
- [ ] 10.3 (owner) Create the Vercel project (root `client`, `VITE_API_URL`, `VITE_APP_TIMEZONE=Asia/Manila`); add `vercel.json` rewrites; set Render's `CLIENT_ORIGIN` to the Vercel URL; verify the live site loads, reloading `/my-shifts` doesn't 404, and the console shows no CORS errors
- [ ] 10.4 Verify the cold start on the live URLs: after 15+ minutes idle, the site shows the waking-up notice, which clears on its own
- [ ] 10.5 Start the README with setup steps, environment variables and live URLs; verify a fresh clone can follow it to run both apps locally

## Workflow follow-up

- Owner reviews the live deploy, then archive with `/opsx:archive bootstrap-and-deploy`.
