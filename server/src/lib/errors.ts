export type ErrorDetail = { path: string; message: string };

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(message = 'The requested resource was not found.') {
  return new AppError(404, 'NOT_FOUND', message);
}

export function unauthenticated() {
  return new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
}

export function forbidden() {
  return new AppError(403, 'FORBIDDEN', "You don't have access to this.");
}

export function conflict(code: string, message: string) {
  return new AppError(409, code, message);
}

export function validationError(details: ErrorDetail[]) {
  return new AppError(400, 'VALIDATION_ERROR', 'Some of the information sent is invalid.', details);
}
