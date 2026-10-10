import { z } from 'zod';
import { Cause } from '../generated/prisma/enums.js';
import { appToday } from '../lib/time.js';

// The client's lib/admin-forms.ts copies these rules and messages, so errors read the same
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const CAPACITY_MESSAGE = 'Enter a whole number from 1 to 200.';

export const createShiftBody = z
  .object({
    name: z.string().trim().min(1, 'Enter a shift name.').max(80, 'Use 80 characters or fewer.'),
    startTime: z.string().regex(TIME, 'Enter a start time.'),
    endTime: z.string().regex(TIME, 'Enter an end time.'),
    capacity: z
      .int({ error: CAPACITY_MESSAGE })
      .min(1, CAPACITY_MESSAGE)
      .max(200, CAPACITY_MESSAGE),
  })
  // Both times are on the event's date, so comparing "HH:mm" text is enough
  .refine((body) => body.endTime > body.startTime, {
    path: ['endTime'],
    message: 'End time must be after the start time.',
  });

export type CreateShiftBody = z.infer<typeof createShiftBody>;

const lengthMessage = (min: number, max: number) => `Use ${min} to ${max} characters.`;

export const createEventBody = z.object({
  title: z.string().trim().min(3, lengthMessage(3, 100)).max(100, lengthMessage(3, 100)),
  cause: z.enum(Cause, { error: 'Choose a cause.' }),
  // pipe() runs the second check only on a real date; YYYY-MM-DD text compares in date order
  date: z.iso
    .date({ error: 'Enter a date.' })
    .pipe(z.string().refine((date) => date >= appToday(), 'Pick today or a later date.')),
  location: z.string().trim().min(3, lengthMessage(3, 100)).max(100, lengthMessage(3, 100)),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description.')
    .max(1000, 'Use 1,000 characters or fewer.'),
});

export type CreateEventBody = z.infer<typeof createEventBody>;
