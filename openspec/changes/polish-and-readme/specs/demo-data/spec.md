# Spec Delta: demo-data

## ADDED Requirements

### Requirement: Nightly demo reset
A scheduled job SHALL rebuild the production demo data every day at 08:00 UTC, running the seed and resetting both demo accounts' passwords to the values published in the README. The owner SHALL also be able to start the job by hand.

#### Scenario: Reviewers changed the data
- **WHEN** reviewers have cancelled sign-ups and added shifts during the day
- **THEN** after the next 08:00 UTC run, the events, shifts and sign-ups match a fresh seed and the dates are relative to that day

#### Scenario: Demo password changed
- **WHEN** someone has changed the demo volunteer's password through the sign-in provider
- **THEN** after the next run, the documented password works again

#### Scenario: Manual run
- **WHEN** the owner starts the job from the GitHub Actions tab
- **THEN** production is re-seeded within a few minutes and the run shows success
