import { authenticate, ensureUser, getSql, json, requireCourseAccess } from './_lib.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return json({ error: 'Methode niet toegestaan.' }, 405, { Allow: 'GET' });
    const auth = await authenticate(request);
    if (auth.error) return auth.error;

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      const access = await requireCourseAccess(sql, auth.userId);
      if (access.error) return access.error;

      const url = new URL(request.url);
      const resource = url.searchParams.get('resource');

      if (resource === 'lessons') {
        const lessons = await sql`
          SELECT id, module_number, title_nl, title_fa, rule_nl, rule_fa,
            tip_nl, tip_fa, image_path
          FROM protected_lessons
          WHERE published = TRUE
          ORDER BY id
        `;
        return json({ lessons });
      }

      if (resource === 'questions') {
        const questions = await sql`
          SELECT id, question_nl, question_fa, answers_nl, answers_fa,
            correct_answer, scene
          FROM protected_questions
          WHERE published = TRUE
          ORDER BY id
        `;
        return json({ questions });
      }

      return json({ error: 'Onbekende inhoud.' }, 400);
    } catch (error) {
      console.error('content endpoint failed', error);
      return json({ error: 'Lesinhoud kon niet worden geladen.' }, 503);
    }
  }
};
