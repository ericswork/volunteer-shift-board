# service-availability Specification

## Purpose

Lets the client check that the API and database are reachable, and tells visitors in plain language when the free-tier server is waking up, instead of showing a blank or broken page.

## Requirements

### Requirement: Health endpoint
`GET /api/health` SHALL return `200` with `{"status":"ok"}` after confirming the database answers a trivial query. If the database does not answer within 10 seconds, it SHALL return `503` with code `DATABASE_UNAVAILABLE`.

#### Scenario: Everything is up
- **WHEN** a client calls `GET /api/health` and the database responds
- **THEN** the response is `200` with `{"status":"ok"}`

#### Scenario: Database unreachable
- **WHEN** a client calls `GET /api/health` and the database does not respond within 10 seconds
- **THEN** the response is `503` with code `DATABASE_UNAVAILABLE`

### Requirement: Waking-up notice
When the API has not answered within 3 seconds of the app loading, the client SHALL show a notice with `role="status"` reading "Waking up the server…", explaining that the free hosting sleeps when idle and can take up to a minute to start. Meanwhile it keeps retrying and the page keeps showing its loading placeholders.

#### Scenario: Cold start
- **WHEN** a visitor opens the app and `GET /api/health` has not responded after 3 seconds
- **THEN** the waking-up notice appears above the page content

#### Scenario: Warm server
- **WHEN** a visitor opens the app and the API responds within 3 seconds
- **THEN** no waking-up notice is shown

### Requirement: Notice clears on its own
When the API starts responding, the waking-up notice SHALL disappear and pending page data SHALL load without the visitor reloading the page.

#### Scenario: Server finishes waking
- **WHEN** the notice is visible and the API then responds
- **THEN** the notice disappears and the page content loads

### Requirement: Graceful give-up
If the API has still not responded 90 seconds after the app loaded, the client SHALL replace the notice with "We couldn't reach the server." and a "Try again" button that restarts the check.

#### Scenario: Server never wakes
- **WHEN** the API has not responded for 90 seconds
- **THEN** the notice changes to "We couldn't reach the server." with a "Try again" button
- **AND** activating "Try again" shows the waking-up notice again and retries
