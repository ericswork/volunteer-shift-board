# shift-signup Specification

## Purpose

Lets a signed-in volunteer claim and give up spots on shifts. The server guarantees capacity, no double-booking and the cancellation window, even when requests arrive at the same moment.

## Requirements

### Requirement: Sign up for a shift
`POST /api/shifts/:id/signup` SHALL create a sign-up for the signed-in user. It returns `201` with the new sign-up's `id` and the shift's updated `signedUpCount`, `spotsLeft` and `status`. It requires sign-in (`401` otherwise), and an unknown shift returns `404 NOT_FOUND`.

#### Scenario: Open shift
- **WHEN** Demo Volunteer signs up for Sort donations (6 of 8 taken)
- **THEN** the response is `201` and the shift shows 7 of 8 taken, status `filling`

#### Scenario: Anonymous request
- **WHEN** a request without a token calls the endpoint
- **THEN** the response is `401 UNAUTHENTICATED` and no sign-up is created

### Requirement: Capacity is never exceeded
The server SHALL reject a sign-up for a shift with no spots left with `409 SHIFT_FULL` and the message "This shift just filled up." A shift's sign-ups SHALL never exceed its capacity, even when several requests arrive at the same moment.

#### Scenario: Full shift
- **WHEN** a volunteer signs up for Load delivery vans (4 of 4)
- **THEN** the response is `409` with code `SHIFT_FULL`

#### Scenario: Two volunteers race for the last spot
- **WHEN** two different volunteers send sign-ups for a shift with one spot left at the same moment
- **THEN** exactly one gets `201` and the other gets `409 SHIFT_FULL`

#### Scenario: Burst of requests
- **WHEN** ten different volunteers send sign-ups at the same moment for an empty shift with capacity 3
- **THEN** exactly three succeed, seven get `409 SHIFT_FULL`, and the shift has exactly three sign-ups

### Requirement: No duplicate sign-ups
A second sign-up by the same user for the same shift SHALL return `409 ALREADY_SIGNED_UP` with "You're already signed up for this shift.", including when both requests arrive at the same moment.

#### Scenario: Double click
- **WHEN** a volunteer's two identical sign-up requests arrive at the same moment
- **THEN** one gets `201`, the other gets `409 ALREADY_SIGNED_UP`, and exactly one sign-up exists

### Requirement: No overlapping shifts
The server SHALL reject a sign-up with `409 SHIFT_OVERLAP` ("This shift overlaps another shift you've signed up for.") when its time range overlaps any shift the user already holds. Shifts that only touch, where one ends exactly when the other starts, do not overlap.

#### Scenario: Back-to-back shifts are allowed
- **WHEN** a volunteer holding Pack boxes (10:30–12:00) signs up for Sort donations (9:00–10:30)
- **THEN** the response is `201`

#### Scenario: Overlapping shift
- **WHEN** a volunteer holding Morning walkers (8:00–10:00) signs up for Kennel helpers (8:00–10:00)
- **THEN** the response is `409` with code `SHIFT_OVERLAP`

#### Scenario: Simultaneous overlapping requests
- **WHEN** a volunteer sends sign-ups for Morning walkers and Kennel helpers at the same moment, holding neither
- **THEN** exactly one succeeds and the other gets `409 SHIFT_OVERLAP`

### Requirement: No sign-ups after a shift starts
The server SHALL reject a sign-up for a shift that has already started with `409 SHIFT_STARTED` ("This shift has already started.").

#### Scenario: Shift in progress
- **WHEN** a volunteer signs up for a shift whose start time has passed
- **THEN** the response is `409` with code `SHIFT_STARTED`

### Requirement: Cancel own sign-up
`DELETE /api/signups/:id` SHALL delete the signed-in user's own sign-up and return `204`. A sign-up that doesn't exist or belongs to someone else SHALL return `404 NOT_FOUND`, so other people's sign-ups can't be discovered.

#### Scenario: Cancel well ahead
- **WHEN** Demo Volunteer cancels Pack boxes three days before it starts
- **THEN** the response is `204` and Pack boxes has one more spot left

#### Scenario: Someone else's sign-up
- **WHEN** a volunteer sends `DELETE /api/signups/<another user's sign-up id>`
- **THEN** the response is `404` and the sign-up still exists

### Requirement: 24-hour cancellation window
A volunteer SHALL NOT be able to cancel a sign-up when the shift starts in 24 hours or less. The server returns `409 CANCELLATION_CLOSED` with "Cancellations close 24 hours before the shift. Please contact the organizer."

#### Scenario: 25 hours ahead
- **WHEN** a volunteer cancels a sign-up for a shift starting in 25 hours
- **THEN** the response is `204`

#### Scenario: 23 hours ahead
- **WHEN** a volunteer cancels a sign-up for a shift starting in 23 hours
- **THEN** the response is `409` with code `CANCELLATION_CLOSED` and the sign-up remains

### Requirement: Viewer state on the event detail
When the request is signed in, `GET /api/events/:id` SHALL add a `viewer` object to each shift. Its `state` is the first that applies of `signed_up`, `started`, `full`, `overlap` or `open`. For `signed_up`, it also carries `signupId` and `canCancel`. Anonymous requests get no `viewer` field.

#### Scenario: Food Pantry for Demo Volunteer
- **WHEN** Demo Volunteer (holding Pack boxes) requests the Food Pantry event
- **THEN** Sort donations is `open`, Pack boxes is `signed_up` with `canCancel: true`, and Load delivery vans is `full`

#### Scenario: Overlap shown before trying
- **WHEN** Demo Volunteer (holding Morning walkers) requests Shelter Dog Walking
- **THEN** Kennel helpers has state `overlap`

### Requirement: Shift row actions
Each shift row SHALL show the action for the viewer's state:

| State | Action |
|---|---|
| `open` | "Sign up" (primary) |
| `signed_up` | a check icon with "You're signed up" plus "Cancel sign-up" (secondary), or "Cancellation closed" text when `canCancel` is false |
| `full` | disabled "Shift full" |
| `overlap` | disabled "Overlaps your shift" |
| `started` | disabled "Sign-ups closed" |

#### Scenario: Signed-up row
- **WHEN** Demo Volunteer views the Food Pantry event
- **THEN** the Pack boxes row shows "You're signed up" and a "Cancel sign-up" button, matching PDF page 2

#### Scenario: Inside the cancellation window
- **WHEN** a volunteer views a shift they hold that starts in 12 hours
- **THEN** the row shows "You're signed up" and "Cancellation closed" with no cancel button

### Requirement: Overlap note
The note "You can only sign up for one shift at a time. Shifts that overlap one you've already joined are unavailable." SHALL appear below every event's shift list.

#### Scenario: Note visible
- **WHEN** anyone views an event page
- **THEN** the overlap note appears below the "Choose a shift" list

### Requirement: Signing up while signed out
An anonymous visitor who activates "Sign up" SHALL be sent to `/login` and returned to the same event page afterwards, without being signed up automatically.

#### Scenario: Visitor signs up
- **WHEN** an anonymous visitor activates "Sign up" on Sort donations and then signs in
- **THEN** they return to the Food Pantry page, where Sort donations offers "Sign up"

### Requirement: Cancel confirmation
Activating "Cancel sign-up" SHALL open a confirmation dialog: "Cancel your <shift> shift on <date>?" with "Yes, cancel" and "Keep my spot". Only "Yes, cancel" sends the request.

#### Scenario: Changing one's mind
- **WHEN** a volunteer activates "Cancel sign-up" and then "Keep my spot"
- **THEN** the dialog closes, focus returns to the "Cancel sign-up" button and nothing is cancelled

### Requirement: Confirmation banner
When the viewer holds sign-ups for the event, the event page SHALL show a success banner (`role="status"`, success tokens) reading "You're signed up for <shift>, <time range>." for each held shift, with a "View my shifts" link.

#### Scenario: After signing up
- **WHEN** Demo Volunteer views the Food Pantry event
- **THEN** the banner reads "You're signed up for Pack boxes, 10:30 AM – 12:00 PM." with a "View my shifts" link

### Requirement: Feedback after actions
After a sign-up or cancellation, the shift list, counts and banner SHALL refresh without a page reload, and a toast SHALL confirm the action. If the server rejects the request, a toast SHALL show the server's message and the shift list SHALL refresh to the current counts.

#### Scenario: Lost the race
- **WHEN** a volunteer activates "Sign up" just after someone else took the last spot
- **THEN** a toast says "This shift just filled up." and the row changes to "Shift full"
