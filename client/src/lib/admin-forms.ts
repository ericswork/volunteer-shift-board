import { z } from 'zod';

// Copies of the server's schemas/admin.ts rules and messages, so errors show before submitting.
// The server stays the authority.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const CAPACITY_MESSAGE = 'Enter a whole number from 1 to 200.';

const shiftFields = z.object({
  name: z.string().trim().min(1, 'Enter a shift name.').max(80, 'Use 80 characters or fewer.'),
  startTime: z.string().regex(TIME, 'Enter a start time.'),
  endTime: z.string().regex(TIME, 'Enter an end time.'),
  capacity: z.int({ error: CAPACITY_MESSAGE }).min(1, CAPACITY_MESSAGE).max(200, CAPACITY_MESSAGE),
});

const shiftTimes = shiftFields.pick({ startTime: true, endTime: true });

export const shiftFormSchema = shiftFields.refine((shift) => shift.endTime > shift.startTime, {
  path: ['endTime'],
  message: 'End time must be after the start time.',
  // Zod skips a refine while any field is invalid, and Capacity (below End) is usually still
  // empty when the user leaves End, so run it whenever both times are valid
  when: (payload) => shiftTimes.safeParse(payload.value).success,
});

export type ShiftForm = z.infer<typeof shiftFormSchema>;
