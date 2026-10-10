import { describe, expect, it } from 'vitest';
import { availability } from '../src/services/availability.js';

describe('availability', () => {
  it.each([
    [8, 6, 'filling', 2],
    [8, 4, 'open', 4],
    [4, 4, 'full', 0],
    [20, 14, 'open', 6],
    [30, 27, 'filling', 3],
    [16, 16, 'full', 0],
  ])('%i capacity with %i signed up is %s', (capacity, signedUp, status, spotsLeft) => {
    expect(availability(capacity, signedUp)).toEqual({ status, spotsLeft });
  });

  it('switches to filling at exactly 75% booked', () => {
    expect(availability(100, 74).status).toBe('open');
    expect(availability(100, 75).status).toBe('filling');
  });
});
