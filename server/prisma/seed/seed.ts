import { getEnv } from '../../src/config/env.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { addDays, dateInZone, dayOfWeek, zonedTimeToUtc } from '../../src/lib/time.js';
import { DEMO_ADMIN, DEMO_VOLUNTEER, EVENTS, VOLUNTEER_NAMES, type SeedShift } from './data.js';

const SATURDAY = 6;
const SIGNUP_TIME = '10:00';

type ShiftSlot = { id: string; startsAt: Date; endsAt: Date; eventDate: string; plan: SeedShift };
type NewSignup = { userId: string; shiftId: string; createdAt: Date };

export function seedAnchorDate(seedDay: string): string {
  let date = addDays(seedDay, 7);
  while (dayOfWeek(date) !== SATURDAY) date = addDays(date, 1);
  return date;
}

export async function seed(
  db: PrismaClient,
  { now = new Date(), timeZone = getEnv().APP_TIMEZONE }: { now?: Date; timeZone?: string } = {},
) {
  const seedDay = dateInZone(now, timeZone);
  const anchorDate = seedAnchorDate(seedDay);
  const at = (date: string, time: string) => zonedTimeToUtc(date, time, timeZone);

  return db.$transaction(
    async (tx) => {
      await tx.event.deleteMany();
      await tx.user.deleteMany({ where: { seeded: true } });

      const demoVolunteer = await tx.user.upsert({
        where: { email: DEMO_VOLUNTEER.email },
        update: { name: DEMO_VOLUNTEER.name, role: 'volunteer' },
        create: { ...DEMO_VOLUNTEER, role: 'volunteer' },
      });
      await tx.user.upsert({
        where: { email: DEMO_ADMIN.email },
        update: { name: DEMO_ADMIN.name, role: 'admin' },
        create: { ...DEMO_ADMIN, role: 'admin' },
      });

      const volunteers = await tx.user.createManyAndReturn({
        data: VOLUNTEER_NAMES.map((name) => ({ name, email: emailFor(name), seeded: true })),
      });
      const volunteerIdByName = new Map(volunteers.map((v) => [v.name, v.id]));

      const slots: ShiftSlot[] = [];
      for (const event of EVENTS) {
        const date = addDays(anchorDate, event.dayOffset);
        const created = await tx.event.create({
          data: {
            title: event.title,
            cause: event.cause,
            date: new Date(date),
            location: event.location,
            description: event.description,
            shifts: {
              create: event.shifts.map((s) => ({
                name: s.name,
                startsAt: at(date, s.start),
                endsAt: at(date, s.end),
                capacity: s.capacity,
              })),
            },
          },
          include: { shifts: true },
        });
        for (const plan of event.shifts) {
          const shift = created.shifts.find((s) => s.name === plan.name)!;
          slots.push({ ...shift, eventDate: date, plan });
        }
      }

      const signups = planSignups(slots, {
        seedDay,
        demoVolunteerId: demoVolunteer.id,
        volunteerIds: volunteers.map((v) => v.id),
        volunteerIdByName,
        at,
      });
      await tx.signup.createMany({ data: signups });

      return { anchorDate, events: EVENTS.length, shifts: slots.length, signups: signups.length };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
}

// Fills each shift to its planned count without ever giving a volunteer two overlapping shifts
function planSignups(
  slots: ShiftSlot[],
  ctx: {
    seedDay: string;
    demoVolunteerId: string;
    volunteerIds: string[];
    volunteerIdByName: Map<string, string>;
    at: (date: string, time: string) => Date;
  },
): NewSignup[] {
  const signups: NewSignup[] = [];
  const held = new Map<string, ShiftSlot[]>();
  let cursor = 0;

  const isFree = (userId: string, slot: ShiftSlot) =>
    !(held.get(userId) ?? []).some((h) => h.startsAt < slot.endsAt && slot.startsAt < h.endsAt);

  const assign = (userId: string, slot: ShiftSlot, createdAt: Date) => {
    signups.push({ userId, shiftId: slot.id, createdAt });
    held.set(userId, [...(held.get(userId) ?? []), slot]);
  };

  for (const slot of slots) {
    // Sign-ups for past events happen before the event; for upcoming ones, before the seed day
    const signupBase = slot.eventDate < ctx.seedDay ? slot.eventDate : ctx.seedDay;
    let count = 0;

    if (slot.plan.demoVolunteer) {
      assign(ctx.demoVolunteerId, slot, ctx.at(addDays(signupBase, -2), SIGNUP_TIME));
      count++;
    }

    for (const [index, member] of (slot.plan.roster ?? []).entries()) {
      const day = addDays(ctx.seedDay, -member.daysBeforeSeed);
      const createdAt = new Date(ctx.at(day, SIGNUP_TIME).getTime() + index * 60_000);
      assign(ctx.volunteerIdByName.get(member.name)!, slot, createdAt);
      count++;
    }

    let attempts = 0;
    while (count < slot.plan.signedUp) {
      if (attempts++ >= ctx.volunteerIds.length) {
        throw new Error(`Not enough free volunteers to fill "${slot.plan.name}"`);
      }
      const userId = ctx.volunteerIds[cursor++ % ctx.volunteerIds.length]!;
      if (!isFree(userId, slot)) continue;

      const daysBefore = 1 + (cursor % 9);
      assign(userId, slot, ctx.at(addDays(signupBase, -daysBefore), SIGNUP_TIME));
      count++;
    }
  }

  return signups;
}

function emailFor(name: string) {
  const local = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.');
  return `${local}@example.org`;
}
