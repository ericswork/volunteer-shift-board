import { Router } from 'express';
import { cancelSignup } from '../controllers/signups.js';
import { requireAuth } from '../middleware/auth.js';

export const signupsRouter = Router();

signupsRouter.delete('/:id', requireAuth, cancelSignup);
