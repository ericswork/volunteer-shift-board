import { Router } from 'express';

// Admin endpoints arrive in admin-dashboard; routes/index.ts puts the whole router behind requireAdmin
export const adminRouter = Router();
