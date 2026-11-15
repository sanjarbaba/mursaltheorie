import { createClerkClient } from '@clerk/backend';
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
  if (!user) {
    return { error: fail('ADMIN_REQUIRED', 'Beheerdersrechten zijn vereist.', 403) };
  }
  // app_users.email can be changed through the profile endpoint. Never use it
  // as proof of ownership for privileged actions.
  let clerkUser;
  try {
    clerkUser = await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }).users.getUser(auth.userId);
  } catch {
    return { error: fail('IDENTITY_UNAVAILABLE', 'Beheerdersidentiteit kon niet worden gecontroleerd.', 503) };
  }
  const primary = clerkUser.emailAddresses?.find((address) => address.id === clerkUser.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== 'verified' ||
      !adminEmails().includes(String(primary.emailAddress || '').trim().toLowerCase())) {
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

const LESSON_LANGUAGES = ['nl', 'fa', 'ps'];

function editText(value, limit) {
  if (typeof value !== 'string' || value.length > limit || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return null;
  return value.trim();
}

function mergeLessonText(current, submitted, limit) {
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) return null;
  const result = { ...(current && typeof current === 'object' && !Array.isArray(current) ? current : {}) };
  for (const language of LESSON_LANGUAGES) {
    if (!Object.hasOwn(submitted, language)) continue;
    const value = editText(submitted[language], limit);
    if (value === null) return null;
    if (value) result[language] = value;
    else delete result[language];
  }
  return result;
}

function lessonBlock(blocks, type) {
  return blocks.find((block) => block?.type === type)?.text || {};
}

function replaceLessonBlock(blocks, type, text) {
  const index = blocks.findIndex((block) => block?.type === type);
  if (index < 0) blocks.push({ type, text });
  else blocks[index] = { ...blocks[index], text };
}

function completeLesson(fields) {
  return ['title', 'summary', 'rule', 'tip'].every((field) =>
    LESSON_LANGUAGES.every((language) => Boolean(fields[field]?.[language])));
}

async function adminLessons(sql) {
  const releases = await sql`SELECT id, version FROM content_releases WHERE status='published' LIMIT 1`;
  if (!releases[0]) return { release: null, modules: [], lessons: [] };
  const release = releases[0];
  const [modules, lessons] = await Promise.all([
    sql`SELECT id, module_number, title FROM course_modules WHERE release_id=${release.id} AND published=TRUE ORDER BY sort_order`,
    sql`SELECT id, lesson_number, module_id, slug, title, summary, content_blocks,
      estimated_minutes, published, updated_at
      FROM course_lessons WHERE release_id=${release.id} ORDER BY lesson_number`
  ]);
  return {
    release: { version: release.version },
    modules: modules.map((module) => ({ id: module.id, number: module.module_number, title: module.title })),
    lessons: lessons.map((lesson) => ({
      id: lesson.id, number: lesson.lesson_number, moduleId: lesson.module_id, slug: lesson.slug,
      title: lesson.title, summary: lesson.summary, rule: lessonBlock(lesson.content_blocks || [], 'rule'),
      tip: lessonBlock(lesson.content_blocks || [], 'exam_tip'),
      estimatedMinutes: lesson.estimated_minutes, published: lesson.published, updatedAt: lesson.updated_at
    }))
  };
}

async function saveLesson(sql, body) {
  const releases = await sql`SELECT id FROM content_releases WHERE status='published' LIMIT 1`;
  if (!releases[0]) return fail('CONTENT_NOT_READY', 'Er is geen gepubliceerde lesversie.', 409);
  const releaseId = releases[0].id;
  const lessonId = body.lessonId == null ? null : integer(body.lessonId, { min: 1, max: 1000000000 });
  if (body.lessonId != null && !lessonId) return fail('INVALID_LESSON', 'Kies een geldige les.', 422);
  const rows = lessonId ? await sql`SELECT id, title, summary, content_blocks, updated_at FROM course_lessons WHERE id=${lessonId} AND release_id=${releaseId} LIMIT 1` : [];
  if (lessonId && !rows[0]) return fail('LESSON_NOT_FOUND', 'Les niet gevonden.', 404);
  const current = rows[0];
  if (current && (!body.updatedAt || new Date(body.updatedAt).getTime() !== new Date(current.updated_at).getTime())) {
    return fail('LESSON_CHANGED', 'Deze les is intussen gewijzigd. Laad hem opnieuw voordat je opslaat.', 409);
  }
  const blocks = Array.isArray(current?.content_blocks) ? [...current.content_blocks] : [];
  const fields = {
    title: mergeLessonText(current?.title, body.title, 120),
    summary: mergeLessonText(current?.summary, body.summary, 500),
    rule: mergeLessonText(lessonBlock(blocks, 'rule'), body.rule, 1500),
    tip: mergeLessonText(lessonBlock(blocks, 'exam_tip'), body.tip, 1500)
  };
  if (Object.values(fields).some((value) => value === null) || !fields.title.nl || !fields.summary.nl || !fields.rule.nl || !fields.tip.nl) {
    return fail('INVALID_LESSON', 'Vul een Nederlandse titel, samenvatting, kernregel en examentip in. Gebruik alleen gewone tekst.', 422);
  }
  replaceLessonBlock(blocks, 'rule', fields.rule);
  replaceLessonBlock(blocks, 'exam_tip', fields.tip);
  const minutes = integer(body.estimatedMinutes, { min: 1, max: 60 });
  if (!minutes) return fail('INVALID_MINUTES', 'Kies een lestijd van 1 tot 60 minuten.', 422);
  if (current) {
    const updated = await sql`UPDATE course_lessons SET title=${JSON.stringify(fields.title)}::jsonb,
      summary=${JSON.stringify(fields.summary)}::jsonb, content_blocks=${JSON.stringify(blocks)}::jsonb,
      estimated_minutes=${minutes}, updated_at=NOW()
      WHERE id=${lessonId} AND release_id=${releaseId} AND updated_at=${current.updated_at}
      RETURNING id, lesson_number, published`;
    if (!updated[0]) return fail('LESSON_CHANGED', 'Deze les is intussen gewijzigd. Laad hem opnieuw.', 409);
    return ok({ saved: true, number: updated[0].lesson_number, published: updated[0].published });
  }
  const moduleNumber = integer(body.moduleNumber, { min: 1, max: 99 });
  if (!moduleNumber) return fail('INVALID_MODULE', 'Kies een hoofdstuk.', 422);
  const modules = await sql`SELECT id FROM course_modules WHERE release_id=${releaseId} AND module_number=${moduleNumber} AND published=TRUE LIMIT 1`;
  if (!modules[0]) return fail('INVALID_MODULE', 'Hoofdstuk niet gevonden.', 422);
  try {
    const created = await sql`WITH next_number AS (
      SELECT COALESCE(MAX(lesson_number),0)+1 AS value FROM course_lessons WHERE release_id=${releaseId}
    ), next_position AS (
      SELECT COALESCE(MAX(sort_order),0)+1 AS value FROM course_lessons WHERE release_id=${releaseId} AND module_id=${modules[0].id}
    )
    INSERT INTO course_lessons(lesson_number,module_id,release_id,slug,title,summary,content_blocks,media,estimated_minutes,sort_order,published)
    SELECT next_number.value,${modules[0].id},${releaseId},'admin-'||next_number.value,
      ${JSON.stringify(fields.title)}::jsonb,${JSON.stringify(fields.summary)}::jsonb,
      ${JSON.stringify(blocks)}::jsonb,'[]'::jsonb,${minutes},next_position.value,FALSE
    FROM next_number,next_position RETURNING id,lesson_number`;
    return ok({ saved: true, created: true, number: created[0].lesson_number, published: false });
  } catch (error) {
    if (error?.code === '23505') return fail('LESSON_CONFLICT', 'Een andere les is net toegevoegd. Vernieuw de lijst en probeer opnieuw.', 409);
    throw error;
  }
}

async function setLessonPublication(sql, body) {
  const lessonId = integer(body.lessonId, { min: 1, max: 1000000000 });
  if (!lessonId || typeof body.published !== 'boolean') return fail('INVALID_LESSON', 'Kies een les en een status.', 422);
  const rows = await sql`SELECT l.id,l.lesson_number,l.title,l.summary,l.content_blocks,l.published FROM course_lessons l
    JOIN content_releases r ON r.id=l.release_id WHERE l.id=${lessonId} AND r.status='published' LIMIT 1`;
  const lesson = rows[0];
  if (!lesson) return fail('LESSON_NOT_FOUND', 'Les niet gevonden.', 404);
  const blocks = lesson.content_blocks || [];
  if (body.published && !completeLesson({
    title: lesson.title, summary: lesson.summary,
    rule: lessonBlock(blocks, 'rule'), tip: lessonBlock(blocks, 'exam_tip')
  })) return fail('TRANSLATIONS_REQUIRED', 'Vul voor publicatie alle vier tekstvelden in Nederlands, Dari/Farsi en Pashto in.', 422);
  if (body.published && lesson.lesson_number > 150) {
    await sql`ALTER TABLE lesson_progress
      DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_check,
      ADD CONSTRAINT lesson_progress_lesson_id_check CHECK (lesson_id BETWEEN 1 AND 10000)`;
  }
  await sql`UPDATE course_lessons SET published=${body.published},updated_at=NOW() WHERE id=${lessonId}`;
  return ok({ published: body.published, lessonId });
}

async function handler(request) {
  const auth = await authenticate(request);
  if (auth.error) return auth.error;
  const sql = getSql();
  const admin = await requireAdmin(sql, auth);
  if (admin.error) return admin.error;

  const resource = new URL(request.url, 'https://www.mursaltheorie.nl').searchParams.get('resource');
  if (request.method === 'GET' && resource === 'activity') return ok({ ...(await activityData(sql)), admin: admin.user });
  if (request.method === 'GET' && resource === 'lessons-admin') return ok(await adminLessons(sql));
  if (request.method === 'GET') return ok({ ...(await listData(sql)), admin: admin.user });
  if (request.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);

  const body = await parseBody(request) || {};
  if (resource === 'lesson-save') return saveLesson(sql, body);
  if (resource === 'lesson-publish') return setLessonPublication(sql, body);
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

