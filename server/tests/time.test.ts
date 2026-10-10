import { describe, expect, it } from 'vitest';
import { addDays, dateInZone, dayOfWeek, zonedTimeToUtc } from '../src/lib/time.js';

describe('calendar date helpers', () => {
  it('adds days across a month boundary', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-10-17', -24)).toBe('2026-09-23');
  });

  it('knows 2026-10-17 is a Saturday', () => {
    expect(dayOfWeek('2026-10-17')).toBe(6);
  });
});

describe('dateInZone', () => {
  it('uses the Manila calendar day, not the UTC one', () => {
    expect(dateInZone(new Date('2026-10-10T17:00:00Z'), 'Asia/Manila')).toBe('2026-10-11');
  });
});

describe('zonedTimeToUtc', () => {
  it('turns 9:00 AM in Manila into 01:00 UTC', () => {
    expect(zonedTimeToUtc('2026-10-17', '09:00', 'Asia/Manila').toISOString()).toBe(
      '2026-10-17T01:00:00.000Z',
    );
  });

  it('works for zones behind UTC', () => {
    expect(zonedTimeToUtc('2026-10-17', '09:00', 'America/New_York').toISOString()).toBe(
      '2026-10-17T13:00:00.000Z',
    );
  });
});
