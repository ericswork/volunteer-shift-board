import { Router } from 'express';
import { eventsRouter } from './events.js';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/events', eventsRouter);
