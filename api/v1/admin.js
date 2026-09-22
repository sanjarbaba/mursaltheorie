import { authenticate, ensureUser, getSql, parseBody } from '../_lib.js';
import { COURSE_PRODUCTS } from './_products.js';
import { fail, integer, ok } from './_contract.js';

const DEFAULT_ADMIN_EMAIL = 'sanjarsadat@gmail.com';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAIL)
    .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

async function requireAdmin(sql, auth) {
  const rows = await sql`
    SELECT clerk_user_id, email, display_name, access_status
    FROM app_users WHERE clerk_user_id = ${auth.userId} LIMIT 1
  `;
  const user = rows[0];
  if (!user || (user.access_status !== 'admin' && !adminEmails().includes(String(user.email || '').toLowerCase()))) {
    return { error: fail('ADMIN_REQUIRED', 'Beheerdersrechten zijn vereist.', 403) };
  }
  return { user };
}

async function listData(sql) {
  const users = await sql`
    SELECT u.clerk_user_id, u.email, u.display_name, u.access_status,
      u.access_starts_at, u.access_ends_at, u.created_at,
      p.product_key AS latest_product_key, p.description AS latest_description,
      p.amount_value::TEXT AS latest_amount, p.status AS latest_purchase_status,
      p.paid_at AS latest_paid_at, p.confirmation_sent_at AS latest_confirmation_sent_at,
      e.product_key AS entitlement_product_key, e.status AS entitlement_status,
      e.starts_at AS entitlement_starts_at, e.ends_at AS entitlement_ends_at
    FROM app_users u
    LEFT JOIN LATERAL (
      SELECT product_key, description, amount_value, status, paid_at, confirmation_sent_at
      FROM purchase_orders WHERE clerk_user_id = u.clerk_user_id
      ORDER BY created_at DESC LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT product_key, status, starts_at, ends_at
      FROM entitlements WHERE clerk_user_id = u.clerk_user_id
      ORDER BY created_at DESC LIMIT 1
    ) e ON TRUE
    ORDER BY u.created_at DESC
  `;
  const counts = await sql`
    SELECT COUNT(*)::INT AS users,
      COUNT(*) FILTER (WHERE access_status = 'admin')::INT AS admins,
      COUNT(*) FILTER (WHERE latest.status IN ('paid_awaiting_activation','active'))::INT AS paid_orders
    FROM app_users u
    LEFT JOIN LATERAL (
      SELECT status FROM purchase_orders WHERE clerk_user_id = u.clerk_user_id
      ORDER BY created_at DESC LIMIT 1
    ) latest ON TRUE
  `;
  return { users, counts: counts[0] || { users: 0, admins: 0, paid_orders: 0 } };
}


async function ensureActivityTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS activity_events (
    id BIGSERIAL PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view','heartbeat','lesson_open','signs_open','training_open','exam_start')),
    path TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'nl',
    view_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS activity_events_created_idx ON activity_events (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS activity_events_user_created_idx ON activity_events (clerk_user_id, created_at DESC)`;
}
async function activityData(sql) {
  await ensureActivityTable(sql);
  const summaryRows = await sql`SELECT COUNT(*)::INT AS events_7d, COUNT(*) FILTER (WHERE event_type='page_view')::INT AS page_views_7d, COUNT(DISTINCT clerk_user_id)::INT AS users_7d, COUNT(DISTINCT session_id)::INT AS sessions_7d, COUNT(DISTINCT clerk_user_id) FILTER (WHERE created_at >= NOW()-INTERVAL '15 minutes')::INT AS active_now FROM activity_events WHERE created_at >= NOW()-INTERVAL '7 days'`;
  const topPages = await sql`SELECT path, COUNT(*)::INT AS views FROM activity_events WHERE created_at >= NOW()-INTERVAL '7 days' AND event_type='page_view' GROUP BY path ORDER BY views DESC, path LIMIT 8`;
  const recentUsers = await sql`SELECT a.clerk_user_id, u.display_name, u.email, MAX(a.created_at) AS last_seen_at, COUNT(*)::INT AS events, (ARRAY_AGG(a.path ORDER BY a.created_at DESC))[1] AS last_path, (ARRAY_AGG(a.event_type ORDER BY a.created_at DESC))[1] AS last_event FROM activity_events a JOIN app_users u ON u.clerk_user_id=a.clerk_user_id WHERE a.created_at >= NOW()-INTERVAL '7 days' GROUP BY a.clerk_user_id,u.display_name,u.email ORDER BY last_seen_at DESC LIMIT 40`;
  return {setupRequired:false,summary:summaryRows[0]||{events_7d:0,page_views_7d:0,users_7d:0,sessions_7d:0,active_now:0},topPages,recentUsers};
}

async function handler(request) {
  const auth = await authenticate(request);
  if (auth.error) return auth.error;
  const sql = getSql();
  const admin = await requireAdmin(sql, auth);
  if (admin.error) return admin.error;

  const resource = new URL(request.url, 'https://www.mursaltheorie.nl').searchParams.get('resource');
  if (request.method === 'GET' && resource === 'activity') return ok({ ...(await activityData(sql)), admin: admin.user });
  if (request.method === 'GET') return ok({ ...(await listData(sql)), admin: admin.user });
  if (request.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);

  const body = await parseBody(request) || {};
  const targetId = typeof body.clerkUserId === 'string' ? body.clerkUserId.trim() : '';
  if (!targetId) return fail('INVALID_USER', 'Kies een gebruiker.', 422);
  if (resource === 'grant') {
    const productKey = typeof body.productKey === 'string' ? body.productKey : 'theory_b_nl_fa_30d';
    const product = COURSE_PRODUCTS[productKey];
    const days = integer(body.days ?? 30, { min: 1, max: 365 });
    if (!product || product.comingSoon || !days) return fail('INVALID_ACCESS', 'Ongeldig product of aantal dagen.', 422);
    await ensureUser(sql, targetId);
    const endsAt = new Date(Date.now() + days * 86400000).toISOString();
    const reference = `admin:${auth.userId}:${targetId}:${productKey}:${Date.now()}`;
    await sql`INSERT INTO entitlements(clerk_user_id,product_key,source,external_reference,status,starts_at,ends_at)
      VALUES(${targetId},${productKey},'admin',${reference},'active',NOW(),${endsAt})`;
    await sql`UPDATE app_users SET access_status='active', access_starts_at=NOW(), access_ends_at=${endsAt}, updated_at=NOW()
      WHERE clerk_user_id=${targetId}`;
    return ok({ granted: true, clerkUserId: targetId, productKey, days, endsAt });
  }
  if (resource === 'revoke') {
    await sql`UPDATE entitlements SET status='revoked', updated_at=NOW()
      WHERE clerk_user_id=${targetId} AND status IN ('active','grace')`;
    await sql`UPDATE app_users SET access_status='expired', access_starts_at=NULL, access_ends_at=NULL, updated_at=NOW()
      WHERE clerk_user_id=${targetId} AND access_status <> 'admin'`;
    return ok({ revoked: true, clerkUserId: targetId });
  }
  return fail('RESOURCE_NOT_FOUND', 'Beheeractie niet gevonden.', 404);
}

export const GET = handler;
export const POST = handler;

