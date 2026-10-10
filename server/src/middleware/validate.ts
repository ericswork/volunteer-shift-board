import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { validationError, type ErrorDetail } from '../lib/errors.js';

type RequestSchemas = {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
};

// Parsed values go to res.locals because Express 5 makes req.query read-only
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, res, next) => {
    const details: ErrorDetail[] = [];

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (result.success) {
        res.locals[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (details.length > 0) return next(validationError(details));
    next();
  };
}
