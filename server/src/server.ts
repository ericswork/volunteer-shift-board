import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { createFirebaseTokenVerifier } from './lib/firebase-token.js';

try {
  const env = getEnv();
  const verifyToken = createFirebaseTokenVerifier({ projectId: env.FIREBASE_PROJECT_ID });
  createApp({ clientOrigin: env.CLIENT_ORIGIN, verifyToken }).listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
