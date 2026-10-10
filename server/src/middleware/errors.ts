import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, notFound } from '../lib/errors.js';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(notFound());
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);

  const appError = toAppError(err);
  res.status(appError.status).json({
    error: { code: appError.code, message: appError.message, details: appError.details },
  });
};

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  // Errors thrown by express.json() (bad JSON, body too large) are the client's fault
  if (isExposedHttpError(err)) {
    const message =
      err.type === 'entity.parse.failed' ? 'The request body is not valid JSON.' : err.message;
    return new AppError(err.status, 'BAD_REQUEST', message);
  }

  console.error(err);
  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
}

function isExposedHttpError(
  err: unknown,
): err is { status: number; message: string; type?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'expose' in err &&
    err.expose === true &&
    'status' in err &&
    typeof err.status === 'number'
  );
}
