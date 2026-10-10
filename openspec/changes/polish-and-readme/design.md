# Design: Polish and README

## Context

By this change, every feature is live. What's left:
- the shared demo data drifts as reviewers use it;
- accessibility hasn't been measured;
- the README has grown section by section (browse-events added "API", auth-and-roles "Demo logins", shift-signups "How sign-ups stay correct") and needs one coherent pass.

Facts that shape the reset job:
- The seed (`npm run db:seed`) reads the full env schema, so it needs `DATABASE_URL`, `DIRECT_URL`, `CLIENT_ORIGIN` and `FIREBASE_PROJECT_ID`.
- The seed already keeps the demo accounts, their Firebase links and self-registered users. It only replaces events, shifts, sign-ups and the fictional volunteers.
- Changing a Firebase user's password from a script needs the Admin SDK with a service account. `auth-and-roles` deliberately kept that key off Render.

## Goals / Non-Goals

**Goals:**
- The demo heals itself every day without the owner.
- Measured accessibility results, with every serious issue fixed.
- A README a reviewer can skim in two minutes and trust in ten.

**Non-Goals:**
- Monitoring or alerting. A failed run shows in the GitHub Actions tab.
- Resetting self-registered accounts.

## Decisions

### 1. The reset runs in GitHub Actions
- `.github/workflows/reset-demo.yml` runs on `schedule: '0 8 * * *'` and `workflow_dispatch` (the manual button).
- It installs the server's dependencies, runs the seed against production, then runs `scripts/reset-demo-passwords.mjs`.
- **Alternatives rejected:**
  - A Render cron job: Render's cron jobs are paid.
  - Resetting a Neon branch from a snapshot: it would also roll back the schema and wipe self-registered users, and it needs the Neon API.

### 2. `firebase-admin` exists only inside the job
- The job runs `npm install --no-save firebase-admin@<pinned version>` before the password script. The script finds each demo user by email and calls `updateUser(uid, { password })`.
- The service-account key lives only in a GitHub secret, never on Render and never in the repo.
- **Alternatives rejected:**
  - Adding `firebase-admin` to the server's dependencies: Render installs dev dependencies on every build, so a large package would be installed for a script that never runs there.
  - Calling the Identity Toolkit REST API with an OAuth token: no extra package, but it's more steps to explain than three Admin SDK calls.

### 3. One production connection string for the job
- The job sets both `DATABASE_URL` and `DIRECT_URL` from one secret holding Neon's **direct** connection string. A short batch job has no need for the pooler.
- `CLIENT_ORIGIN` and `FIREBASE_PROJECT_ID` are plain values in the workflow file, because the env schema requires them even though the seed doesn't use them.
- The demo passwords are repository **variables**, not secrets. They're public by design and published in the README.

### 4. Accessibility is measured with tools, including signed-in screens
- **axe-core:** the same Chrome DevTools-protocol scripts used for UI checks inject `axe-core` (from `node_modules`, never a CDN) into each screen, signed in where needed, and fail on any `serious` or `critical` violation.
- **Lighthouse:** the CLI runs against that same signed-in Chrome (`--port`) for the scores recorded in the README.
- **Alternative rejected:** axe DevTools by hand. It isn't repeatable, and it's easy to skip a screen.

### 5. README format
- The architecture diagram is Mermaid. GitHub renders it, it diffs as text, and it can't go stale the way an exported image does.
- Screenshots are captured by script at 1280px and 390px into `docs/screenshots/`, so they can be retaken after any UI change.
- "Decisions I made and why" summarizes the design docs' rejected alternatives and links to them, rather than repeating them.

## Risks / Trade-offs

- [A service-account key is a long-lived credential] → It sits only in GitHub secrets and is used only by this job. Workload Identity Federation would remove the key, but it needs Google Cloud IAM setup that doesn't fit the deadline. The README names it as the next step.
- [A reset during a review] → The seed runs in one transaction, so a reviewer sees either the old data or the new data. At 08:00 UTC (4 PM in Manila) the risk is accepted.
- [Cut if behind] → The nightly reset is the third cut. Group 1 can be dropped entirely; the owner then re-seeds by hand (`ENV_FILE=.env.production npm run db:seed`) right before sending the application.

## Migration Plan

1. The owner adds the GitHub secrets and variables (task 1.1).
2. Push. Start the workflow by hand once and confirm it succeeds.
3. **Rollback:** disable the workflow in the Actions tab. Nothing else depends on it.
