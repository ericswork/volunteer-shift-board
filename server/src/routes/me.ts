import { Router } from 'express';
import { getMe } from '../controllers/me.js';
import { listMySignups } from '../controllers/signups.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mySignupsQuery } from '../schemas/signups.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, getMe);
meRouter.get('/signups', requireAuth, validate({ query: mySignupsQuery }), listMySignups);
