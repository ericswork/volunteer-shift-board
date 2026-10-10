import type { Request, Response } from 'express';
import { initials } from '../lib/initials.js';
import { currentUser } from '../middleware/auth.js';

export function getMe(_req: Request, res: Response) {
  const { id, name, email, role } = currentUser(res);
  res.json({ id, name, email, role, initials: initials(name) });
}
