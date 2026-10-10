import { readFileSync } from 'node:fs';
import { generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createFirebaseTokenVerifier,
  parseCertificates,
  type PublicKeySet,
} from '../src/lib/firebase-token.js';

const PROJECT_ID = 'volunteer-shift-board';
const KID = 'test-key';

let privateKey: CryptoKey;
let keySet: PublicKeySet;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  keySet = { keys: new Map([[KID, pair.publicKey]]), maxAgeSeconds: 3600 };
});

afterEach(() => {
  vi.useRealTimers();
});

const nowSeconds = () => Math.floor(Date.now() / 1000);

function claims(overrides: JWTPayload = {}): JWTPayload {
  const now = nowSeconds();
  return {
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    sub: 'uid-123',
    email: 'demo.volunteer@example.com',
    name: 'Demo Volunteer',
    iat: now,
    auth_time: now,
    exp: now + 3600,
    ...overrides,
  };
}

function sign(payload: JWTPayload, header: { alg?: string; kid?: string } = {}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: KID, ...header })
    .sign(privateKey);
}

const verifier = () =>
  createFirebaseTokenVerifier({ projectId: PROJECT_ID, getPublicKeys: async () => keySet });

describe('createFirebaseTokenVerifier', () => {
  it('returns the identity from a valid token', async () => {
    await expect(verifier()(await sign(claims()))).resolves.toEqual({
      uid: 'uid-123',
      email: 'demo.volunteer@example.com',
      name: 'Demo Volunteer',
    });
  });

  it.each([
    ['another project as audience', { aud: 'some-other-project' }],
    ['another issuer', { iss: 'https://securetoken.google.com/some-other-project' }],
    ['an expired token', { exp: nowSeconds() - 60 }],
    ['a sign-in time in the future', { auth_time: nowSeconds() + 60 }],
    ['an issue time in the future', { iat: nowSeconds() + 60 }],
    ['an empty subject', { sub: '' }],
    ['no email', { email: undefined }],
  ])('rejects %s', async (_case, overrides) => {
    await expect(verifier()(await sign(claims(overrides)))).resolves.toBeNull();
  });

  it('rejects a key id Google never published', async () => {
    await expect(verifier()(await sign(claims(), { kid: 'unknown-key' }))).resolves.toBeNull();
  });

  it('rejects any algorithm other than RS256', async () => {
    const secret = new TextEncoder().encode('a-shared-secret-anyone-could-guess');
    const token = await new SignJWT(claims())
      .setProtectedHeader({ alg: 'HS256', kid: KID })
      .sign(secret);

    await expect(verifier()(token)).resolves.toBeNull();
  });

  it('rejects text that is not a token at all', async () => {
    await expect(verifier()('not-a-token')).resolves.toBeNull();
  });

  it('reuses the public keys until their max-age runs out', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const getPublicKeys = vi.fn(async () => keySet);
    const verify = createFirebaseTokenVerifier({ projectId: PROJECT_ID, getPublicKeys });

    await verify(await sign(claims()));
    await verify(await sign(claims()));
    expect(getPublicKeys).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 3601 * 1000);
    await verify(await sign(claims()));
    expect(getPublicKeys).toHaveBeenCalledTimes(2);
  });
});

describe('parseCertificates', () => {
  it("imports each of Google's certificates and reads the max-age", async () => {
    const certificates = JSON.parse(
      readFileSync(new URL('./fixtures/google-certificates.json', import.meta.url), 'utf8'),
    );

    const { keys, maxAgeSeconds } = await parseCertificates(
      certificates,
      'public, max-age=20799, must-revalidate, no-transform',
    );

    expect([...keys.keys()]).toEqual(Object.keys(certificates));
    expect(maxAgeSeconds).toBe(20799);
  });
});
