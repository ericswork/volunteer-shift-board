import { describe, expect, it } from 'vitest';
import { shiftFormSchema } from '../src/lib/admin-forms';

const valid = { name: 'Greet and check in', startTime: '08:30', endTime: '09:00', capacity: 2 };

function errorsFor(input: Record<string, unknown>) {
  const result = shiftFormSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('shiftFormSchema', () => {
  it('accepts the spec example', () => {
    expect(shiftFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['before', '09:30'],
    ['equal to', '10:30'],
  ])('rejects an end time %s the start time', (_, endTime) => {
    expect(errorsFor({ ...valid, startTime: '10:30', endTime })).toEqual({
      endTime: 'End time must be after the start time.',
    });
  });

  it('still checks the times while other fields are empty, as when the user leaves End', () => {
    // valueAsNumber turns an empty capacity input into NaN
    expect(errorsFor({ name: '', startTime: '10:30', endTime: '09:30', capacity: NaN })).toEqual({
      name: 'Enter a shift name.',
      endTime: 'End time must be after the start time.',
      capacity: 'Enter a whole number from 1 to 200.',
    });
  });

  it.each([0, 201, 2.5, NaN])('rejects capacity %s', (capacity) => {
    expect(errorsFor({ ...valid, capacity })).toEqual({ capacity: 'Enter a whole number from 1 to 200.' });
  });

  it.each([1, 200])('accepts capacity %s', (capacity) => {
    expect(shiftFormSchema.safeParse({ ...valid, capacity }).success).toBe(true);
  });

  it('requires a name that is not just spaces, up to 80 characters', () => {
    expect(errorsFor({ ...valid, name: '   ' })).toEqual({ name: 'Enter a shift name.' });
    expect(errorsFor({ ...valid, name: 'a'.repeat(81) })).toEqual({ name: 'Use 80 characters or fewer.' });
    expect(shiftFormSchema.safeParse({ ...valid, name: 'a'.repeat(80) }).success).toBe(true);
  });

  it('asks for both times when they are missing', () => {
    expect(errorsFor({ ...valid, startTime: '', endTime: '' })).toEqual({
      startTime: 'Enter a start time.',
      endTime: 'Enter an end time.',
    });
  });
});
