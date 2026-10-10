# Tasks: Auth and roles

Each numbered group is one commit. The owner reviews it before the next group starts. Group 1 is setup only and produces no commit.

## 1. Owner setup

- [x] 1.1 (owner) Create the Firebase project with Email/Password sign-in enabled, add `lauritzkeans-volunteer-shift-board.vercel.app` to Authentication → Settings → Authorized domains, and add the users `demo.volunteer@example.com` and `demo.admin@example.com`; verify both appear under Authentication → Users
- [x] 1.2 (owner) Register a Web app in Project settings and share the `apiKey`, `authDomain` and `projectId` values (public by design) plus the two demo passwords; verify the values are recorded in `client/.env` and the server `.env` files once groups 2 and 5 add the keys

## 2. Token verification (server)

- [x] 2.1 Install `jose` and add `lib/firebase-token.ts` with `createFirebaseTokenVerifier({ projectId, getCertificates })`, which caches certificates by `Cache-Control: max-age`; verify unit tests with a locally generated key pair: a valid token returns `uid`, `email` and `name`, and a wrong `aud`, wrong `iss`, expired token, future `auth_time`, empty `sub`, unknown `kid` or non-RS256 algorithm is rejected
- [x] 2.2 Add required `FIREBASE_PROJECT_ID` to the env schema, `server/.env.example`, the local `.env` files and `render.yaml`; verify the env unit tests cover the new variable and the server refuses to start without it

## 3. Current user (server)

- [x] 3.1 Make `createApp` take `verifyToken`, add the `authenticate` and `requireAuth` middleware and a `currentUser(res)` helper, and pass the real verifier in `server.ts`; verify with Supertest that `GET /api/me` without a header, and with an unverifiable token, returns `401 UNAUTHENTICATED`
- [x] 3.2 Add `lib/initials.ts`, the users data functions, `services/users.resolveUser` (find by uid, else upsert by lowercased email) and `GET /api/me`; verify tests: the demo admin's first request links the seeded record (role `admin`, initials `DA`) and the second finds it by uid; an unknown email creates a volunteer; two simultaneous first requests leave exactly one record; initials for "Demo Volunteer", "Tomás Silva" and a single-word name

## 4. Admin guard (server)

- [x] 4.1 Mount an `/api/admin` router behind `requireAuth` and `requireAdmin`; verify with Supertest that `POST /api/admin/events` returns 401 for anonymous requests and `403 FORBIDDEN` for the demo volunteer (with no row created), and `404 NOT_FOUND` for the demo admin while no admin routes exist

## 5. Client auth plumbing

- [x] 5.1 Install `firebase`; add `lib/firebase.ts`, the `VITE_FIREBASE_*` and `VITE_DEMO_*` keys in `client/.env.example`, `AuthProvider` (via `onIdTokenChanged`) and `useMe()` (enabled only when signed in and the server is ready); make `apiFetch` attach the Bearer token; verify unit tests that `apiFetch` sends `Authorization: Bearer <token>` when signed in and no header when signed out

## 6. Login and protected pages

- [ ] 6.1 Add React Hook Form and Zod, the `/login` page (email, password, "Continue as demo volunteer", "Continue as demo admin", link to register) and `authErrorMessage(code)`; verify unit tests for the error mapping, and by hand that a wrong password shows "Email or password is incorrect." and each demo button signs in to the right role
- [ ] 6.2 Add the `RequireAuth` and `RequireAdmin` route wrappers and `safeNextPath`; verify unit tests that `safeNextPath` accepts `/my-shifts` and rejects `//evil.example`, `https://evil.example` and `javascript:alert(1)`, and by hand that `/my-shifts` while signed out goes to `/login` and back after sign-in, and that the demo volunteer on `/admin` sees "You don't have access to this page."

## 7. Role-aware header

- [ ] 7.1 Add the "Log in" link, the user chip menu with "Sign out" (clearing the query cache), the admin-only "Admin" link and the phone-menu versions; verify by hand at 1280px and 390px as visitor, demo volunteer and demo admin, and that signing out returns to `/` showing "Log in"

## 8. Registration (cut first if behind schedule)

- [ ] 8.1 Add the `/register` page (name, email, password of 8+ characters) using `createUserWithEmailAndPassword`, `updateProfile` and a forced token refresh, with the email-in-use field error; verify by hand that a new account lands signed in as a volunteer showing its initials, and that reusing an email shows "An account with this email already exists."

## 9. Deploy and verify

- [ ] 9.1 (owner) Add the five `VITE_` variables in Vercel and confirm `FIREBASE_PROJECT_ID` reached the Render service before pushing; verify both appear in each dashboard
- [ ] 9.2 Push and verify on the live URLs: both demo buttons sign in, the Admin link shows only for the demo admin, and `curl` on `/api/me` without a token returns 401
- [ ] 9.3 Add a "Demo logins" section to the README (emails, passwords, what each role can do) and update the local setup steps for `client/.env`; verify the documented credentials sign in on the live site

## Workflow follow-up

- Owner reviews the live deploy, then archive with `/opsx:archive auth-and-roles`.
