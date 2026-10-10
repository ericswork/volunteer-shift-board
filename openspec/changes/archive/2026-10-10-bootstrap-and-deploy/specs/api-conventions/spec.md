# Spec Delta: api-conventions

## Purpose

Common rules every API endpoint follows (URL prefix, JSON error envelope, request validation, cross-origin policy and date formats) so the client can handle every response the same way.

## ADDED Requirements

### Requirement: API prefix and JSON
All API endpoints SHALL live under `/api` and SHALL send and receive JSON.

#### Scenario: JSON response
- **WHEN** a client calls any `/api` endpoint successfully
- **THEN** the response has `Content-Type: application/json` (except `204 No Content` responses, which have no body)

### Requirement: Uniform error envelope
Every API error SHALL be returned as `{"error":{"code":"<CODE>","message":"<human-readable text>"}}` with a matching HTTP status. Codes are stable UPPER_SNAKE_CASE strings the client may branch on; messages are safe to show to users.

#### Scenario: Unknown API route
- **WHEN** a client calls `GET /api/nope`
- **THEN** the response is `404` with code `NOT_FOUND`

#### Scenario: Unexpected server failure
- **WHEN** an endpoint throws an unexpected error
- **THEN** the response is `500` with code `INTERNAL_ERROR` and the message "Something went wrong on our side. Please try again."
- **AND** no stack trace or internal detail appears in the response

### Requirement: Request validation
Endpoints SHALL validate path parameters, query parameters and request bodies before running any business logic, and SHALL reject invalid input with `400` and code `VALIDATION_ERROR`, listing each invalid field and the reason in `error.details` as `[{"path":"<field>","message":"<reason>"}]`.

#### Scenario: Invalid query value
- **WHEN** a client calls `GET /api/events?when=tomorrow`
- **THEN** the response is `400` with code `VALIDATION_ERROR` and `details` contains an entry with `path` `"when"`

### Requirement: Cross-origin allowlist
The API SHALL allow browser requests only from the configured client origin and from local development origins (`http://localhost:5173`).

#### Scenario: Deployed client
- **WHEN** a request arrives with `Origin` equal to the configured client origin
- **THEN** the response includes `Access-Control-Allow-Origin` with that origin

#### Scenario: Unknown site
- **WHEN** a request arrives with `Origin: https://evil.example`
- **THEN** the response has no `Access-Control-Allow-Origin` header

### Requirement: Date and time formats
The API SHALL exchange instants as ISO 8601 UTC strings (for example `2026-10-17T01:00:00.000Z`, which is 9:00 AM in Manila) and calendar dates as `YYYY-MM-DD`. The client SHALL display all dates and times in the single configured app time zone, regardless of the viewer's device time zone.

#### Scenario: Viewer in another time zone
- **WHEN** a shift starts at 9:00 AM in the app time zone and the viewer's device is set to a different zone
- **THEN** the UI still shows the shift starting at 9:00 AM
