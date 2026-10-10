import { Router } from 'express';
import { listAdminEvents } from '../controllers/admin.js';

// routes/index.ts puts this whole router behind requireAuth and requireAdmin
export const adminRouter = Router();

adminRouter.get('/events', listAdminEvents);
