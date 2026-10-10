import { describe, expect, it } from 'vitest';
import { initials } from '../src/lib/initials.js';

describe('initials', () => {
  it.each([
    ['Demo Volunteer', 'DV'],
    ['Tomás Silva', 'TS'],
    ["Liam O'Connor", 'LO'],
    ['Mary Ann Smith', 'MS'],
    ['Cher', 'CH'],
    ['  maya   reyes ', 'MR'],
    ['', '?'],
  ])('%j → %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
