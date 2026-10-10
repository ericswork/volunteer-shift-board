# Tasks: Browse events

Each numbered group is one commit. The owner reviews it before the next group starts.

## 1. Availability and time helpers (server)

- [ ] 1.1 Add `lib/clock.ts` and the "today" / window helpers in `lib/time.ts`; verify unit tests: with the clock at 2026-10-10 in `APP_TIMEZONE`, today is `2026-10-10`, the `next7` end is `2026-10-17` and the `next30` end is `2026-11-09`
- [ ] 1.2 Add `services/availability.ts`; verify unit tests for 6/8 → filling, 4/8 → open, 4/4 → full, 14/20 → open, 27/30 → filling, and the 74% / 75% boundary

## 2. Events API

- [ ] 2.1 Add the Zod query schema and `GET /api/events` (route → controller → service → data) with the default sort; verify the integration test "default listing returns six events soonest first, total 6" on the `test` branch with the clock pinned
- [ ] 2.2 Add the `q`, `cause`, `when` and `openOnly` filters; verify one integration test per spec scenario (library, GARDEN, animals, next7, openOnly), plus `when=tomorrow` and a 101-character `q` returning `400 VALIDATION_ERROR`
- [ ] 2.3 Exclude events with no shifts and past events; verify with a test that inserts an empty event and a past event and checks that neither is listed
- [ ] 2.4 Add `GET /api/events/:id` with shifts ordered by start; verify tests for the Food Pantry shift order and statuses, an unknown uuid → 404, and `not-a-real-id` → 404

## 3. Shared UI pieces

- [ ] 3.1 Add the `formatDate`, `formatTimeRange` and `spotsLabel` helpers; verify client unit tests for "Sat, Oct 17", "8:00 – 11:00 AM", "10:30 AM – 12:00 PM", "6 of 20 spots left" and "Full · 16 of 16 taken"
- [ ] 3.2 Add `StatusPill`, `SpotsBar` and `CauseChip` using tokens.md colors; verify on a scratch page that each status shows its text label and correct colors, and that the bar width equals the booked percentage

## 4. Events list page

- [ ] 4.1 Build the intro, `FilterCard` and result-count line, with filters stored in URL search params (300 ms debounced search, `replace` navigation); verify that selecting Animals plus open-only and reloading keeps both, and that the Back button leaves the page
- [ ] 4.2 Build `EventCard` and the auto-fill grid (320px minimum, 24px gap); verify against PDF page 1: open card "View shifts" (primary), full card "View details" (secondary), and "Sat, Oct 17 · 9:00 AM – 1:00 PM" on the Food Pantry card
- [ ] 4.3 Add skeleton, empty ("No shifts match your filters" + Clear filters) and error ("We couldn't load events." + Try again) states; verify by throttling the network, searching "zzz", and stopping the server
- [ ] 4.4 Wire "Clear filters"; verify it resets every filter to its default and the URL returns to `/`

## 5. Event detail page

- [ ] 5.1 Build the header area (back link, chips, title, date and location, description) and the two-column layout that stacks below the breakpoint; verify against PDF page 2 at 1280px and 390px
- [ ] 5.2 Build `ShiftRow` with spots, bar and the disabled "Shift full" state, leaving an empty action slot for open shifts; verify Load delivery vans shows "Full · 4 of 4 taken" with a disabled button
- [ ] 5.3 Add the "Good to know" and "Questions?" panels (mailto `organizer@example.org`) and the not-found state; verify `/events/<random uuid>` shows "We couldn't find that event."

## 6. Deploy and verify

- [ ] 6.1 Push to `main` and verify on the live URLs: the list shows six events with the correct statuses, every filter works, a card opens its detail page, and the detail page reloads without a 404
- [ ] 6.2 Add an "API" section to the README covering `GET /api/events` (parameters, example response) and `GET /api/events/:id`; verify the example `curl` commands work against the live API

## Workflow follow-up

- Owner reviews the code and the live deploy, then archive with `/opsx:archive browse-events`.
