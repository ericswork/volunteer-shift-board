# Proposal: Shift sign-ups

## Why

Signing up is the app's core action, and it carries the business rules reviewers will probe:
- capacity is never exceeded, even under simultaneous requests,
- a volunteer can't double-book or join the same shift twice,
- a volunteer can't cancel inside 24 hours.

Volunteers also need a phone-friendly list of what they've committed to.

## What Changes

- Add `POST /api/shifts/:id/signup` and `DELETE /api/signups/:id`, enforcing capacity, no duplicates, no overlaps, no sign-up after a shift starts, and the 24-hour cancellation window. Each rule has its own error code.
- Extend `GET /api/events/:id` with the signed-in viewer's state for each shift: signed up, started, full, overlaps or open.
- Add the shift row actions on the event page:
  - **Sign up**,
  - **You're signed up** with **Cancel sign-up**,
  - disabled **Shift full**, **Overlaps your shift** and **Sign-ups closed**,
  - **Cancellation closed** inside 24 hours.

  The page also gets the confirmation banner, toasts and the overlap note.
- Add `GET /api/me/signups?when=upcoming|past` and the mobile-first My shifts page (Upcoming / Past tabs, shift cards, cancel with confirmation, cancellation-window note, empty states).
- Add a concurrency test that fires parallel sign-ups and proves capacity holds.

## Capabilities

### New Capabilities
- `shift-signup`: claiming and giving up spots on shifts, the server-enforced rules, and how each shift row presents the viewer's options.
- `my-shifts`: a signed-in volunteer's list of upcoming and past shifts, and cancelling from it.

### Modified Capabilities
- None. The `event-catalog` detail response is extended through the `shift-signup` requirements, and its existing fields are unchanged.

## Impact

- Server: new sign-up service (transaction with row locks), routes and controllers. Optional authentication on the event detail endpoint.
- Client: shift row actions, banner, the My shifts page. shadcn/ui is initialised here for Tabs, Dialog (cancel confirmation) and toasts.
- Database: no schema change. It relies on the `UNIQUE (user_id, shift_id)` constraint from `bootstrap-and-deploy`.
