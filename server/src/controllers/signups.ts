import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import type { MySignupsQuery } from '../schemas/signups.js';
import * as signupsService from '../services/signups.js';

export async function signUp(req: Request<{ id: string }>, res: Response) {
  const result = await signupsService.signUp(currentUser(res).id, req.params.id);
  res.status(201).json(result);
}

export async function cancelSignup(req: Request<{ id: string }>, res: Response) {
  await signupsService.cancelSignup(currentUser(res).id, req.params.id);
  res.status(204).end();
}

export async function listMySignups(_req: Request, res: Response) {
  const { when } = res.locals.query as MySignupsQuery;
  res.json(await signupsService.listMySignups(currentUser(res).id, when));
}
