import type { RequestHandler, Response } from 'express';
import type { User } from '../generated/prisma/client.js';
import { unauthenticated } from '../lib/errors.js';
import type { TokenVerifier } from '../lib/firebase-token.js';
import * as usersService from '../services/users.js';

// A missing or invalid token leaves the request anonymous, so public endpoints ignore stale
// tokens; protected ones reject them through requireAuth
export function authenticate(verifyToken: TokenVerifier): RequestHandler {
  return async (req, res, next) => {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    if (!token) return next();

    const identity = await verifyToken(token);
    if (identity) res.locals.user = await usersService.resolveUser(identity);
    next();
  };
}

export const requireAuth: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) return next(unauthenticated());
  next();
};

export function currentUser(res: Response): User {
  const user = res.locals.user as User | undefined;
  if (!user) throw new Error('currentUser() needs requireAuth earlier in the route');
  return user;
}
