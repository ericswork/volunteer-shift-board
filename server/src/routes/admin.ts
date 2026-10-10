import { Router } from 'express';
import { getRoster, listAdminEvents, removeSignup } from '../controllers/admin.js';

// routes/index.ts puts this whole router behind requireAuth and requireAdmin
export const adminRouter = Router();

adminRouter.get('/events', listAdminEvents);
adminRouter.get('/shifts/:id/roster', getRoster);
adminRouter.delete('/signups/:id', removeSignup);
