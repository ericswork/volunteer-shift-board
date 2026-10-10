import { Router } from 'express';
import { createShift, getRoster, listAdminEvents, removeSignup } from '../controllers/admin.js';
import { validate } from '../middleware/validate.js';
import { createShiftBody } from '../schemas/admin.js';

// routes/index.ts puts this whole router behind requireAuth and requireAdmin
export const adminRouter = Router();

adminRouter.get('/events', listAdminEvents);
adminRouter.get('/shifts/:id/roster', getRoster);
adminRouter.delete('/signups/:id', removeSignup);
adminRouter.post('/events/:id/shifts', validate({ body: createShiftBody }), createShift);
