import { z } from 'zod';

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
