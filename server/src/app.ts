import cors from 'cors';
import express from 'express';
import type { TokenVerifier } from './lib/firebase-token.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { apiRouter } from './routes/index.js';

export type AppOptions = {
  clientOrigin: string;
  verifyToken: TokenVerifier;
};

const LOCAL_CLIENT_ORIGIN = 'http://localhost:5173';

export function createApp({ clientOrigin, verifyToken }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: [clientOrigin, LOCAL_CLIENT_ORIGIN] }));
  app.use(express.json());

  app.use('/api', authenticate(verifyToken), apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
