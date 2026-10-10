# Tasks: Polish and README

Each numbered group is one commit. The owner reviews it before the next group starts. Group 1 (the nightly reset) is the third cut if behind schedule.

## 1. Nightly demo reset (third cut if behind)

- [x] 1.1 (owner) Generate a Firebase service-account key (Project settings → Service accounts) and add the repository secrets `PROD_DIRECT_URL` (Neon production direct connection string) and `FIREBASE_SERVICE_ACCOUNT` (the key JSON), plus the repository variables `DEMO_VOLUNTEER_PASSWORD` and `DEMO_ADMIN_PASSWORD`; verify all four appear under Settings → Secrets and variables → Actions
- [ ] 1.2 Add `scripts/reset-demo-passwords.mjs` and `.github/workflows/reset-demo.yml` (08:00 UTC schedule and manual run: install server dependencies, seed production, install the pinned `firebase-admin` without saving it, reset both passwords); verify after the push by starting the workflow by hand: the run succeeds, the live list shows freshly dated events, and both demo buttons sign in

## 2. Accessibility pass

- [x] 2.1 Add `axe-core` as a client dev dependency and a scripted check that runs it on the events list, event detail, My shifts and Admin screens (signed in as needed), then run Lighthouse on the same screens; fix every `serious` and `critical` finding; verify axe reports none on all four screens and Lighthouse accessibility is at least 95 on each, and record the scores

## 3. State sweep

- [x] 3.1 Check every loading, empty, error and toast scenario in the specs on all four screens (slow responses, a forced `500`, empty data, each `409`) and fix any gap; verify with a browser script that reaches each state and checks its text

## 4. README

- [x] 4.1 Capture screenshots of the four screens at 1280px and 390px into `docs/screenshots/` with a script; verify every file exists and opens
- [x] 4.2 Rewrite the README: overview with live links and demo logins, screenshots, a Mermaid architecture diagram, the full API reference (every endpoint with parameters, status codes and error codes), "Frontend highlights", "Backend highlights", setup steps, "Decisions I made and why" (linking the design docs), accessibility results, free-tier notes dated 2026-10-10, and known limitations; verify every relative link and image path resolves, and every `curl` example works against the live API

## 5. Deploy and verify

- [ ] 5.1 Push to `main` and verify: the README renders on GitHub with its diagram and screenshots, and a full pass on the live site as visitor, demo volunteer and demo admin works; then reset the demo data (workflow or by hand) right before sending the application

## Workflow follow-up

- Owner reviews the final deploy, then archive with `/opsx:archive polish-and-readme`.
