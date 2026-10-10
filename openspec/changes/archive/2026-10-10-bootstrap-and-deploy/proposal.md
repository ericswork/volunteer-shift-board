# Proposal: Bootstrap and deploy

## Why

The riskiest part of a two-day build is getting three free-tier platforms (Vercel, Render and Neon) talking to each other: environment variables, CORS, migrations and cold starts. Doing that first, with the full data model and demo data in place, means every later change ships into a working pipeline and reviewers can see a live app from Day 1.

## What Changes

- Create `/client` (React + Vite + TypeScript) with the shared page frame (header, navigation, footer), the design tokens from `docs/design/tokens.md`, routing with placeholder pages, and an app-wide error fallback.
- Create `/server` (Express + TypeScript) with the layered structure, environment validation, a uniform JSON error format, request validation and a CORS allowlist.
- Add the complete database schema (users, events, shifts, signups) with its integrity constraints in a single first migration, so no later change needs a data-model migration.
- Add a re-runnable seed that loads the tokens.md demo data with dates relative to the day it runs, two past events and the two demo accounts.
- Add a health endpoint and a friendly "Waking up the server" notice for Render's free-tier cold start.
- Deploy: client on Vercel, API on Render, database on Neon.

## Capabilities

### New Capabilities
- `app-shell`: the page frame every screen shares (header, navigation, footer, layout, design tokens, accessibility baseline, not-found and crash fallbacks).
- `api-conventions`: rules every API endpoint follows (URL prefix, JSON error envelope, request validation, cross-origin policy, date formats).
- `service-availability`: the health endpoint and how the client tells visitors that the sleeping free-tier server is waking up.
- `demo-data`: the seeded events, shifts, sign-ups and demo accounts reviewers see, and how they stay in the future.

### Modified Capabilities
- None (first change).

## Impact

- New code: `client/`, `server/` (including `server/prisma/` for schema, migrations and seed), root `.gitignore` and README skeleton.
- New external services (owner creates the accounts): a GitHub repository, a Neon project, a Render web service and a Vercel project.
- Environment variables: server `DATABASE_URL`, `DIRECT_URL`, `CLIENT_ORIGIN`, `APP_TIMEZONE`, `PORT`; client `VITE_API_URL`, `VITE_APP_TIMEZONE`.
