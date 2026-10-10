# event-administration Specification

## Purpose

Lets admins create events and shifts, see who has signed up for each shift, and remove volunteers. The server enforces the admin role on every one of these actions.

## Requirements

### Requirement: Admin events list endpoint
`GET /api/admin/events` SHALL return every event dated today or later, including events with no shifts, sorted by date. Each has `id`, `title`, `cause`, `date`, `shiftCount`, `signedUpCount`, `capacity` and `status`, where `status` is `null` when the event has no shifts.

#### Scenario: Seeded data
- **WHEN** Demo Admin calls `GET /api/admin/events` after a fresh seed
- **THEN** the six events are returned with shift counts 3, 2, 2, 2, 1 and 2 and sign-ups 14/20, 27/30, 4/12, 16/16, 3/8 and 8/10

### Requirement: Events table
The `/admin` page SHALL show:
- the heading "Manage events" and the subtitle "Create events and shifts, and see who has signed up.",
- a "New event" button,
- an "Events" table with the columns Event (title with the cause below it), Date, Shifts, Signed up ("14 / 20"), Status (pill, or "No shifts yet") and a "Manage" link.

On narrow screens the table SHALL scroll horizontally inside its card.

#### Scenario: Matches the mockup
- **WHEN** Demo Admin opens `/admin`
- **THEN** the table matches PDF page 3, and the Food Pantry row shows "Spots open", following the tokens.md status rule

### Requirement: Selecting an event and shift
"Manage" SHALL select that event: its row is highlighted (`row-selected`, `aria-current="true"`), and the roster panel loads the event's first shift. A shift picker in the roster panel SHALL switch to the event's other shifts. On first load, the first event is selected.

#### Scenario: Default selection
- **WHEN** Demo Admin opens `/admin`
- **THEN** Saturday Food Pantry Packing is selected and the roster shows Sort donations

#### Scenario: Switching shift
- **WHEN** Demo Admin picks "Pack boxes" in the shift picker
- **THEN** the roster shows Pack boxes, including Demo Volunteer

### Requirement: Roster endpoint
`GET /api/admin/shifts/:id/roster` SHALL return the shift's `name`, `startsAt`, `endsAt`, `capacity`, `signedUpCount`, `status` and its sign-ups (`signupId`, volunteer `name`, `initials`, `signedUpAt`), oldest first. An unknown shift returns `404 NOT_FOUND`.

#### Scenario: Sort donations roster
- **WHEN** Demo Admin requests the Sort donations roster
- **THEN** it lists Maya Reyes, Daniel Kim, Priya Nair, Tomás Silva, Hannah Lee and Omar Haddad in that order

### Requirement: Roster panel
The roster panel SHALL show:
- the shift name, date and time,
- a "<n> of <m> signed up" pill colored by status,
- one row per volunteer: initials avatar, name, "Signed up <Mon D>" and a "Remove" button,
- a dashed "<k> spots still open" placeholder when spots remain.

#### Scenario: Partly filled shift
- **WHEN** the roster shows Sort donations (6 of 8)
- **THEN** it shows a "6 of 8 signed up" pill in Filling-up colors, six volunteer rows and "2 spots still open"

#### Scenario: Empty shift
- **WHEN** the roster shows a shift with no sign-ups
- **THEN** it shows "No one has signed up yet." and the open-spots placeholder

### Requirement: Remove a volunteer
`DELETE /api/admin/signups/:id` SHALL delete any sign-up and return `204`, regardless of the 24-hour window. In the UI, "Remove" SHALL first ask "Remove <name> from <shift>?" with "Remove" and "Keep". On success, the roster and table counts refresh and a toast says "Removed <name> from <shift>."

#### Scenario: Remove inside the window
- **WHEN** Demo Admin removes a volunteer from a shift starting in 3 hours
- **THEN** the response is `204` and the volunteer no longer appears on the roster

#### Scenario: Already removed
- **WHEN** Demo Admin removes a sign-up that no longer exists
- **THEN** the response is `404 NOT_FOUND`, a toast explains it, and the roster refreshes

### Requirement: Add shift endpoint
`POST /api/admin/events/:id/shifts` SHALL create a shift and return `201`. It takes `name` (1–80 characters), `startTime` and `endTime` (`HH:mm`, read on the event's date in the app time zone) and `capacity` (whole number, 1–200). Invalid input returns `400 VALIDATION_ERROR` with per-field details, and an unknown event returns `404`.

#### Scenario: Valid shift
- **WHEN** Demo Admin adds "Greet and check in" 08:30–09:00, capacity 2, to the Food Pantry event
- **THEN** the response is `201` and the event now has 4 shifts and capacity 22

#### Scenario: End before start
- **WHEN** the request has `startTime` 10:30 and `endTime` 09:30
- **THEN** the response is `400` with a detail for `endTime`: "End time must be after the start time."

#### Scenario: Past event
- **WHEN** the event's date is before today
- **THEN** the response is `400` with "Shifts can only be added to upcoming events."

### Requirement: Add shift form
The "Add a shift" form (Event, Shift name, Start time, End time, Capacity) SHALL validate each field when the user leaves it and again on submit. Errors appear under the field with an error icon, a 2px `#B42318` border, `aria-invalid="true"`, and the message linked via `aria-describedby`. Server field errors SHALL appear the same way.

#### Scenario: Mockup example
- **WHEN** Demo Admin enters Start 10:30 and End 09:30 and leaves the End field
- **THEN** the End field shows "End time must be after the start time." as in PDF page 3, and focus stays where the user moved it

#### Scenario: Success
- **WHEN** a valid shift is submitted
- **THEN** the form resets (keeping the selected event), a toast confirms "Shift added", and the table's Shifts and Signed up columns update

### Requirement: Create event endpoint
`POST /api/admin/events` SHALL create an event and return `201` with its `id`. It takes `title` (3–100 characters), `cause` (one of the six causes), `date` (`YYYY-MM-DD`, today or later), `location` (3–100 characters) and `description` (1–1000 characters).

#### Scenario: Past date
- **WHEN** the request's `date` is yesterday
- **THEN** the response is `400` with a detail for `date`: "Pick today or a later date."

### Requirement: New event dialog
"New event" SHALL open an accessible dialog (focus trapped, Escape closes it, focus returns to the button) containing the event form, validated the same way as the shift form. On success, the dialog closes, the new event appears in the table with "No shifts yet" and becomes the selected event, and the add-shift form preselects it.

#### Scenario: Create then staff
- **WHEN** Demo Admin creates "Riverside Book Swap" and the dialog closes
- **THEN** the event is selected, the roster panel says "No shifts yet. Add one below.", and the add-shift form's Event field shows "Riverside Book Swap"
