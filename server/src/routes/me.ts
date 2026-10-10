import { Router } from 'express';
import { getMe } from '../controllers/me.js';
import { requireAuth } from '../middleware/auth.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, getMe);
