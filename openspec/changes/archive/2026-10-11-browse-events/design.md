# Design: Browse events

## Context

This builds on `bootstrap-and-deploy`: the schema, the server layers, the API client, the format helpers and the layout already exist. The requirements are in `specs/event-catalog/spec.md`. With six to eight events, query performance doesn't matter yet; readability does.

## Goals / Non-Goals

**Goals:**
- One place on the server that decides status, so the list, detail and admin pages can never disagree. That disagreement is exactly the bug in the PDF mockups.
- Filter state that survives reloads and can be shared as a link.

**Non-Goals:**
- Viewer-specific shift state (signed up, overlap) and sign-up buttons. They arrive with `shift-signups`, which extends the detail response.
- Pagination and sorting options.

## Decisions

### 1. Status is computed on the server, in one pure function
- `services/availability.ts` exports `availability(capacity, signedUp) → { spotsLeft, status }`. The status rule is `full` at 0 left, `filling` at ≥ 0.75 booked, otherwise `open`.
- The event and shift services both call it. The client only maps `status` to a label and colors.
- **Alternative rejected:** computing status in the client. Then the admin page and API consumers would need their own copy of the rule.
- **Alternative rejected:** computing it in SQL. That's harder to unit-test and to explain.

### 2. Prisma query, then aggregate in the service
- The data function runs a single `findMany`:
  - `where`: date window, optional cause, optional `q` (`OR` over title, location and description, using `contains` with `mode: 'insensitive'`), and `shifts: { some: {} }`.
  - `include`: each shift with `_count.signups`.
- The service sums the shifts, applies `openOnly`, and sorts by date, then earliest shift start.
- **Alternative rejected:** raw SQL with `GROUP BY` and `HAVING`, which would filter in the database. It's faster at scale but much harder to read.
- **Trade-off, stated in the README:** in-memory `openOnly` filtering stops being reasonable at thousands of events. At that point it moves into SQL, together with pagination.

### 3. Time comes from one place
- `lib/clock.ts` exports `now()`. `lib/time.ts` turns it into "today" (`YYYY-MM-DD` in `APP_TIMEZONE`) and the `next7` / `next30` end dates.
- Because `events.date` is a plain `date` column, the window is a simple string comparison with no time-zone math in SQL.
- Tests pin the clock to 2026-10-10 so the spec scenarios are deterministic regardless of the day they run.

### 4. Query validation with Zod
- `q`: trimmed, max 100 characters; empty becomes undefined.
- `cause`: enum.
- `when`: enum, default `all`.
- `openOnly`: the strings `"true"` / `"false"` converted to a boolean.
- A malformed `:id` (not a uuid) is answered with 404, not 400. To a visitor, a mangled link is the same as a missing event, and it avoids a database error on an invalid uuid.

### 5. URL search params are the filter state
- `useSearchParams` holds `q`, `cause`, `when` and `open`. Only values that differ from the defaults are written, so `/` stays clean.
- The search box keeps local state and writes to the URL after a 300 ms debounce.
- TanStack Query is keyed on `['events', filters]` with `placeholderData: keepPreviousData`. Changing a filter keeps the old cards visible until new ones arrive, with no skeleton flash. Skeletons appear only on the first load.
- **Alternative rejected:** React state or a global store. Reload, Back and shared links would lose the filters.

### 6. Presentation helpers on the client
- `spotsLabel` turns counts into "6 of 20 spots left" or "Full · 16 of 16 taken".
- `formatTimeRange` applies the shared-AM/PM rule, and `formatDate` prints "Sat, Oct 17". All use `Intl.DateTimeFormat` with `timeZone: VITE_APP_TIMEZONE`.
- Cause labels and the cause dropdown options are a small client constant mirroring the server enum. Duplicating it was accepted in `bootstrap-and-deploy` decision 1.

### 7. Components
- `StatusPill`, `SpotsBar`, `CauseChip`, `EventCard`, `EventCardSkeleton`, `FilterCard`, `EmptyState`, `ErrorState`, `ShiftRow` and `EventSidePanels`.
- `ShiftRow` has an action slot. In this change only full shifts fill it (disabled "Shift full"). `shift-signups` fills the rest.
- The side panel copy is static JSX. A per-event "Good to know" field isn't in the brief.

### 8. Testing
- Unit tests:
  - `availability()`: the five spec examples, plus boundaries at 74% and 75%.
  - The client helpers `formatTimeRange` and `spotsLabel`. These pure functions are the only client tests in the project.
- Integration tests (Supertest, Neon `test` branch, clock pinned, fresh seed): each filter scenario, the detail ordering, and 404s.

## Risks / Trade-offs

- [`next7` shows few or no events on some weekdays, because the seed anchor sits 7–13 days ahead] → Expected behavior. The empty state handles it, and `next30` is the default.
- [Client and server cause lists drift] → Both are short, and an unknown cause from the server falls back to the raw value instead of crashing.
- [Debounced search plus URL updates flood the browser history] → Filter changes use `replace` instead of `push`, so Back leaves the page rather than stepping through keystrokes.

## Migration Plan

No schema change. Deploy by pushing to `main`. Vercel and Render rebuild automatically.
