import type { Request, Response } from 'express';
import * as healthService from '../services/health.js';

export async function getHealth(_req: Request, res: Response) {
  await healthService.checkHealth();
  res.json({ status: 'ok' });
}
