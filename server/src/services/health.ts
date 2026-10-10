import * as healthData from '../data/health.js';
import { AppError } from '../lib/errors.js';

const DATABASE_TIMEOUT_MS = 10_000;

export async function checkHealth() {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`No answer within ${DATABASE_TIMEOUT_MS} ms`)),
      DATABASE_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([healthData.pingDatabase(), timeout]);
  } catch (error) {
    console.error('Health check failed:', error instanceof Error ? error.message : error);
    throw new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'The database is not responding. Please try again shortly.',
    );
  } finally {
    clearTimeout(timer);
  }
}
