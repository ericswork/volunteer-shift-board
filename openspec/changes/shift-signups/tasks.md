# Tasks: Shift sign-ups

Each numbered group is one commit. The owner reviews it before the next group starts.

## 1. Sign-up endpoint (server)

- [x] 1.1 Add the `canCancel(startsAt, now)` helper (more than 24 hours to go); verify unit tests: 25 hours ahead → true, exactly 24 hours → false, 23 hours → false
- [x] 1.2 Add the sign-up data functions (the two `SELECT … FOR UPDATE` locks through `tx.$queryRaw`, user first, then shift), `services/signups.signUp` (one transaction, 10 s timeout, checks in the design's order, Prisma `P2002` mapped to `ALREADY_SIGNED_UP`) and `POST /api/shifts/:id/signup` behind `requireAuth` (unknown or malformed id → 404); verify integration tests on the `test` branch with the clock pinned and a fresh seed: Sort donations 6/8 → `201` and 7 of 8 `filling`; anonymous → `401` and no row; Load delivery vans → `409 SHIFT_FULL`; Pack boxes holder signing up for Sort donations (back-to-back) → `201`; Morning walkers holder signing up for Kennel helpers → `409 SHIFT_OVERLAP`; a started shift → `409 SHIFT_STARTED`; a second identical sign-up → `409 ALREADY_SIGNED_UP`

## 2. Concurrency tests

- [x] 2.1 Add the parallel tests with `Promise.all` through Supertest: 10 volunteers on an empty capacity-3 shift → exactly three `201`, seven `409 SHIFT_FULL` and three rows; two volunteers racing for the last spot → exactly one wins; a double click → one `201`, one `409 ALREADY_SIGNED_UP`, one row; simultaneous Morning walkers and Kennel helpers for one volunteer → exactly one wins; verify they pass against the `test` branch through the pooled URL, and that the burst test fails when the two locks are commented out by hand (an experiment, not committed)

## 3. Cancel endpoint (server)

- [x] 3.1 Add `DELETE /api/signups/:id` (own sign-ups only, otherwise `404`; `409 CANCELLATION_CLOSED` inside 24 hours; `204` on success); verify integration tests: Demo Volunteer cancels Pack boxes three days ahead → `204` and one more spot; another user's sign-up → `404` and the row remains; 25 hours ahead → `204`; 23 hours ahead → `409` and the row remains; `not-a-real-id` → `404`

## 4. Viewer state and my sign-ups (server)

- [ ] 4.1 Add the `viewer` object (`state`, plus `signupId` and `canCancel` when signed up) to each shift in `GET /api/events/:id` for signed-in requests, using the user that `authenticate` already attaches; verify tests: Food Pantry for Demo Volunteer → Sort donations `open`, Pack boxes `signed_up` with `canCancel: true`, Load delivery vans `full`; Shelter Dog Walking → Kennel helpers `overlap`; a started shift → `started`; anonymous → no `viewer` field
- [ ] 4.2 Add `GET /api/me/signups?when=upcoming|past` (Zod, default `upcoming`, behind `requireAuth`); verify tests: upcoming → Pack boxes, Tech help desk, Morning walkers; past → Sort and fold coats, then Set up tables; `when=bogus` → `400 VALIDATION_ERROR`; anonymous → `401`

## 5. shadcn/ui setup (client)

- [ ] 5.1 Initialise shadcn/ui and add only `Dialog`, `Tabs` and `Sonner`, themed with the tokens.md colors; verify the typecheck and build pass, and on a scratch page (not committed) that the dialog traps focus and returns it on close, the tabs move with the arrow keys, and a toast appears

## 6. Shift row actions (client)

- [ ] 6.1 Add the viewer types, the row action for each state (Sign up, You're signed up + Cancel sign-up, Shift full, Overlaps your shift, Sign-ups closed), the sign-up mutation (invalidating `['event', id]`, `['events']` and `['my-signups']`; on `409`, a toast with the server's message plus the same invalidation), "Sign up" for visitors going to `/login?next=<event page>`, and the overlap note; verify in the browser as Demo Volunteer that the Food Pantry rows match PDF page 2 and Kennel helpers shows "Overlaps your shift", that signing up for Sort donations shows a toast and "1 of 8 spots left", that a shift filled through the API just before clicking shows "This shift just filled up." and turns into "Shift full", and that a visitor returns to the event page without being signed up
- [ ] 6.2 Add the cancel confirmation dialog ("Cancel your <shift> shift on <date>?", "Yes, cancel", "Keep my spot"), the "Cancellation closed" text when `canCancel` is false, and the confirmation banner (`role="status"`) with "View my shifts"; verify in the browser that the banner reads "You're signed up for Pack boxes, 10:30 AM – 12:00 PM.", that "Keep my spot" closes the dialog with focus back on "Cancel sign-up" and cancels nothing, and that "Yes, cancel" shows a toast, removes the banner and updates the counts

## 7. My shifts page (client)

- [ ] 7.1 Build `/my-shifts`: the 30px heading, the summary line ("1 upcoming shift." for one), the Upcoming / Past tabs, the shift cards (date block, shift name, event link, time and location with icons), the empty states and the cancellation note, in a single column no wider than 640px; verify in the browser against PDF page 4 at 390px (no sideways scroll, buttons at least 44px tall), that the right arrow key moves from Upcoming to Past, and that a new volunteer sees "0 upcoming shifts…" with a "Browse events" link
- [ ] 7.2 Add "Cancel sign-up" on upcoming cards with the shared dialog, and "Cancellation closed (less than 24 hours to go)" when `canCancel` is false; verify in the browser that cancelling Tech help desk removes its card, changes the summary to "2 upcoming shifts…" and shows a toast

## 8. Deploy and verify

- [ ] 8.1 Run both test suites (including the concurrency tests) against the `test` branch, then push to `main` and verify on the live URLs as Demo Volunteer: My shifts lists the three seeded shifts, signing up for and cancelling Sort donations works with toasts, and "Load delivery vans" stays "Shift full"; then re-seed production so the demo data starts clean
- [ ] 8.2 Add a "How sign-ups stay correct" section to the README (the two row locks, the unique constraint, the commented-out-locks experiment, and the exclusion constraint as the at-scale option); verify each claim points to a test or file that exists

## Workflow follow-up

- Owner reviews the code and the live deploy, then archive with `/opsx:archive shift-signups`.
