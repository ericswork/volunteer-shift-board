# Spec Delta: identity-access

## Purpose

Identifies who is using the app, tells volunteers and admins apart, and enforces admin-only access on the server. Reviewers can try either role with one click.

## ADDED Requirements

### Requirement: Email and password sign-in
The `/login` page SHALL let visitors sign in with email and password. Wrong credentials SHALL show "Email or password is incorrect." without revealing which one was wrong.

#### Scenario: Successful sign-in
- **WHEN** a visitor enters valid credentials and submits
- **THEN** they are signed in and taken to the page they came from (or the events list)

#### Scenario: Wrong password
- **WHEN** a visitor submits a wrong password
- **THEN** the form shows "Email or password is incorrect." and stays on `/login`

### Requirement: One-click demo login
The `/login` page SHALL offer "Continue as demo volunteer" and "Continue as demo admin" buttons that sign in to the seeded demo accounts without typing anything.

#### Scenario: Demo admin
- **WHEN** a reviewer activates "Continue as demo admin"
- **THEN** they are signed in as Demo Admin and the header shows the Admin link

### Requirement: Self-registration
The `/register` page SHALL create an account from name, email and a password of at least 8 characters. New accounts SHALL always receive the volunteer role.

#### Scenario: New volunteer
- **WHEN** a visitor registers with valid details
- **THEN** they are signed in as a volunteer and the header shows their initials and name

#### Scenario: Email already used
- **WHEN** a visitor registers with an email that already has an account
- **THEN** the form shows "An account with this email already exists." under the email field

### Requirement: Staying signed in and signing out
A signed-in user SHALL stay signed in across page reloads until they choose "Sign out" from the user menu in the header.

#### Scenario: Reload
- **WHEN** a signed-in user reloads the page
- **THEN** they are still signed in

#### Scenario: Sign out
- **WHEN** a user chooses "Sign out"
- **THEN** they are signed out and taken to the events list, and the header shows "Log in"

### Requirement: Authenticated API requests
Endpoints that require sign-in SHALL return `401 UNAUTHENTICATED` when the request has no valid, unexpired identity token in the `Authorization: Bearer` header. The server SHALL identify the user only from that token, never from the request body or query.

#### Scenario: No token
- **WHEN** a client calls `GET /api/me` without an `Authorization` header
- **THEN** the response is `401` with code `UNAUTHENTICATED`

#### Scenario: Expired token
- **WHEN** a client calls `GET /api/me` with an expired token
- **THEN** the response is `401` with code `UNAUTHENTICATED`

### Requirement: Roles come from the app database
Each user SHALL have exactly one role, `volunteer` or `admin`, stored in the app database. On a user's first authenticated request, the server SHALL link them to an existing user record with the same email, or else create a new volunteer record.

#### Scenario: Demo admin's first sign-in
- **WHEN** Demo Admin signs in for the first time after seeding
- **THEN** the server links them to the seeded `demo.admin@example.com` record and they have the admin role

#### Scenario: Unknown email
- **WHEN** someone registered through the sign-in provider calls the API for the first time
- **THEN** a new user record with the volunteer role is created

### Requirement: Current user endpoint
`GET /api/me` SHALL return the signed-in user's `id`, `name`, `email`, `role` and `initials`.

#### Scenario: Demo volunteer
- **WHEN** Demo Volunteer calls `GET /api/me`
- **THEN** the response is `200` with name "Demo Volunteer", role `volunteer` and initials "DV"

### Requirement: Admin-only API
Every endpoint under `/api/admin` SHALL return `401 UNAUTHENTICATED` to anonymous requests and `403 FORBIDDEN` to signed-in users without the admin role. This SHALL be enforced by the server whatever the UI shows.

#### Scenario: Volunteer calls an admin endpoint directly
- **WHEN** Demo Volunteer sends `POST /api/admin/events` with a valid token
- **THEN** the response is `403` with code `FORBIDDEN` and nothing is created

#### Scenario: Anonymous call
- **WHEN** a request without a token calls `GET /api/admin/events`
- **THEN** the response is `401` with code `UNAUTHENTICATED`

### Requirement: Role-aware header
The header SHALL show the "Admin" link only to admins. Signed-in users SHALL see a chip with their initials and name that opens a menu with "Sign out". Anonymous visitors SHALL see a "Log in" link instead.

#### Scenario: Volunteer header
- **WHEN** Demo Volunteer views any page
- **THEN** the navigation shows "Events" and "My shifts" (no "Admin") and the chip shows "DV Demo Volunteer"

#### Scenario: Visitor header
- **WHEN** an anonymous visitor views any page
- **THEN** the header shows a "Log in" link and no user chip

### Requirement: Protected pages
Opening My shifts or Admin while signed out SHALL redirect to `/login` and return to the original page after sign-in. A volunteer opening `/admin` SHALL see "You don't have access to this page." with a link to the events list.

#### Scenario: Deep link while signed out
- **WHEN** an anonymous visitor opens `/my-shifts` and then signs in
- **THEN** they land on `/my-shifts`

#### Scenario: Volunteer opens admin
- **WHEN** Demo Volunteer opens `/admin`
- **THEN** the page shows "You don't have access to this page." and no admin data is requested
