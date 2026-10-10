# Design: Auth and roles

## Context

What's already in place:
- `bootstrap-and-deploy` provides `createApp()`, the error envelope, `validate()`, and a `users` table with a nullable unique `firebase_uid`, a unique `email` and a `role`.
- The two demo accounts are already in the database: `demo.volunteer@example.com` (volunteer) and `demo.admin@example.com` (admin).
- The owner creates them in Firebase by hand (Authentication → Users → Add user), together with the Firebase project itself.

Firebase docs, checked on 2026-10-10:
- `firebase-admin`'s `verifyIdToken()` needs a service account.
- The same page documents verifying ID tokens with any JWT library against Google's published certificates.

Requirements are in `specs/identity-access/spec.md`.

## Goals / Non-Goals

**Goals:**
- The API identifies users from a Bearer token with **no secret on Render**.
- The app database alone decides roles, and one guard covers everything under `/api/admin`.
- Reviewers sign in with one click. Every server rule is testable without contacting Firebase.

**Non-Goals:**
- Email verification, password reset, social logins and account deletion.
- Checking whether a token was revoked. That needs `firebase-admin` with a service account. After sign-out, a copied token stays valid until it expires, at most one hour.
- Firebase custom claims.

## Decisions

### 1. Verify Firebase ID tokens with `jose`, not `firebase-admin`
`lib/firebase-token.ts` implements Firebase's documented checklist:
- The header `alg` must be `RS256`, and its `kid` must match a certificate from `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`.
- Certificates are cached for as long as the response's `Cache-Control: max-age` allows.
- `jwtVerify` checks the signature, `exp`, `aud = FIREBASE_PROJECT_ID` and `iss = https://securetoken.google.com/<projectId>`.
- On top of that we check that `sub` (the uid) is non-empty, and that `iat` and `auth_time` aren't in the future (with 5 seconds of tolerance for clock differences).
- It returns `{ uid, email, name? }`.

`createFirebaseTokenVerifier({ projectId, getCertificates })` takes the certificate fetcher as a parameter, so tests can sign tokens with a key pair they generate themselves.

- **Alternative rejected:** `firebase-admin`. Its docs require a service account even just to verify tokens, which would put a long-lived private key on Render for a read-only check. It's also a much bigger dependency.

### 2. The verifier is passed into the app
`createApp({ clientOrigin, verifyToken })`. Production passes the `jose` verifier. Tests pass a fake that accepts `test-token:<uid>:<email>[:<name>]`, so tests can act as any number of users without Firebase. `shift-signups` relies on the same seam for its race tests.

### 3. Three small middleware functions
- `authenticate` runs on every request. If there's an `Authorization: Bearer` header, it verifies the token, resolves the app user (decision 4) and stores it in `res.locals.user`.
  - No header means anonymous.
  - An invalid token also counts as anonymous, so public endpoints ignore stale tokens. Protected endpoints still reject them, through `requireAuth`.
- `requireAuth` returns `401 UNAUTHENTICATED` ("Please sign in to continue.") when there's no user.
- `requireAdmin` returns `403 FORBIDDEN` ("You don't have access to this.") when `role !== 'admin'`.
- `apiRouter.use('/admin', requireAuth, requireAdmin, adminRouter)` guards **the whole prefix**. Even an admin path that doesn't exist answers 401 or 403 before it can 404, so nothing about admin routes leaks.
- A typed `currentUser(res)` helper reads `res.locals.user` in controllers.
- **Alternative rejected:** a guard on each admin route. It's easy to forget one.

### 4. Linking Firebase accounts to app users
`services/users.resolveUser(identity)`:
1. Find the user by `firebaseUid`. This is the fast path after the first request.
2. Otherwise, `upsert` by lowercased email:
   - `update: { firebaseUid }` links a pre-created record, such as the demo accounts.
   - `create: { email, name, role: 'volunteer' }` makes a new volunteer.

Details:
- The name comes from the token's `name` claim, or else the part of the email before the @.
- Prisma runs this upsert shape as a single `INSERT … ON CONFLICT`, so two simultaneous first requests can't create two records.
- Roles **never** come from the token.
- **Alternative rejected:** roles as Firebase custom claims. Setting them needs a service account, changing them needs a token refresh, and there would be two sources of truth for roles.

### 5. `GET /api/me` and initials
- Returns `{ id, name, email, role, initials }`.
- `lib/initials.ts` on the server gives "Demo Volunteer" → "DV", "Tomás Silva" → "TS", and a single word → its first two letters. The roster in `admin-dashboard` reuses it, so the client never computes initials.

### 6. Client auth plumbing
- `lib/firebase.ts` initialises Firebase from the `VITE_FIREBASE_*` values. Its default persistence keeps users signed in across reloads.
- `AuthProvider` subscribes to `onIdTokenChanged` and exposes `status` (`loading`, `signed-out` or `signed-in`) and the Firebase user.
- `useMe()` fetches `GET /api/me` (TanStack Query key `['me', uid]`). It only runs when the user is signed in **and** `useServerReady()` is true.
- `apiFetch` adds `Authorization: Bearer <token>` using `auth.currentUser.getIdToken()`, which refreshes expiring tokens automatically.
- **Alternative rejected:** storing tokens in `localStorage` ourselves. The SDK already persists and refreshes them.

### 7. One-click demo login
- The buttons call `signInWithEmailAndPassword` with the fixed demo emails, which match the seed.
- The passwords come from `VITE_DEMO_VOLUNTEER_PASSWORD` and `VITE_DEMO_ADMIN_PASSWORD`. They're public by design and listed in the README, and keeping them in environment variables means changing them needs no code change.
- **Alternative rejected:** server-issued sign-in tokens. That needs a service account, and Firebase has no new-device check, so plain password sign-in works for shared accounts.

### 8. Forms and error messages
These are the app's first forms: React Hook Form with Zod.

Login error codes map to messages through a pure function, `authErrorMessage(code)`, which has unit tests:

| Firebase error code | Message |
|---|---|
| `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found` | "Email or password is incorrect." |
| `auth/too-many-requests` | "Too many attempts. Please wait a few minutes and try again." |
| anything else | a generic message |

Registration:
- It calls `createUserWithEmailAndPassword`, then `updateProfile({ displayName })`, then `getIdToken(true)`. That last step makes sure the first `/api/me` call already sees the name.
- `auth/email-already-in-use` becomes the email field error from the spec.

### 9. Protected pages
- `RequireAuth` shows a loading state while auth resolves. If the visitor is signed out, it redirects to `/login?next=<path>`.
- `RequireAdmin` shows "You don't have access to this page." unless `me.role === 'admin'`, and admin pages never request data for non-admins.
- `safeNextPath(next)` only accepts in-app paths: they must start with `/`, and must not start with `//` or contain `://`. That stops anyone from using `next` to redirect visitors to another site (an "open redirect"). It has unit tests.
- A signed-in visitor who opens `/login` is sent on to `next` straight away.

### 10. Role-aware header
- The right side of the header shows a "Log in" link for visitors. Signed-in users see a chip (initials avatar plus name) that opens a small menu with **Sign out**.
- Admins also get an "Admin" link in the main navigation.
- On phones, the chip and Sign out move into the expanded menu.
- Signing out calls `signOut(auth)`, clears the query cache so no previous user's data stays on screen, and goes to `/`.

### 11. Configuration
- Server: `FIREBASE_PROJECT_ID`, required. It's a plain value in `render.yaml`.
- Client: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_DEMO_VOLUNTEER_PASSWORD` and `VITE_DEMO_ADMIN_PASSWORD`. They go in `client/.env` locally and in Vercel's environment variables. Firebase's web config is public by design.
- Local development now needs a `client/.env`. The README gets updated to say so.

### 12. Testing
- **Server unit tests:** the token verifier, using a locally generated RSA key pair. A valid token passes. Each broken rule is rejected: wrong `aud`, wrong `iss`, expired, future `auth_time`, empty `sub`, unknown `kid`, and an algorithm other than RS256.
- **Server integration tests** (Supertest, with the fake verifier, on the `test` branch):
  - `/api/me`: 401 without a token, 401 with garbage.
  - The demo admin's first request links the seeded record and gets `admin`.
  - An unknown email creates a volunteer.
  - Two simultaneous first requests create exactly one record.
  - `/api/admin/*`: 401 for anonymous, 403 for a volunteer, 404 for an admin (no admin routes exist yet).
- **Client unit tests:** `authErrorMessage`, `safeNextPath`, and `apiFetch` sending the Bearer header.
- **Screens:** checked by hand at 1280px and 390px as visitor, volunteer and admin.

## Risks / Trade-offs

- [No revocation check] → A copied token works until it expires (at most one hour). That's acceptable for a demo, and the README says so.
- [Fetching Google's certificates after a cold start] → One extra HTTPS request on the first authenticated call, then cached for the `max-age`.
- [Reviewers can change the shared demo passwords through Firebase's REST API] → The nightly reset in `polish-and-readme` restores them. Until then, the owner can reset them in the Firebase console.
- [Email enumeration protection changes the error codes] → Map both the old and new codes, and fall back to a generic message.
- [Email-based linking without verified email] → The only unlinked records are the demo accounts and the fictional seed volunteers.
  - The demo accounts already exist in Firebase, so no one else can register those emails.
  - Registering a fictional `@example.org` email would only take over demo data, which the nightly re-seed deletes anyway.
- [Preview deployments] → Firebase's authorized domains and CORS only allow `localhost` and the production domain, so preview builds can't sign in. That's acceptable.

## Migration Plan

1. The owner creates the Firebase project, enables Email/Password, authorizes the production domain and creates the two demo users.
2. Add `FIREBASE_PROJECT_ID` to Render (a `render.yaml` value) and the five `VITE_` values to Vercel **before** pushing the code that needs them.
3. Push. Render and Vercel redeploy. Then confirm both demo buttons work on the live site.
4. **Rollback:** revert the commits. The schema doesn't change, and `firebase_uid` links can stay.

## Open Questions

- With email enumeration protection on, does sign-up still return `auth/email-already-in-use`? If not, the registration form falls back to the generic message. Only that one message would change.
