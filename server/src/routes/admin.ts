import { Router } from 'express';
import {
  createEvent,
  createShift,
  getRoster,
  listAdminEvents,
  removeSignup,
} from '../controllers/admin.js';
import { validate } from '../middleware/validate.js';
import { createEventBody, createShiftBody } from '../schemas/admin.js';

// routes/index.ts puts this whole router behind requireAuth and requireAdmin
export const adminRouter = Router();

adminRouter.get('/events', listAdminEvents);
adminRouter.post('/events', validate({ body: createEventBody }), createEvent);
adminRouter.get('/shifts/:id/roster', getRoster);
adminRouter.delete('/signups/:id', removeSignup);
adminRouter.post('/events/:id/shifts', validate({ body: createShiftBody }), createShift);
