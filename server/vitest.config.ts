import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

// Tests always run against the Neon test branch, never the dev branch in .env
const testEnv = existsSync('.env.test') ? parseEnv(readFileSync('.env.test', 'utf8')) : {};

export default defineConfig({
  test: {
    env: testEnv,
    // Test files share one database (and the seed test wipes events), so run them one at a time
    fileParallelism: false,
  },
});
