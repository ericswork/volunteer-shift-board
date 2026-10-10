import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, formatTimeRange, spotsLabel } from '../src/lib/format';

// Sort donations in the seed: 9:00 AM on Saturday 2026-10-17 in Manila
const sortDonationsStart = '2026-10-17T01:00:00.000Z';

describe('formatDate', () => {
  it('prints an instant as its Manila calendar day', () => {
    expect(formatDate(sortDonationsStart)).toBe('Sat, Oct 17');
  });

  it('prints a calendar date without shifting the day', () => {
    expect(formatDate('2026-10-17')).toBe('Sat, Oct 17');
  });
});

describe('formatTime', () => {
  it('prints Manila wall-clock time', () => {
    expect(formatTime(sortDonationsStart)).toBe('9:00 AM');
  });

  it('prints afternoon times with PM', () => {
    expect(formatTime('2026-10-28T06:00:00.000Z')).toBe('2:00 PM');
  });
});

describe('formatTimeRange', () => {
  it.each([
    ['8:00 – 11:00 AM', 'Harbor Park Cleanup Day', '2026-10-18T00:00:00.000Z', '2026-10-18T03:00:00.000Z'],
    ['10:30 AM – 12:00 PM', 'Pack boxes', '2026-10-17T02:30:00.000Z', '2026-10-17T04:00:00.000Z'],
    ['12:00 – 1:00 PM', 'Load delivery vans', '2026-10-17T04:00:00.000Z', '2026-10-17T05:00:00.000Z'],
  ])('prints "%s" for %s', (expected, _name, startsAt, endsAt) => {
    expect(formatTimeRange(startsAt, endsAt)).toBe(expected);
  });
});

describe('spotsLabel', () => {
  it('counts the spots left', () => {
    expect(spotsLabel({ capacity: 20, signedUpCount: 14, spotsLeft: 6 })).toBe('6 of 20 spots left');
  });

  it('counts the spots taken when full', () => {
    expect(spotsLabel({ capacity: 16, signedUpCount: 16, spotsLeft: 0 })).toBe('Full · 16 of 16 taken');
  });
});
