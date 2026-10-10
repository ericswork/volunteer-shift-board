# Tasks: Admin dashboard

Each numbered group is one commit. The owner reviews it before the next group starts. Groups 4 and 8 (creating events) are the second cut if behind schedule.

## 1. Admin events list (server)

- [x] 1.1 Add `GET /api/admin/events` (events dated today or later, including those with no shifts, sorted by date, with `shiftCount`, `signedUpCount`, `capacity` and `status`, which is `null` without shifts); verify integration tests as the demo admin with the clock pinned: the six seeded events with shift counts 3, 2, 2, 2, 1, 2 and sign-ups 14/20, 27/30, 4/12, 16/16, 3/8, 8/10; an inserted event with no shifts is listed with `status: null`; a past event is not listed

## 2. Roster and removal (server)

- [x] 2.1 Add `GET /api/admin/shifts/:id/roster` (shift summary plus sign-ups oldest first with `signupId`, `name`, `initials`, `signedUpAt`); verify tests: Sort donations lists Maya Reyes, Daniel Kim, Priya Nair, Tomás Silva, Hannah Lee, Omar Haddad in that order with 6 of 8 and `filling`; an unknown uuid and `not-a-real-id` → `404`
- [x] 2.2 Add `DELETE /api/admin/signups/:id` (any sign-up, no 24-hour check); verify tests: removing a sign-up on a shift starting in 3 hours → `204` and gone from the roster; removing it again → `404 NOT_FOUND`

## 3. Add shift endpoint (server)

- [x] 3.1 Add `schemas/admin.ts` with `createShiftBody` (name 1–80, `HH:mm` times with end after start, capacity 1–200) and `POST /api/admin/events/:id/shifts`, converting times with `zonedTimeToUtc` on the event's date and refusing past events; verify tests: "Greet and check in" 08:30–09:00 capacity 2 on Food Pantry → `201`, then 4 shifts and capacity 22 in the admin list; 10:30–09:30 → `400` with an `endTime` detail "End time must be after the start time."; a past event → `400` with an `eventId` detail "Shifts can only be added to upcoming events."; capacity 0 and an empty name → one detail each; an unknown event → `404`

## 4. Create event endpoint (server; second cut if behind)

- [x] 4.1 Add `createEventBody` (title 3–100, cause enum, date today or later, location 3–100, description 1–1000) and `POST /api/admin/events`; verify tests: a valid event → `201` with its `id` and listed with `status: null`; yesterday's date → `400` with a `date` detail "Pick today or a later date."; a bad cause → `400` with a `cause` detail

## 5. Admin page and events table (client)

- [x] 5.1 Replace the `/admin` placeholder with the heading, subtitle and two-column layout, plus the Events table (title with cause below, date, shifts, "14 / 20", status pill or "No shifts yet", "Manage" button) inside a horizontally scrolling wrapper; selecting a row highlights it with `aria-current="true"`, and the first event is selected on load; verify in the browser against PDF page 3 at 1280px (Food Pantry shows "Spots open"), and at 390px that only the table scrolls sideways

## 6. Roster panel (client)

- [ ] 6.1 Add the roster panel: shift name, date and time, a shift picker from `['event', id]`, the "<n> of <m> signed up" pill, volunteer rows (avatar, name, "Signed up Oct 3"), the dashed "<k> spots still open" placeholder, "No one has signed up yet." and "No shifts yet. Add one below."; verify in the browser that the default roster is Sort donations with six rows, a Filling-up "6 of 8 signed up" pill and "2 spots still open", and that picking Pack boxes shows Demo Volunteer
- [ ] 6.2 Add "Remove" with the confirmation dialog ("Remove <name> from <shift>?", "Remove", "Keep"), the success toast "Removed <name> from <shift>." and the 404 toast; verify in the browser that "Keep" changes nothing, "Remove" updates the roster and the table's Signed up column, and a sign-up removed through the API first shows the 404 toast and a refreshed roster

## 7. Add a shift form (client)

- [ ] 7.1 Add `lib/admin-forms.ts` (copies of the server rules and messages), a `SelectField`, and the "Add a shift" form (Event, Shift name, Start time, End time, Capacity) with `mode: 'onBlur'`, `deps: ['endTime']` on the start time, server field errors through `setError`, and a reset that keeps the event on success; verify client unit tests for the schema, and in the browser that Start 10:30 and End 09:30 shows the mockup's error on leaving End, that fixing Start clears it, and that a valid shift shows "Shift added" and updates the table

## 8. New event dialog (client; second cut if behind)

- [ ] 8.1 Add the "New event" button and dialog (focus trapped, Escape closes it, focus returns to the button) with the event form validated like the shift form; on success, select the new event and preselect it in the add-shift form; verify in the browser that creating "Riverside Book Swap" closes the dialog, shows it in the table with "No shifts yet", shows "No shifts yet. Add one below." and puts it in the form's Event field

## 9. Deploy and verify

- [ ] 9.1 Push to `main` and verify on the live URLs as the demo admin: the table matches the seed, adding a shift and removing a volunteer work with toasts, and the demo volunteer still gets "You don't have access to this page."; then re-seed production so the demo data starts clean

## Workflow follow-up

- Owner reviews the code and the live deploy, then archive with `/opsx:archive admin-dashboard`.
