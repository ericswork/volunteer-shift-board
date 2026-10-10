import { describe, expect, it } from 'vitest';
import { formatDate, formatTime } from '../src/lib/format';

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
