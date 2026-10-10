import { describe, expect, it } from 'vitest';
import { canCancel } from '../src/services/cancellation.js';

const now = new Date('2026-10-15T00:00:00Z');
const hoursFromNow = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000);

describe('canCancel', () => {
  it.each([
    [25, true],
    [24, false],
    [23, false],
  ])('a shift starting in %i hours can be cancelled: %s', (hours, expected) => {
    expect(canCancel(hoursFromNow(hours), now)).toBe(expected);
  });
});
