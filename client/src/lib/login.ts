const WRONG_CREDENTIALS = new Set([
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
]);

// One message for every wrong-credentials code, so the form never reveals whether the email exists
export function authErrorMessage(code: string | undefined): string {
  if (code && WRONG_CREDENTIALS.has(code)) return 'Email or password is incorrect.';
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  return "We couldn't sign you in. Please try again.";
}

// Only in-app paths, so a crafted ?next= link can't send someone to another site after login.
// Browsers treat "/\" like "//", so backslashes are refused too.
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
  if (next.includes('://')) return '/';
  return next;
}
