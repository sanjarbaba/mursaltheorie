import { verifyToken } from '@clerk/backend';
import { neon } from '@neondatabase/serverless';

const webAuthorizedParties = [
  'https://mursaltheorie.nl',
  'https://www.mursaltheorie.nl'
];

let sqlClient;

export function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      ...extraHeaders
    }
  });
}

function authorizedParties() {
  const configured = (process.env.CLERK_AUTHORIZED_PARTIES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([...webAuthorizedParties, ...configured])];
}

export async function authenticate(request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return { error: json({ error: 'Inloggen is vereist.' }, 401) };
  if (!process.env.CLERK_SECRET_KEY) return { error: json({ error: 'Clerk-serverconfiguratie ontbreekt.' }, 503) };

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: authorizedParties()
    });
    if (!payload.sub) throw new Error('Token has no subject');
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return { error: json({ error: 'Ongeldige of verlopen sessie.' }, 401) };
  }
}

export async function ensureUser(sql, userId, profile = {}) {
  const email = typeof profile.email === 'string' ? profile.email.slice(0, 320) : null;
  const name = typeof profile.name === 'string' ? profile.name.slice(0, 120) : null;
  const rows = await sql`
    INSERT INTO app_users (clerk_user_id, email, display_name)
    VALUES (${userId}, ${email}, ${name})
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, app_users.email),
      display_name = COALESCE(EXCLUDED.display_name, app_users.display_name),
      updated_at = NOW()
    RETURNING clerk_user_id, email, display_name, access_status,
      access_starts_at, access_ends_at, created_at, updated_at
  `;
  return rows[0];
}

export function hasCourseAccess(user) {
  if (!user || ['blocked', 'expired'].includes(user.access_status)) return false;
  if (['beta', 'admin'].includes(user.access_status)) return true;
  if (user.access_status !== 'active' || !user.access_ends_at) return false;
  return new Date(user.access_ends_at).getTime() > Date.now();
}

export async function requireCourseAccess(sql, userId) {
  try {
    const entitlements = await sql`
      SELECT id
      FROM entitlements
      WHERE clerk_user_id = ${userId}
        AND product_key = 'course.full'
        AND status IN ('active', 'grace')
        AND starts_at <= NOW()
        AND (ends_at IS NULL OR ends_at > NOW())
      LIMIT 1
    `;
    if (entitlements[0]) return { entitlement: entitlements[0] };
  } catch (error) {
    if (error?.code !== '42P01') throw error;
  }

  const rows = await sql`
    SELECT clerk_user_id, access_status, access_starts_at, access_ends_at
    FROM app_users WHERE clerk_user_id = ${userId}
  `;
  const user = rows[0];
  if (!hasCourseAccess(user)) return { error: json({ error: 'Geen actieve toegang.', code: 'ACCESS_REQUIRED' }, 403) };
  return { user };
}

export async function parseBody(request) {
  try { return await request.json(); } catch { return null; }
}
