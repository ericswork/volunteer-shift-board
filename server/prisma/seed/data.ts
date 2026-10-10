import type { Cause } from '../../src/generated/prisma/client.js';

export type SeedShift = {
  name: string;
  start: string;
  end: string;
  capacity: number;
  // Includes the demo volunteer and any named roster members
  signedUp: number;
  demoVolunteer?: boolean;
  roster?: { name: string; daysBeforeSeed: number }[];
};

export type SeedEvent = {
  title: string;
  cause: Cause;
  // Days from the anchor date: the first Saturday at least 7 days after the seed day
  dayOffset: number;
  location: string;
  description: string;
  shifts: SeedShift[];
};

export const DEMO_VOLUNTEER = { name: 'Demo Volunteer', email: 'demo.volunteer@example.com' };
export const DEMO_ADMIN = { name: 'Demo Admin', email: 'demo.admin@example.com' };

export const VOLUNTEER_NAMES = [
  'Maya Reyes',
  'Daniel Kim',
  'Priya Nair',
  'Tomás Silva',
  'Hannah Lee',
  'Omar Haddad',
  'Grace Santos',
  'Miguel Cruz',
  'Aisha Bello',
  "Liam O'Connor",
  'Sofia Rossi',
  'Kenji Tanaka',
  'Fatima Khan',
  'Noah Williams',
  'Isabel Garcia',
  'Ethan Brooks',
  'Mei Chen',
  'Jonah Rivera',
  'Chloe Martin',
  'Arjun Patel',
  'Lucia Fernandez',
  'Samuel Okafor',
  'Nina Petrova',
  'Marco Bautista',
];

export const EVENTS: SeedEvent[] = [
  {
    title: 'Saturday Food Pantry Packing',
    cause: 'food',
    dayOffset: 0,
    location: 'Riverside Community Hall',
    description:
      'Help sort donated groceries and pack weekly boxes for local families. No experience needed. A short walkthrough happens at the start of every shift.',
    shifts: [
      {
        name: 'Sort donations',
        start: '09:00',
        end: '10:30',
        capacity: 8,
        signedUp: 6,
        roster: [
          { name: 'Maya Reyes', daysBeforeSeed: 7 },
          { name: 'Daniel Kim', daysBeforeSeed: 6 },
          { name: 'Priya Nair', daysBeforeSeed: 6 },
          { name: 'Tomás Silva', daysBeforeSeed: 4 },
          { name: 'Hannah Lee', daysBeforeSeed: 3 },
          { name: 'Omar Haddad', daysBeforeSeed: 1 },
        ],
      },
      { name: 'Pack boxes', start: '10:30', end: '12:00', capacity: 8, signedUp: 4, demoVolunteer: true },
      { name: 'Load delivery vans', start: '12:00', end: '13:00', capacity: 4, signedUp: 4 },
    ],
  },
  {
    title: 'Harbor Park Cleanup Day',
    cause: 'environment',
    dayOffset: 1,
    location: 'Harbor Park, North Gate',
    description:
      'Pick up litter along the shoreline and park trails before the weekend crowds arrive. Gloves, bags and grabbers are provided.',
    shifts: [
      { name: 'Shoreline sweep', start: '08:00', end: '09:30', capacity: 15, signedUp: 14 },
      { name: 'Trail litter pickup', start: '09:30', end: '11:00', capacity: 15, signedUp: 13 },
    ],
  },
  {
    title: 'Weekend Reading Buddies',
    cause: 'education',
    dayOffset: 7,
    location: 'Eastside Public Library',
    description:
      "Read one-on-one with young readers during the library's Saturday story hour. Patience matters more than a perfect reading voice.",
    shifts: [
      { name: 'Early readers', start: '10:00', end: '11:00', capacity: 6, signedUp: 3 },
      { name: 'Chapter book club', start: '11:00', end: '12:00', capacity: 6, signedUp: 1 },
    ],
  },
  {
    title: 'Community Garden Planting',
    cause: 'community',
    dayOffset: 8,
    location: 'Maple Street Garden',
    description:
      'Prepare raised beds and plant seasonal vegetables with neighbors. Tools are provided; wear clothes that can get muddy.',
    shifts: [
      { name: 'Bed prep and planting', start: '09:30', end: '11:00', capacity: 8, signedUp: 8 },
      { name: 'Mulching and watering', start: '11:00', end: '12:30', capacity: 8, signedUp: 8 },
    ],
  },
  {
    title: 'Senior Tech Help Desk',
    cause: 'seniors',
    dayOffset: 11,
    location: 'Sunrise Senior Center',
    description:
      'Help older adults with phones, tablets and video calls. Friendly patience matters more than technical skills.',
    shifts: [
      { name: 'Tech help desk', start: '14:00', end: '16:00', capacity: 8, signedUp: 3, demoVolunteer: true },
    ],
  },
  {
    title: 'Shelter Dog Walking',
    cause: 'animals',
    dayOffset: 14,
    location: 'Second Chance Animal Shelter',
    description:
      "Walk and socialize shelter dogs so they're calmer and more adoptable. Staff will pair you with a dog that matches your experience.",
    shifts: [
      { name: 'Morning walkers', start: '08:00', end: '10:00', capacity: 6, signedUp: 5, demoVolunteer: true },
      { name: 'Kennel helpers', start: '08:00', end: '10:00', capacity: 4, signedUp: 3 },
    ],
  },
  {
    title: 'Autumn Coat Drive Sorting',
    cause: 'community',
    dayOffset: -21,
    location: 'Riverside Community Hall',
    description: 'Sort and fold donated coats by size before they go out to families.',
    shifts: [
      { name: 'Sort and fold coats', start: '10:00', end: '12:00', capacity: 10, signedUp: 9, demoVolunteer: true },
    ],
  },
  {
    title: 'Library Book Sale Setup',
    cause: 'education',
    dayOffset: -24,
    location: 'Eastside Public Library',
    description: "Set up tables and sort donated books for the library's fundraiser sale.",
    shifts: [
      { name: 'Set up tables', start: '17:00', end: '19:00', capacity: 6, signedUp: 6, demoVolunteer: true },
    ],
  },
];
