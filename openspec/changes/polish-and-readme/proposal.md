# Proposal: Polish and README

## Why

Reviewers judge the project by its README and by a few minutes clicking around the live demo. Every reviewer shares the same two demo accounts, so by the second reviewer the data may be half-cancelled and the dates drifting toward the past. The last change makes the demo self-healing and the write-up complete.

## What Changes

- Add a nightly GitHub Actions job (also runnable by hand) that re-seeds production and resets both demo passwords. *Stretch: drop it if time runs out and re-seed by hand before sending the application.*
- Run an accessibility pass (axe DevTools and Lighthouse on all four screens), fix what it finds, and record the scores.
- Sweep every screen for missing loading, empty, error and toast states against the specs.
- Complete the README:
  - screenshots,
  - an architecture overview diagram,
  - API docs,
  - "Frontend highlights" and "Backend highlights",
  - setup steps and demo logins,
  - "Decisions I made and why",
  - free-tier notes (dated 2026-10-10),
  - known limitations.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `demo-data`: adds a scheduled, hands-off reset of the production demo data and the demo account passwords.

## Impact

- New file: `.github/workflows/reset-demo.yml`.
- New GitHub repository secrets (owner): the production `DIRECT_URL` and a Firebase service-account key, used only by the reset job.
- `README.md` rewritten, and screenshots added under `docs/screenshots/`.
- Small UI fixes from the accessibility pass. No API or schema changes.
