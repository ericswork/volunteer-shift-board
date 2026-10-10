# Proposal: Browse events

## Why

Browsing is the heart of the volunteer experience and needs no login, so it can ship on Day 1 and give the first deploy real content. It also establishes the availability status rule ("Spots open", "Filling up", "Full") that sign-ups and the admin dashboard reuse.

## What Changes

- Add `GET /api/events` with keyword search, cause, timeframe and "open spots only" filters.
- Add `GET /api/events/:id` with the event's shifts and their availability.
- Add one server-side availability status rule used everywhere: Full at 0 spots left, Filling up at 75% or more booked, otherwise Spots open.
- Add the events list page (intro, filter card synced to the URL, result count, event cards, loading skeletons, empty and error states).
- Add the event detail page (back link, chips, title, date and location, description, read-only shift list, "Good to know" and "Questions?" panels). Sign-up actions on shift rows come in `shift-signups`.

## Capabilities

### New Capabilities
- `event-catalog`: finding upcoming events, seeing how full each event and shift is, and viewing an event's details and shifts.

### Modified Capabilities
- None.

## Impact

- Server: new events route, controller, service, data functions and an availability helper.
- Client: events list and event detail pages, plus shared components (status pill, spots bar, cause chip, event card, skeletons, empty state).
- No schema changes. It uses the tables from `bootstrap-and-deploy`.
