# Design: Admin dashboard

## Context

What's already in place when this change starts:
- `auth-and-roles` mounts an empty `adminRouter` behind `requireAuth` and `requireAdmin`, so every route added here is admin-only with no extra code.
- `browse-events` provides `availability()`, the time helpers (`appToday`, `zonedTimeToUtc`), `GET /api/events/:id` (which returns any event with its shifts, including events with no shifts) and the status pill, spots and avatar components.
- `shift-signups` provides the sign-up data functions, shadcn/ui `Dialog` and `Sonner` toasts, and the `['event', id]`, `['events']` and `['my-signups']` query keys.
- `lib/initials.ts` on the server already computes initials.

Requirements are in `specs/event-administration/spec.md`. The layout is PDF page 3.

## Goals / Non-Goals

**Goals:**
- Every admin rule (field limits, end after start, upcoming events only) is enforced by the server and mirrored by the client with the same messages.
- The page matches PDF page 3 and stays usable on a phone.

**Non-Goals:**
- Editing or deleting events and shifts (out of scope for the project).
- Shifts that cross midnight. A shift starts and ends on its event's date.
- Selection in the URL. Admin views aren't shared as links.

## Decisions

### 1. Admin endpoints are separate from the public ones
- `GET /api/admin/events` has its own data function: `date >= today`, **no** `shifts: { some: {} }` filter, each shift with its sign-up count. The admin service sums them with `availability()` and returns `status: null` when an event has no shifts.
- **Alternative rejected:** an `includeEmpty` flag on `GET /api/events`. The public endpoint would then behave differently depending on who asks, and its tests would have to cover both roles.

### 2. Shift times are typed as wall-clock times on the event's date
- The body takes `startTime` and `endTime` as `HH:mm`. The service turns them into instants with `zonedTimeToUtc(event.date, time, APP_TIMEZONE)`, the helper the seed already uses.
- "End after start" is a Zod `refine` on the body with `path: ['endTime']`. Comparing `HH:mm` strings is enough because both times are on the same day.
- "Upcoming events only" needs the event's date, so it lives in the service and is returned as a `VALIDATION_ERROR` detail with path `eventId`. The form shows it under the Event field, like any other field error.
- **Alternative rejected:** ISO instants from the client. The browser would then do the time zone conversion, which bootstrap's "one app time zone, decided on the server" rule avoids.

### 3. One schema file per form, copied to the client
- Server: `schemas/admin.ts` (`createShiftBody`, `createEventBody`). Client: `lib/admin-forms.ts` with the same rules and the same messages, so the browser shows errors instantly.
- Server field errors come back as `error.details` and are passed to React Hook Form's `setError(path, …)`, so they look exactly like client errors.
- **Alternative rejected:** a shared package (rejected in `bootstrap-and-deploy` decision 1).

### 4. Validation timing
- React Hook Form with `mode: 'onBlur'` validates a field when the user leaves it, and every field on submit, as the spec asks.
- `startTime` is registered with `deps: ['endTime']`, so changing the start re-checks the end and a stale "End time must be after the start time." disappears.
- Errors use the existing `TextField` (2px error border, icon, `aria-invalid`, `aria-describedby`). A matching `SelectField` is added for the Event field.

### 5. Page state and data
- `selectedEventId` and `selectedShiftId` live in React state. On first load the first event is selected, and selecting an event selects its first shift.
- Queries:
  - `['admin-events']`: the table.
  - `['event', id]`: reused from the public detail endpoint for the shift picker. No new endpoint is needed to list an event's shifts.
  - `['roster', shiftId]`: the roster panel.
- After each mutation:
  - add shift: `['admin-events']`, `['event', id]`, `['events']`;
  - remove: the same, plus `['roster', shiftId]` and `['my-signups']`;
  - create event: `['admin-events']`, then select the new event.
- **Alternative rejected:** selection in URL search params. It makes sense for shareable public filters, but adds parsing and validation here for no user benefit.

### 6. Roster and removal
- `GET /api/admin/shifts/:id/roster` returns the shift summary plus sign-ups oldest first, each with the volunteer's `name`, `initials` and `signedUpAt`. A malformed id is a 404, like the event endpoint.
- `DELETE /api/admin/signups/:id` deletes any sign-up without the 24-hour check (admins are exempt) and returns `404` when it no longer exists. No lock is needed: deleting can only free capacity (`shift-signups` decision 2).
- "Remove" opens the shadcn `Dialog` with "Remove <name> from <shift>?", "Remove" and "Keep". A `404` shows a toast and refreshes the roster.

### 7. Layout
- Two columns at `lg` and wider: the events table card with the "Add a shift" card below it, and the roster card on the right (300–420px, as tokens.md says). Narrower screens stack them.
- The table sits in an `overflow-x-auto` wrapper inside its card, so only the table scrolls sideways, never the page.
- "Manage" is a `<button>` styled as a link, because it changes the selection on the same page instead of navigating. The selected row gets `row-selected` and `aria-current="true"`.

### 8. Testing
- **Server integration tests** (Supertest, fake verifier as the demo admin, `test` branch, clock pinned, fresh seed): each spec scenario for the four endpoints, plus `400` details for each invalid field.
- **Client unit tests:** the copied form schemas (end after start, capacity limits, past date), because they are pure functions.
- **Browser checks:** PDF page 3 at 1280px, the table scrolling inside its card at 390px, the mockup's end-time error on blur, adding a shift, removing a volunteer, and creating an event.

## Risks / Trade-offs

- [The client and server schemas drift] → Both are short, and the server is the authority: a drifted client rule only changes when the error appears, never what is accepted.
- [`<input type="time">` looks different in each browser] → It is native, accessible and always submits `HH:mm`. The mockup's clock icon is the browser's own.
- [An admin removes the Demo Volunteer's seeded sign-ups] → The nightly reset in `polish-and-readme` restores them.
- [Cut if behind] → The New event dialog is the second item to cut. Group 4 (endpoint) and group 8 (dialog) can be dropped together without touching anything else.

## Migration Plan

No schema change. Deploy by pushing to `main`.
