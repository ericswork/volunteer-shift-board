import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventFormSchema, shiftFormSchema } from '../src/lib/admin-forms';

const valid = { name: 'Greet and check in', startTime: '08:30', endTime: '09:00', capacity: 2 };

type Schema = typeof shiftFormSchema | typeof eventFormSchema;

function errorsFor(input: Record<string, unknown>, schema: Schema = shiftFormSchema) {
  const result = schema.safeParse(input);
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

describe('eventFormSchema', () => {
  const event = {
    title: 'Riverside Book Swap',
    cause: 'education',
    date: '2026-10-11',
    location: 'Riverside Community Hall',
    description: 'Bring a book, take a book.',
  };
  const eventErrors = (changes: Record<string, unknown>) => errorsFor({ ...event, ...changes }, eventFormSchema);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 4:00 AM on Oct 11 in Manila, while the Los Angeles test zone is still on Oct 10
    vi.setSystemTime(new Date('2026-10-10T20:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts an event dated today in Manila', () => {
    expect(eventFormSchema.safeParse(event).success).toBe(true);
  });

  it('rejects yesterday in Manila', () => {
    expect(eventErrors({ date: '2026-10-10' })).toEqual({ date: 'Pick today or a later date.' });
  });

  it('asks for a date when it is missing or not a real date', () => {
    expect(eventErrors({ date: '' })).toEqual({ date: 'Enter a date.' });
    expect(eventErrors({ date: '2026-02-30' })).toEqual({ date: 'Enter a date.' });
  });

  it('asks for one of the six causes', () => {
    expect(eventErrors({ cause: '' })).toEqual({ cause: 'Choose a cause.' });
    expect(eventErrors({ cause: 'sports' })).toEqual({ cause: 'Choose a cause.' });
  });

  it('keeps the title and location between 3 and 100 characters', () => {
    expect(eventErrors({ title: 'ab', location: 'x'.repeat(101) })).toEqual({
      title: 'Use 3 to 100 characters.',
      location: 'Use 3 to 100 characters.',
    });
    expect(eventFormSchema.safeParse({ ...event, title: 'abc', location: 'x'.repeat(100) }).success).toBe(true);
  });

  it('needs a description of up to 1,000 characters', () => {
    expect(eventErrors({ description: '  ' })).toEqual({ description: 'Enter a description.' });
    expect(eventErrors({ description: 'x'.repeat(1001) })).toEqual({ description: 'Use 1,000 characters or fewer.' });
  });
});
