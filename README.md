# Volunteer Shift Board

Volunteers browse upcoming events and sign up for shifts. Admins create events and shifts and see who's coming. A full-stack portfolio project, built in two days with spec-driven development.

- **Live demo:** https://lauritzkeans-volunteer-shift-board.vercel.app
- **API health:** https://lauritzkeans-volunteer-shift-board-api.onrender.com/api/health

> The API runs on Render's free tier, which sleeps after 15 minutes without traffic. The first visit after a quiet spell shows a "Waking up the server…" notice for up to a minute.

## Status

Built one [OpenSpec](https://github.com/Fission-AI/OpenSpec) change at a time; the specs live in [`openspec/changes/`](openspec/changes/).

- Done: project setup, database schema, demo data, page layout, cold-start handling, deployment
- Next: browsing events, sign-in with demo logins, shift sign-ups, the admin dashboard

## Tech stack

| Layer | Choice |
|---|---|
| Client | React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, React Router |
| API | Express 5, TypeScript, Zod, in layers: routes → controllers → services → data |
| Database | PostgreSQL on Neon, Prisma ORM 7 |
| Hosting | Vercel (client), Render (API), Neon (database), all on free tiers |
| Tests | Vitest and Supertest |

## Repository layout

```
client/     React app (Vite)
server/     Express API, Prisma schema, migrations and seed
openspec/   Specs and change proposals
```

## Run it locally

You need Node 24 (`nvm use` reads `.nvmrc`) and a Neon project with `dev` and `test` branches.

1. Install dependencies:
   ```
   nvm use
   npm install
   npm --prefix server install
   npm --prefix client install
   ```
2. Copy `server/.env.example` to `server/.env` (Neon `dev` branch) and to `server/.env.test` (Neon `test` branch), then fill in the connection strings.
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

The client needs no `.env` locally: it defaults to http://localhost:4000 and Asia/Manila.

## Environment variables

**Server** (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection (host contains `-pooler`, `sslmode=verify-full`), used by the app |
| `DIRECT_URL` | Neon direct connection, used by Prisma migrations |
| `CLIENT_ORIGIN` | The client URL allowed to call the API (CORS) |
| `APP_TIMEZONE` | Time zone for "today", admin-entered times and display. Default `Asia/Manila` |
| `PORT` | API port. Default `4000`; Render sets its own |

**Client** (`client/.env`, optional locally)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL |
| `VITE_APP_TIMEZONE` | Display time zone; must match the server's `APP_TIMEZONE` |

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
- **Client (Vercel):** import the repo with Root Directory `client` (Vite preset), and set `VITE_API_URL` to the Render URL and `VITE_APP_TIMEZONE` to `Asia/Manila`. [`client/vercel.json`](client/vercel.json) serves `index.html` for every path, so deep links survive a reload.

Pushing to `main` redeploys both. Vercel preview deployments can't call the API, because CORS only allows the production client URL.

## Free-tier notes (checked 2026-10-10)

- **Render free web service:** sleeps after 15 minutes idle and takes about a minute to wake; 750 instance hours a month.
- **Neon free:** 1 GB per project and 100 compute hours a month; scales to zero after 5 minutes idle.
- **Vercel Hobby:** for non-commercial, personal projects.

## Known issues

- `npm audit` in `server/` reports high-severity advisories in `deepmerge-ts` and `mysql2`, which the Prisma command-line tool pulls in. Neither touches untrusted input here: one merges Prisma's own config file, the other is a MySQL driver this project never loads. The only fix offered is a downgrade to Prisma 6.
