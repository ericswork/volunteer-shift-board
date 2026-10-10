import { z } from 'zod';

export const mySignupsQuery = z.object({
  when: z.enum(['upcoming', 'past']).default('upcoming'),
});

export type MySignupsQuery = z.infer<typeof mySignupsQuery>;
