import type { Request, Response } from 'express';
import * as adminService from '../services/admin.js';

export async function listAdminEvents(_req: Request, res: Response) {
  res.json(await adminService.listAdminEvents());
}
