# my-shifts Specification

## Purpose

Gives a signed-in volunteer a phone-friendly list of their upcoming and past shifts, and lets them cancel upcoming ones within the cancellation rules.

## Requirements

### Requirement: My sign-ups endpoint
`GET /api/me/signups?when=upcoming|past` SHALL return the signed-in user's sign-ups. Each has `signupId`, `canCancel`, the shift's `id`, `name`, `startsAt` and `endsAt`, and the event's `id`, `title` and `location`. Upcoming means the shift hasn't ended (soonest first); past means it has ended (most recent first). `when` defaults to `upcoming`, and the endpoint requires sign-in.

#### Scenario: Demo Volunteer upcoming
- **WHEN** Demo Volunteer calls `GET /api/me/signups` after a fresh seed
- **THEN** the response lists Pack boxes, Tech help desk and Morning walkers, in that order

#### Scenario: Demo Volunteer past
- **WHEN** Demo Volunteer calls `GET /api/me/signups?when=past`
- **THEN** the response lists Sort and fold coats, then Set up tables

### Requirement: Tabs
The My shifts page SHALL have "Upcoming" and "Past" tabs (`role="tablist"`, `role="tab"`, `aria-selected`, arrow-key navigation), with Upcoming selected by default. Below the 30px "My shifts" heading, it SHALL show "<N> upcoming shifts. Thanks for showing up for your community." ("1 upcoming shift." when N is 1).

#### Scenario: First visit
- **WHEN** Demo Volunteer opens `/my-shifts`
- **THEN** "Upcoming" is selected and the summary reads "3 upcoming shifts. Thanks for showing up for your community."

#### Scenario: Keyboard tabs
- **WHEN** focus is on the "Upcoming" tab and the user presses the right arrow key
- **THEN** focus and selection move to "Past" and the past list is shown

### Requirement: Shift cards
Each card SHALL show:
- a date block with the weekday abbreviation and day number (for example "SAT" and "17"),
- the shift name,
- the event title linking to the event page,
- the time range with a clock icon and the location with a pin icon.

Upcoming cards SHALL add a full-width "Cancel sign-up" button.

#### Scenario: Pack boxes card
- **WHEN** the Upcoming tab shows Pack boxes
- **THEN** the card matches PDF page 4: "SAT 17", "Pack boxes", "Saturday Food Pantry Packing", "10:30 AM – 12:00 PM", "Riverside Community Hall" and "Cancel sign-up"

#### Scenario: Past card
- **WHEN** the Past tab shows a shift
- **THEN** the card has no cancel button

### Requirement: Cancel from My shifts
"Cancel sign-up" SHALL use the same confirmation dialog and server rules as the event page. On success, the card is removed, the summary count updates and a toast confirms. When `canCancel` is false, the button SHALL be replaced by the text "Cancellation closed (less than 24 hours to go)".

#### Scenario: Successful cancel
- **WHEN** Demo Volunteer confirms cancelling Tech help desk
- **THEN** the card disappears, the summary reads "2 upcoming shifts…" and a toast says the sign-up was cancelled

#### Scenario: Inside the window
- **WHEN** an upcoming shift starts in 10 hours
- **THEN** its card shows "Cancellation closed (less than 24 hours to go)" instead of the button

### Requirement: Cancellation note
Below the list, the page SHALL show "You can cancel up to 24 hours before a shift so someone else can take your spot."

#### Scenario: Note shown
- **WHEN** the Upcoming tab is shown
- **THEN** the cancellation note appears below the cards

### Requirement: Empty states
With no upcoming shifts, the page SHALL show "You haven't signed up for any upcoming shifts." with a "Browse events" link. With no past shifts, it SHALL show "No past shifts yet."

#### Scenario: New volunteer
- **WHEN** a newly registered volunteer opens `/my-shifts`
- **THEN** the summary reads "0 upcoming shifts…", the empty message appears, and "Browse events" links to `/`

### Requirement: Mobile-first layout
The page SHALL be designed for 360–430px wide first: full-width cards with 16px padding and a 30px heading. On wider screens, the cards sit in a single column no wider than 640px inside the standard container.

#### Scenario: Phone
- **WHEN** the page is viewed 390px wide
- **THEN** it matches the PDF page 4 layout with no horizontal scrolling and buttons at least 44px tall
