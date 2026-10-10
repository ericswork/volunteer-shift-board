import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/client.js';

let eventId: string;

const validShift = () => ({
  eventId,
  name: 'Constraint check',
  startsAt: new Date('2030-01-05T01:00:00Z'),
  endsAt: new Date('2030-01-05T02:30:00Z'),
  capacity: 5,
});

beforeAll(async () => {
  const event = await prisma.event.create({
    data: {
      title: 'Constraint test event',
      cause: 'food',
      date: new Date('2030-01-05'),
      location: 'Test hall',
      description: 'Created by db-constraints.test.ts',
    },
  });
  eventId = event.id;
});

afterAll(async () => {
  await prisma.event.delete({ where: { id: eventId } });
  await prisma.$disconnect();
});

describe('shift constraints', () => {
  it('accepts a valid shift', async () => {
    await expect(prisma.shift.create({ data: validShift() })).resolves.toMatchObject({
      capacity: 5,
    });
  });

  it('rejects a shift that ends before it starts', async () => {
    const backwards = { ...validShift(), endsAt: new Date('2030-01-05T00:30:00Z') };

    await expect(prisma.shift.create({ data: backwards })).rejects.toThrow(
      /shifts_ends_after_starts/,
    );
  });

  it('rejects a capacity of 0', async () => {
    const empty = { ...validShift(), capacity: 0 };

    await expect(prisma.shift.create({ data: empty })).rejects.toThrow(
      /shifts_capacity_positive/,
    );
  });
});
