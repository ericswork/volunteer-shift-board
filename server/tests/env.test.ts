import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@ep-x-pooler.ap-southeast-1.aws.neon.tech/db?sslmode=require',
  DIRECT_URL: 'postgresql://u:p@ep-x.ap-southeast-1.aws.neon.tech/db?sslmode=require',
  CLIENT_ORIGIN: 'http://localhost:5173',
  FIREBASE_PROJECT_ID: 'volunteer-shift-board',
};

describe('parseEnv', () => {
  it('applies defaults for optional variables', () => {
    expect(parseEnv(valid)).toMatchObject({ APP_TIMEZONE: 'Asia/Manila', PORT: 4000 });
  });

  it('names a missing required variable', () => {
    const { DATABASE_URL: _omitted, ...rest } = valid;
    expect(() => parseEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('requires the Firebase project id that tokens are checked against', () => {
    const { FIREBASE_PROJECT_ID: _omitted, ...rest } = valid;
    expect(() => parseEnv(rest)).toThrow(/FIREBASE_PROJECT_ID/);
    expect(() => parseEnv({ ...valid, FIREBASE_PROJECT_ID: '' })).toThrow(/FIREBASE_PROJECT_ID/);
  });

  it('rejects an unknown time zone', () => {
    expect(() => parseEnv({ ...valid, APP_TIMEZONE: 'Mars/Olympus' })).toThrow(/IANA time zone/);
  });
});
