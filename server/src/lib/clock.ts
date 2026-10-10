// The one source of "now", so tests can pin the date without faking timers
export function now(): Date {
  return new Date();
}
