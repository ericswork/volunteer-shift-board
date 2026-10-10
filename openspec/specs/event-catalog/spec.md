# event-catalog Specification

## Purpose

Lets anyone, signed in or not, find upcoming volunteer events by keyword, cause and timeframe, see how full each event and shift is, and open an event to see its shifts.

## Requirements

### Requirement: Availability status rule
The server SHALL compute a status for every shift and event: `full` when no spots are left, `filling` when at least 75% of capacity is taken, otherwise `open`. An event's capacity and sign-up count are the sums over its shifts.

#### Scenario: Shift statuses from the seed data
- **WHEN** shifts have 6 of 8, 4 of 8 and 4 of 4 spots taken
- **THEN** their statuses are `filling`, `open` and `full`

#### Scenario: Event statuses from the seed data
- **WHEN** events have 14 of 20, 27 of 30 and 16 of 16 spots taken
- **THEN** their statuses are `open`, `filling` and `full`

### Requirement: Status shown in words
Status SHALL always appear as a text label ("Spots open", "Filling up", "Full") in a pill using the tokens.md colors, next to a progress bar filled to signed-up ÷ capacity. Color alone SHALL never carry the status.

#### Scenario: Filling-up event card
- **WHEN** the Harbor Park Cleanup Day card renders (27 of 30 taken)
- **THEN** it shows a "Filling up" pill (`#FDEBC8` background, `#8A3B07` text), the text "3 of 30 spots left" and an amber bar filled to 90%

### Requirement: List upcoming events
`GET /api/events` SHALL return events dated today or later (app time zone) that have at least one shift. Results are sorted by date, then by earliest shift start. Each item has `id`, `title`, `cause`, `date`, `startsAt` (earliest shift start), `endsAt` (latest shift end), `location`, `capacity`, `signedUpCount`, `spotsLeft` and `status`. The response also includes `total`.

#### Scenario: Default listing
- **WHEN** a client calls `GET /api/events` after the seed ran today
- **THEN** the six seeded events are returned soonest first and `total` is 6

#### Scenario: Events without shifts or in the past
- **WHEN** an event has no shifts, or its date is before today
- **THEN** it is not included

### Requirement: Keyword search
The `q` parameter SHALL match case-insensitively anywhere in an event's title, location or description. Surrounding spaces are trimmed and an empty value is ignored. A value longer than 100 characters returns `400 VALIDATION_ERROR`.

#### Scenario: Match on location
- **WHEN** a client calls `GET /api/events?q=library`
- **THEN** Weekend Reading Buddies is returned (its location is Eastside Public Library)

#### Scenario: Case-insensitive title match
- **WHEN** a client calls `GET /api/events?q=GARDEN`
- **THEN** Community Garden Planting is returned

### Requirement: Cause filter
The `cause` parameter SHALL limit results to one cause: `food`, `environment`, `education`, `community`, `seniors` or `animals`. Any other value returns `400 VALIDATION_ERROR`.

#### Scenario: Filter by cause
- **WHEN** a client calls `GET /api/events?cause=animals`
- **THEN** only Shelter Dog Walking is returned

### Requirement: Timeframe filter
The `when` parameter SHALL accept `next7` (today through 7 days ahead), `next30` (today through 30 days ahead) or `all` (every upcoming event). The API defaults to `all`. The events page defaults to "Next 30 days" (`next30`).

#### Scenario: Next 7 days
- **WHEN** the seed ran on 2026-10-10 and a client calls `GET /api/events?when=next7` that day
- **THEN** only Saturday Food Pantry Packing (Oct 17) is returned

### Requirement: Open spots filter
`openOnly=true` SHALL return only events with at least one shift that still has a spot left.

#### Scenario: Full event hidden
- **WHEN** a client calls `GET /api/events?openOnly=true`
- **THEN** Community Garden Planting (all shifts full) is not returned and the other five are

### Requirement: Event detail endpoint
`GET /api/events/:id` SHALL return the event's list fields plus `description` and `shifts`, sorted by start time. Each shift has `id`, `name`, `startsAt`, `endsAt`, `capacity`, `signedUpCount`, `spotsLeft` and `status`. An unknown or malformed id returns `404 NOT_FOUND`.

#### Scenario: Food Pantry detail
- **WHEN** a client requests the Saturday Food Pantry Packing event
- **THEN** it has three shifts in order: Sort donations (`filling`, 2 left), Pack boxes (`open`, 4 left), Load delivery vans (`full`, 0 left)

#### Scenario: Unknown event
- **WHEN** a client calls `GET /api/events/not-a-real-id`
- **THEN** the response is `404` with code `NOT_FOUND`

### Requirement: Date and time display
Dates SHALL be shown as "Sat, Oct 17". Time ranges SHALL be shown as "8:00 – 11:00 AM" when both ends share AM/PM, and as "10:30 AM – 12:00 PM" when they don't.

#### Scenario: Card date line
- **WHEN** the Food Pantry card renders
- **THEN** its date line reads "Sat, Oct 17 · 9:00 AM – 1:00 PM"

### Requirement: Events list page
The events page SHALL show:
- the heading "Find a shift that fits your week" and the intro text,
- a filter card (search, cause, when, an "Only show shifts with open spots" checkbox, Clear filters),
- "N upcoming events" with "Sorted by date, soonest first",
- a responsive card grid.

#### Scenario: First visit
- **WHEN** a visitor opens `/`
- **THEN** the filters show empty search, "All causes", "Next 30 days" and an unchecked checkbox, and the result count matches the cards shown

### Requirement: Event cards
Each card SHALL show the cause chip, status pill, title, date and time range, location, spots text with its bar, and a button to the event page. The button reads "View shifts" (primary style), or "View details" (secondary style) when the event is full.

#### Scenario: Open event card
- **WHEN** the Food Pantry card renders
- **THEN** it shows "6 of 20 spots left" and a primary "View shifts" button

#### Scenario: Full event card
- **WHEN** the Community Garden Planting card renders
- **THEN** it shows "Full · 16 of 16 taken", a grey bar and a secondary "View details" button

### Requirement: Filters live in the URL
Filter values SHALL be stored in the page URL, so reloading, sharing a link or pressing Back restores the same filters and results. The search box updates results once the user pauses typing for 300 ms.

#### Scenario: Reload keeps filters
- **WHEN** a visitor selects "Animals", checks the open-spots box and reloads the page
- **THEN** the same filters are selected and the same results are shown

### Requirement: Clear filters
"Clear filters" SHALL reset search to empty, cause to "All causes", when to "Next 30 days" and uncheck the open-spots box.

#### Scenario: Clearing
- **WHEN** a visitor with active filters activates "Clear filters"
- **THEN** all filters return to their defaults and the full list is shown

### Requirement: Loading state
While events load, the list SHALL show skeleton cards in place of the grid, and the result count SHALL read "Loading events…".

#### Scenario: Slow response
- **WHEN** the events request is in flight
- **THEN** skeleton cards are shown and no "0 upcoming events" message flashes

### Requirement: Empty state
When no events match, the page SHALL show "No shifts match your filters" with a "Clear filters" button.

#### Scenario: Nothing matches
- **WHEN** a visitor searches for "zzz"
- **THEN** the grid is replaced by "No shifts match your filters" and a "Clear filters" button

### Requirement: Error state
If the events request fails, the page SHALL show "We couldn't load events." with a "Try again" button that repeats the request.

#### Scenario: Server error
- **WHEN** `GET /api/events` returns a 500
- **THEN** the error message and "Try again" button are shown in place of the grid

### Requirement: Event detail page
The event page SHALL show:
- a back link "All events",
- the cause chip and a status pill with spots left (for example "Spots open · 6 of 20 spots left"),
- the title, date and time range, location and description,
- a "Choose a shift" list and two side panels:
  - "Good to know": shared text for every event, including the 24-hour cancellation note,
  - "Questions?": with a "Message the organizer" email link to `organizer@example.org`.

The two columns stack into one on narrow screens.

#### Scenario: Wide screen
- **WHEN** the Food Pantry page is viewed 1280px wide
- **THEN** the shift list and side panels sit side by side

#### Scenario: Phone
- **WHEN** the same page is viewed 390px wide
- **THEN** the side panels appear below the shift list

### Requirement: Shift rows
Each shift row SHALL show the shift name, its time range and the spots text with a bar colored by status. A full shift SHALL show a disabled "Shift full" button. Actions for open shifts are defined by the `shift-signup` capability.

#### Scenario: Full shift row
- **WHEN** the Load delivery vans row renders
- **THEN** it shows "Full · 4 of 4 taken", a grey bar and a disabled "Shift full" button

### Requirement: Missing event page
Visiting an event that doesn't exist SHALL show "We couldn't find that event." with a link back to all events.

#### Scenario: Stale link
- **WHEN** a visitor opens `/events/<unknown id>`
- **THEN** the not-found message and "All events" link are shown
