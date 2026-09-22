import { authenticate, ensureUser, getSql, parseBody } from '../_lib.js';
import { fail, ok } from './_contract.js';

const EVENT_TYPES = new Set(['page_view', 'heartbeat', 'lesson_open', 'signs_open', 'training_open', 'exam_start']);
function clean(value, max = 160) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

async function ensureActivityTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS activity_events (
    id BIGSERIAL PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES app_users(clerk_user_id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view','heartbeat','lesson_open','signs_open','training_open','exam_start')),
    path TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'nl' CHECK (language IN ('nl','fa','ps')),
    view_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS activity_events_created_idx ON activity_events (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS activity_events_user_created_idx ON activity_events (clerk_user_id, created_at DESC)`;
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);
    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      await ensureActivityTable(sql);
      const body = await parseBody(request) || {};
      const eventType = clean(body.eventType, 40);
      const sessionId = clean(body.sessionId, 80);
      const path = clean(body.path || '/', 180);
      const language = ['nl', 'fa', 'ps'].includes(body.language) ? body.language : 'nl';
      const viewName = clean(body.viewName, 80) || null;
      if (!EVENT_TYPES.has(eventType) || !sessionId || !path) return fail('VALIDATION_ERROR', 'Ongeldige activiteitsgegevens.', 422);
      await sql`INSERT INTO activity_events(clerk_user_id, session_id, event_type, path, language, view_name)
        VALUES(${auth.userId}, ${sessionId}, ${eventType}, ${path}, ${language}, ${viewName})`;
      await sql`UPDATE app_users SET updated_at = NOW() WHERE clerk_user_id = ${auth.userId}`;
      return ok({ tracked: true });
    } catch (error) {
      console.error('v1 activity endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Activiteit kon niet worden opgeslagen.', 503);
    }
  }
};
