import { createApp } from './app.js';
import { getEnv } from './config/env.js';

try {
  const env = getEnv();
  createApp().listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
