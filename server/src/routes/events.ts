import { Router } from 'express';
import { getEvent, listEvents } from '../controllers/events.js';
import { validate } from '../middleware/validate.js';
import { listEventsQuery } from '../schemas/events.js';

export const eventsRouter = Router();

eventsRouter.get('/', validate({ query: listEventsQuery }), listEvents);
eventsRouter.get('/:id', getEvent);
