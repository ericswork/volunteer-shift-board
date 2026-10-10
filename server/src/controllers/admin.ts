import type { Request, Response } from 'express';
import * as adminService from '../services/admin.js';

export async function listAdminEvents(_req: Request, res: Response) {
  res.json(await adminService.listAdminEvents());
}

export async function getRoster(req: Request<{ id: string }>, res: Response) {
  res.json(await adminService.getRoster(req.params.id));
}

export async function removeSignup(req: Request<{ id: string }>, res: Response) {
  await adminService.removeSignup(req.params.id);
  res.status(204).end();
}
