import { prisma } from '../../src/db/client.js';
import { seed } from './seed.js';

try {
  const result = await seed(prisma);
  console.log(
    `Seeded ${result.events} events, ${result.shifts} shifts and ${result.signups} sign-ups. ` +
      `First upcoming event: ${result.anchorDate}.`,
  );
} finally {
  await prisma.$disconnect();
}
