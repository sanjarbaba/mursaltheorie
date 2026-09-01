import { authenticate, ensureUser, getSql, parseBody, requireCourseAccess } from '../_lib.js';
import { fail, integer, ok, requestId } from './_contract.js';

export default {
  async fetch(request) {
    if (!['GET', 'PUT'].includes(request.method)) return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      const access = await requireCourseAccess(sql, auth.userId);
      if (access.error) return fail('ACCESS_REQUIRED', 'Geen actieve toegang.', 403);

      if (request.method === 'GET') {
        const rows = await sql`
          SELECT lesson_id, completed, updated_at
          FROM lesson_progress
          WHERE clerk_user_id = ${auth.userId}
          ORDER BY lesson_id
        `;
        return ok({ progress: rows, serverTime: new Date().toISOString() });
      }

      const body = await parseBody(request);
      const lessonId = integer(body?.lessonId, { min: 1, max: 150 });
      if (lessonId === null || typeof body?.completed !== 'boolean') {
        return fail('VALIDATION_ERROR', 'lessonId en completed zijn verplicht.', 422);
      }

      const rows = await sql`
        INSERT INTO lesson_progress (clerk_user_id, lesson_id, completed, updated_at)
        VALUES (${auth.userId}, ${lessonId}, ${body.completed}, NOW())
        ON CONFLICT (clerk_user_id, lesson_id) DO UPDATE SET
          completed = EXCLUDED.completed,
          updated_at = NOW()
        RETURNING lesson_id, completed, updated_at
      `;
      return ok({ progress: rows[0], requestId: requestId(request) });
    } catch (error) {
      console.error('v1 progress endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Voortgang kon niet worden verwerkt.', 503);
    }
  }
};
