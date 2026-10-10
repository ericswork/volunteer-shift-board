# Spec Delta: demo-data

## Purpose

Gives reviewers a realistic data set (from `docs/design/tokens.md`) that always sits in the future, plus two ready-made accounts, and lets the owner rebuild it with one command.

## ADDED Requirements

### Requirement: Seeded events and shifts
Running the seed SHALL create the six events from tokens.md and the shifts listed in the scenarios below, so each event's totals and shift count match tokens.md and the admin mockup. Shifts that tokens.md doesn't list are invented to fit those totals.

#### Scenario: Shift breakdown (times in the app time zone; capacity / signed up)
- **WHEN** the seed has run
- **THEN** Saturday Food Pantry Packing has Sort donations 9:00–10:30 (8/6), Pack boxes 10:30–12:00 (8/4) and Load delivery vans 12:00–13:00 (4/4)
- **AND** Harbor Park Cleanup Day has Shoreline sweep 8:00–9:30 (15/14) and Trail litter pickup 9:30–11:00 (15/13)
- **AND** Weekend Reading Buddies has Early readers 10:00–11:00 (6/3) and Chapter book club 11:00–12:00 (6/1)
- **AND** Community Garden Planting has Bed prep and planting 9:30–11:00 (8/8) and Mulching and watering 11:00–12:30 (8/8)
- **AND** Senior Tech Help Desk has Tech help desk 14:00–16:00 (8/3)
- **AND** Shelter Dog Walking has Morning walkers 8:00–10:00 (6/5) and Kennel helpers 8:00–10:00 (4/3)

#### Scenario: Event totals match tokens.md
- **WHEN** the seed has run
- **THEN** event totals (signed up / capacity, shift count) are Food Pantry 14/20 (3), Harbor Park 27/30 (2), Reading Buddies 4/12 (2), Garden 16/16 (2), Senior Tech 3/8 (1) and Dog Walking 8/10 (2)
- **AND** each event has the cause, location and description from tokens.md and the mockups

### Requirement: Dates relative to the seed day
The seed SHALL date events relative to the day it runs, keeping each event's weekday. The Food Pantry event falls on the first Saturday at least 7 days after the seed day (call it D). The others fall on D+1, D+7, D+8, D+11 and D+14 in tokens.md order.

#### Scenario: Seeded on Saturday 2026-10-10
- **WHEN** the seed runs on 2026-10-10
- **THEN** the events fall on Oct 17, 18, 24, 25, 28 and 31, matching the mockups

#### Scenario: Seeded mid-week
- **WHEN** the seed runs on Wednesday 2026-10-14
- **THEN** the Food Pantry event falls on Saturday 2026-10-24 and Shelter Dog Walking on Saturday 2026-11-07

### Requirement: Demo accounts
The seed SHALL create "Demo Volunteer" (`demo.volunteer@example.com`, volunteer role) and "Demo Admin" (`demo.admin@example.com`, admin role). The Demo Volunteer SHALL be signed up for Pack boxes, Tech help desk and Morning walkers.

#### Scenario: Demo volunteer's upcoming shifts
- **WHEN** the seed has run
- **THEN** the Demo Volunteer has exactly three upcoming sign-ups: Pack boxes, Tech help desk and Morning walkers

### Requirement: Past history
The seed SHALL create two past events, each with one shift the Demo Volunteer attended: "Autumn Coat Drive Sorting" (Community, D−21, Sort and fold coats 10:00–12:00, 10/9) and "Library Book Sale Setup" (Education, D−24, Set up tables 17:00–19:00, 6/6).

#### Scenario: Past events stay out of browsing
- **WHEN** the seed has run
- **THEN** both past events are dated before the seed day and do not appear in the public events list

### Requirement: Realistic rosters
All other seeded sign-ups SHALL belong to fictional volunteers with distinct names and `example.org` emails who cannot log in. No volunteer SHALL hold two overlapping shifts or the same shift twice.

#### Scenario: Sort donations roster
- **WHEN** the seed runs on day S
- **THEN** the Sort donations roster is Maya Reyes, Daniel Kim, Priya Nair, Tomás Silva, Hannah Lee and Omar Haddad, signed up 7, 6, 6, 4, 3 and 1 days before S respectively

#### Scenario: No overlaps in seed data
- **WHEN** the seed has run
- **THEN** no user has two sign-ups whose shift times overlap

### Requirement: Re-runnable seed
Running the seed again SHALL replace all events, shifts, sign-ups and fictional volunteers with a fresh copy and SHALL NOT create duplicates. The demo accounts and self-registered accounts SHALL be kept, along with their links to the sign-in provider.

#### Scenario: Running the seed twice
- **WHEN** the seed runs twice in a row
- **THEN** the database holds exactly the same number of events, shifts, sign-ups and users as after the first run
