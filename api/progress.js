import { authenticate, ensureUser, getSql, json, parseBody, requireCourseAccess } from './_lib.js';

export default {
  async fetch(request) {
    if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'Methode niet toegestaan.' }, 405, { Allow: 'GET, PUT' });
    const auth = await authenticate(request);
    if (auth.error) return auth.error;

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      const access = await requireCourseAccess(sql, auth.userId);
      if (access.error) return access.error;

      if (request.method === 'GET') {
        const rows = await sql`
          SELECT lesson_id, completed, updated_at
          FROM lesson_progress
          WHERE clerk_user_id = ${auth.userId} AND completed = TRUE
          ORDER BY lesson_id
        `;
        return json({ completedLessons: rows.map((row) => row.lesson_id), progress: rows });
      }

      const body = await parseBody(request);
      const lessonId = Number(body?.lessonId);
      const completed = body?.completed !== false;
      if (!Number.isInteger(lessonId) || lessonId < 1 || lessonId > 150) {
        return json({ error: 'Ongeldig lesnummer.' }, 400);
      }

      await sql`
        INSERT INTO lesson_progress (clerk_user_id, lesson_id, completed, updated_at)
        VALUES (${auth.userId}, ${lessonId}, ${completed}, NOW())
        ON CONFLICT (clerk_user_id, lesson_id) DO UPDATE SET
          completed = EXCLUDED.completed,
          updated_at = NOW()
      `;
      return json({ ok: true, lessonId, completed });
    } catch (error) {
      console.error('progress endpoint failed', error);
      return json({ error: 'Voortgang kon niet worden opgeslagen.' }, 503);
    }
  }
};
