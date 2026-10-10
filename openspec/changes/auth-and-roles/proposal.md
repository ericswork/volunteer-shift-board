# Proposal: Auth and roles

## Why

Sign-ups belong to a person, and the admin dashboard must be off-limits to volunteers, and enforced by the server, not just hidden in the UI. Reviewers also need to try both roles in seconds, without registering.

## What Changes

- Add sign-in with email and password through Firebase Auth. It works on the free `*.vercel.app` domain and has no new-device verification that would break a shared demo password.
- Add one-click "Continue as demo volunteer" and "Continue as demo admin" buttons.
- Add self-registration (name, email, password). New accounts are always volunteers. *Cut first if behind schedule.*
- Make the app database the authority on roles. Firebase only proves who the user is. On first sign-in, the user is linked to their database record by email, or a new volunteer record is created.
- Add server middleware: `requireAuth` (valid Firebase ID token, otherwise 401) and `requireAdmin` (admin role, otherwise 403) on every `/api/admin` route.
- Add `GET /api/me`.
- Add role-aware header (Admin link for admins only, user chip with initials and a sign-out menu, "Log in" for visitors) and protected-page redirects.

## Capabilities

### New Capabilities
- `identity-access`: signing in and out, demo logins, registration, how users map to roles, and how the server protects authenticated and admin-only endpoints.

### Modified Capabilities
- None. The header's role-aware parts are specified here rather than by modifying `app-shell`.

## Impact

- New dependencies: `firebase` (client) and `jose` (server). The server verifies Firebase ID tokens against Google's published certificates, as Firebase documents for third-party JWT libraries, so no service account is needed. `firebase-admin` was dropped because its docs require a service account even to verify tokens.
- New owner setup: a Firebase project with Email/Password sign-in enabled, the Vercel domain added to its authorized domains, and the two demo accounts created by hand in the Firebase console.
- New environment variables: client `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_DEMO_VOLUNTEER_PASSWORD`, `VITE_DEMO_ADMIN_PASSWORD`; server `FIREBASE_PROJECT_ID`.
- API: `GET /api/me`. Every later authenticated endpoint uses the middleware added here.
