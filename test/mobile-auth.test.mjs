import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'mobile-auth-test', alg: 'RS256', use: 'sig' };

function sessionToken(azp) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: 'user_mobile_test',
    sid: 'sess_mobile_test',
    iss: 'https://test.clerk.accounts.dev',
    iat: now,
    nbf: now - 1,
    exp: now + 60
  };
  if (azp !== undefined) claims.azp = azp;
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: publicJwk.kid })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const content = `${header}.${payload}`;
  const signature = sign('RSA-SHA256', Buffer.from(content), privateKey).toString('base64url');
  return `${content}.${signature}`;
}

test('Clerk verifies native bearer tokens and still checks web origins and signatures', async (context) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.CLERK_SECRET_KEY;
  process.env.NODE_ENV = 'test';
  process.env.CLERK_SECRET_KEY = 'sk_test_mobile_auth';
  context.mock.method(globalThis, 'fetch', async () => Response.json({ keys: [publicJwk] }));

  try {
    const { authenticate } = await import('../api/_lib.js');
    const requestFor = (token) => new Request('https://www.mursaltheorie.nl/api/v1/devices', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const native = await authenticate(requestFor(sessionToken()));
    assert.equal(native.userId, 'user_mobile_test');
    assert.equal(native.sessionId, 'sess_mobile_test');

    const web = await authenticate(requestFor(sessionToken('https://www.mursaltheorie.nl')));
    assert.equal(web.userId, 'user_mobile_test');

    const otherOrigin = await authenticate(requestFor(sessionToken('https://untrusted.example')));
    assert.equal(otherOrigin.error?.status, 401);

    const token = sessionToken();
    const [header, payload, signature] = token.split('.');
    const altered = `${header}.${payload}.${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;
    const badSignature = await authenticate(requestFor(altered));
    assert.equal(badSignature.error?.status, 401);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = originalSecret;
  }
});
