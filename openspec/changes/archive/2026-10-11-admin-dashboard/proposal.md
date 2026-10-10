# Proposal: Admin dashboard

## Why

Admins need to put events and shifts on the board and see who is coming. The dashboard is also where the server-side role check, inline form validation and accessible error messages are most visible to a reviewer.

## What Changes

- Add `GET /api/admin/events`: every upcoming event, including those without shifts, with shift count, sign-ups and status.
- Add `POST /api/admin/events` and a "New event" dialog. *Second item to cut if behind schedule: the seed already provides events.*
- Add `POST /api/admin/events/:id/shifts` and the "Add a shift" form, with inline validation that matches the server's messages.
- Add `GET /api/admin/shifts/:id/roster` and the roster panel (event and shift selection, avatars, sign-up dates, "N spots still open").
- Add `DELETE /api/admin/signups/:id` and "Remove" with confirmation. Admins are exempt from the 24-hour window.
- Admin endpoints live under `/api/admin`, so one middleware line guards all of them. This replaces the brief's draft `POST /events`.

## Capabilities

### New Capabilities
- `event-administration`: how admins list, create and staff events and shifts, view rosters and remove volunteers.

### Modified Capabilities
- None. Access control for these endpoints is already specified in `identity-access`.

## Impact

- Server: admin router (behind `requireAuth` and `requireAdmin`), controllers, services and data functions. It reuses the availability helper and the time helpers.
- Client: the `/admin` page with the events table, roster panel, add-shift form and new-event dialog. It uses React Hook Form and Zod.
- No schema change.
