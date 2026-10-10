import { errors, importX509, jwtVerify } from 'jose';

export type FirebaseIdentity = { uid: string; email: string; name?: string };

// Resolves to null for any token that isn't a valid Firebase ID token for this project
export type TokenVerifier = (token: string) => Promise<FirebaseIdentity | null>;

export type PublicKeySet = { keys: Map<string, CryptoKey>; maxAgeSeconds: number };

const GOOGLE_CERTIFICATES_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const CLOCK_TOLERANCE_SECONDS = 5;

// Follows Firebase's checklist for verifying ID tokens with a third-party JWT library
export function createFirebaseTokenVerifier({
  projectId,
  getPublicKeys = fetchGooglePublicKeys,
}: {
  projectId: string;
  getPublicKeys?: () => Promise<PublicKeySet>;
}): TokenVerifier {
  let cache: { keys: Map<string, CryptoKey>; expiresAt: number } | undefined;

  async function publicKey(kid: string | undefined) {
    if (!cache || Date.now() >= cache.expiresAt) {
      const { keys, maxAgeSeconds } = await getPublicKeys();
      cache = { keys, expiresAt: Date.now() + maxAgeSeconds * 1000 };
    }
    const key = kid === undefined ? undefined : cache.keys.get(kid);
    if (!key) throw new errors.JWKSNoMatchingKey();
    return key;
  }

  return async (token) => {
    let payload;
    try {
      ({ payload } = await jwtVerify(token, (header) => publicKey(header.kid), {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      }));
    } catch (error) {
      if (error instanceof errors.JOSEError) return null;
      throw error;
    }

    const latestAllowed = Date.now() / 1000 + CLOCK_TOLERANCE_SECONDS;
    const { sub, email, name, iat, auth_time: authTime } = payload;
    if (typeof sub !== 'string' || sub === '') return null;
    if (typeof email !== 'string' || email === '') return null;
    if (typeof iat !== 'number' || iat > latestAllowed) return null;
    if (typeof authTime !== 'number' || authTime > latestAllowed) return null;

    return { uid: sub, email, name: typeof name === 'string' && name !== '' ? name : undefined };
  };
}

export async function fetchGooglePublicKeys(): Promise<PublicKeySet> {
  const response = await fetch(GOOGLE_CERTIFICATES_URL);
  if (!response.ok) {
    throw new Error(`Fetching Google's token certificates failed with status ${response.status}`);
  }
  return parseCertificates(await response.json(), response.headers.get('cache-control'));
}

export async function parseCertificates(
  certificates: Record<string, string>,
  cacheControl: string | null,
): Promise<PublicKeySet> {
  const entries = await Promise.all(
    Object.entries(certificates).map(
      async ([kid, pem]) => [kid, await importX509(pem, 'RS256')] as const,
    ),
  );
  const maxAge = /max-age=(\d+)/.exec(cacheControl ?? '')?.[1];
  return { keys: new Map(entries), maxAgeSeconds: maxAge ? Number(maxAge) : 0 };
}
