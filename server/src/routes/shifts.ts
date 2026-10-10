import { Router } from 'express';
import { signUp } from '../controllers/signups.js';
import { requireAuth } from '../middleware/auth.js';

export const shiftsRouter = Router();

shiftsRouter.post('/:id/signup', requireAuth, signUp);
