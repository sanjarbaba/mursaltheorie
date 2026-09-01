import { authenticate, ensureUser, getSql, requireCourseAccess } from '../_lib.js';
import { fail, locale, localized, ok } from './_contract.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      const access = await requireCourseAccess(sql, auth.userId);
      if (access.error) return fail('ACCESS_REQUIRED', 'Geen actieve toegang.', 403);

      const language = locale(new URL(request.url).searchParams.get('locale'));
      const rows = await sql`
        SELECT e.exam_number, e.title, e.question_count, e.pass_score, e.duration_seconds,
          r.version AS release_version
        FROM exam_definitions e
        JOIN content_releases r ON r.id = e.release_id
        WHERE e.published = TRUE AND r.status = 'published'
        ORDER BY e.exam_number
      `;
      return ok({
        exams: rows.map((row) => ({
          number: row.exam_number,
          title: localized(row.title, language),
          questionCount: row.question_count,
          passScore: row.pass_score,
          durationSeconds: row.duration_seconds,
          releaseVersion: row.release_version
        })),
        locale: language
      });
    } catch (error) {
      if (error?.code === '42P01') return fail('MIGRATION_REQUIRED', 'De mobiele databasemigratie ontbreekt.', 503);
      console.error('v1 exams endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Examens konden niet worden geladen.', 503);
    }
  }
};
