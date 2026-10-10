import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { adminRouter } from './admin.js';
import { eventsRouter } from './events.js';
import { healthRouter } from './health.js';
import { meRouter } from './me.js';
import { shiftsRouter } from './shifts.js';
import { signupsRouter } from './signups.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/me', meRouter);
apiRouter.use('/shifts', shiftsRouter);
apiRouter.use('/signups', signupsRouter);
// Guards the whole prefix, so even a missing admin route answers 401/403 before it can 404
apiRouter.use('/admin', requireAuth, requireAdmin, adminRouter);
