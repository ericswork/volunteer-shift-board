import { z } from 'zod';
import { Cause } from '../generated/prisma/enums.js';

export const listEventsQuery = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => value || undefined)
    .optional(),
  cause: z.enum(Cause).optional(),
  when: z.enum(['next7', 'next30', 'all']).default('all'),
  openOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default(false),
});

export type ListEventsQuery = z.infer<typeof listEventsQuery>;
