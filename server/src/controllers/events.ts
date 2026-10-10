import type { Request, Response } from 'express';
import { optionalUser } from '../middleware/auth.js';
import type { ListEventsQuery } from '../schemas/events.js';
import * as eventsService from '../services/events.js';

export async function listEvents(_req: Request, res: Response) {
  res.json(await eventsService.listEvents(res.locals.query as ListEventsQuery));
}

export async function getEvent(req: Request<{ id: string }>, res: Response) {
  res.json(await eventsService.getEvent(req.params.id, optionalUser(res)?.id));
}
