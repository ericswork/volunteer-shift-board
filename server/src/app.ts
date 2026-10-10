import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

export type AppOptions = {
  clientOrigin: string;
};

const LOCAL_CLIENT_ORIGIN = 'http://localhost:5173';

export function createApp({ clientOrigin }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: [clientOrigin, LOCAL_CLIENT_ORIGIN] }));
  app.use(express.json());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
