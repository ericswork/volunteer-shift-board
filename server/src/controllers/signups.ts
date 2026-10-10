import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import * as signupsService from '../services/signups.js';

export async function signUp(req: Request<{ id: string }>, res: Response) {
  const result = await signupsService.signUp(currentUser(res).id, req.params.id);
  res.status(201).json(result);
}
