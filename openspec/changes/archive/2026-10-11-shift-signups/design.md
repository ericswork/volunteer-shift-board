# Design: Shift sign-ups

## Context

The `signups` table already has `UNIQUE (user_id, shift_id)`, and every shift has a CHECK-constrained capacity (`bootstrap-and-deploy`). `requireAuth` exists (`auth-and-roles`). Postgres runs at its default isolation level, READ COMMITTED. The app connects through Neon's PgBouncer in transaction mode, which holds one server connection for the whole of a transaction.

The difficulty: "check, then insert" is a race. If two requests both read "7 of 8 taken" before either inserts, both insert and the shift ends up at 9 of 8.

## Goals / Non-Goals

**Goals:**
- Capacity, duplicate and overlap rules that hold under concurrent requests, proven by tests against real Postgres.
- A mechanism the owner can explain in two sentences.

**Non-Goals:**
- Waitlists, or admin overrides of capacity.
- Real-time push updates. Other viewers see new counts on their next fetch or refocus.

## Decisions

### 1. One transaction with two row locks, plus a unique constraint

The service runs this sequence inside a single `prisma.$transaction`:

```sql
SELECT id FROM users  WHERE id = $user  FOR UPDATE;   -- 1. queue this user's sign-ups
SELECT id, capacity, starts_at, ends_at
  FROM shifts WHERE id = $shift FOR UPDATE;           -- 2. queue this shift's sign-ups
-- 3. rule checks (each in the same transaction):
--    shift exists?                 else 404 NOT_FOUND
--    starts_at > $now (app clock)? else 409 SHIFT_STARTED
--    no sign-up (user, shift)?     else 409 ALREADY_SIGNED_UP
--    count(sign-ups) < capacity?   else 409 SHIFT_FULL
--    no held shift with starts_at < $end AND ends_at > $start?  else 409 SHIFT_OVERLAP
INSERT INTO signups (user_id, shift_id) ...;          -- 4. claim the spot
COMMIT;                                               -- locks released
```

**The two-sentence version.** `FOR UPDATE` makes every other transaction that wants the same row wait until this one commits. Under READ COMMITTED, each statement it runs after the wait sees the newly committed sign-up, so the second request in a race counts correctly and is refused.

**Why each piece is there:**

| Rule | Guarded by | Why this mechanism |
|---|---|---|
| Capacity | lock on the **shift** row | "count ≤ capacity" spans many rows. A plain constraint can't express it without a stored counter |
| Overlap | lock on the **user** row | Two overlapping shifts are *different* rows. Without the user lock, both requests would pass the overlap check at the same moment |
| Duplicate | `UNIQUE (user_id, shift_id)` | A single-row fact the database can guarantee absolutely. The service check gives a friendly error, and the constraint is the backstop: Prisma error P2002 maps to `ALREADY_SIGNED_UP` |

- **No deadlocks:** every code path locks in the same order, user first, then shift. Transactions queue but never wait on each other in a circle.
- **Check order:** duplicate comes before full, so a volunteer already holding a full shift hears "You're already signed up", not "Shift full". Overlap uses a half-open range test (`start < otherEnd AND end > otherStart`), so back-to-back shifts pass.
- **Raw SQL only for the locks:** the two `SELECT … FOR UPDATE` statements go through `tx.$queryRaw`, because Prisma's query builder has no row-lock option. The checks and the insert use normal Prisma calls on the same `tx`.
- **Timeout:** the transaction timeout is raised from Prisma's default 5 s to 10 s, to survive a Neon wake-up.

**Alternatives considered:**

| Option | Why not |
|---|---|
| SERIALIZABLE isolation and retrying on error 40001 | Correct, but it needs a retry loop, and "the database aborted one of you, try again" is harder to explain than "wait your turn" |
| `signed_up_count` column with `UPDATE … SET count = count + 1 WHERE count < capacity` | Atomic and elegant for capacity, but it duplicates data every cancel and remove must keep in sync, and it does nothing for overlaps |
| Exclusion constraint (`btree_gist`, `EXCLUDE USING gist (user_id WITH =, tstzrange(starts_at, ends_at) WITH &&)`) | Overlap guaranteed by the database itself, but it means copying shift times into `signups` and adding an extension. Noted in the README as the at-scale option |
| Advisory locks | Session-level ones break under Neon's transaction-mode pooler. Transaction-level ones work but are less self-explanatory than locking the actual rows |

### 2. Cancellation needs no lock
- `DELETE FROM signups WHERE id = $id AND user_id = $me`, after checking that `starts_at` is more than 24 hours after the app clock's `now()`.
- Removing a row can only free capacity, so racing a sign-up against a cancellation can't break any rule.
- A non-matching `user_id` returns 404 rather than 403, so sign-up ids can't be probed.

### 3. Viewer state is computed on the server
- `GET /api/events/:id` uses the user that `authenticate` (from `auth-and-roles`) already attaches to every request with a valid token. A missing or invalid token leaves the request anonymous, so no separate optional-auth middleware is needed.
- With a user, the service loads that user's sign-ups that overlap the event's day, then labels each shift in order: `signed_up` → `started` → `full` → `overlap` → `open`.
- `canCancel` is computed with the same 24-hour helper the cancel endpoint uses.
- **Alternative rejected:** computing state in the browser from `/api/me/signups`. It's a second source of truth for the rules, and an extra request.

### 4. Testable authentication
- `createApp({ clientOrigin, verifyToken })` takes the token verifier as a parameter (built in `auth-and-roles`).
- Production passes the `jose`-based Firebase token verifier.
- Tests pass the shared fake from `tests/helpers.ts`, which accepts `test-token:<uid>:<email>[:<name>]`, so the concurrency tests can act as many volunteers without Firebase.

### 5. Concurrency tests against the Neon `test` branch
- Each test fires requests with `Promise.all` through Supertest on `app.ts`. The Prisma pool size (10) is at least the burst size, so the requests really are concurrent.
- Assertions:
  - burst of 10 at capacity 3 → exactly 3 × 201 and 7 × 409, and the count in the database is 3,
  - two volunteers racing for the last spot → exactly one wins,
  - double click → exactly one sign-up,
  - simultaneous overlapping requests → exactly one wins.
- A deliberately "unsafe" variant (the locks removed) run once by hand should fail the burst test. That proves the test can detect the race; this is worth mentioning in the README.

### 6. Client mutations
- TanStack Query `useMutation` for sign-up and cancel.
- On success, invalidate `['event', id]`, `['events']` and `['my-signups']`.
- On a 409, show the server's `message` in a toast and invalidate the same keys, so the row shows the true state.
- Buttons are disabled while their mutation is pending, which is the first defense against double clicks. The server lock is the real one.
- shadcn/ui is initialised here, but only `Dialog` (cancel confirmation), `Tabs` (My shifts) and `Sonner` (toasts) are added, all re-themed with the tokens.

## Risks / Trade-offs

- [Interactive transactions through Neon's pooler] → Transaction mode keeps one server connection from BEGIN to COMMIT, which is exactly what row locks need. The concurrency tests run through the pooled URL, so they prove it on the real infrastructure.
- [A hot shift serializes its sign-ups] → Each lock is held for a few milliseconds. A food-bank volunteer board will never see contention that matters.
- [Clock skew between server and database] → All "now" comparisons use the app clock (`lib/clock.ts`), not the database's `now()`, so the rules and the tests share one clock.
- [The 24-hour rule might be dropped later] → It is one helper (`canCancel(startsAt, now)`) used by the endpoint and the viewer state. Removing it is a two-line change plus spec edits.

## Migration Plan

No schema change. Deploy by pushing to `main`. Run the concurrency tests against `test` before pushing.
