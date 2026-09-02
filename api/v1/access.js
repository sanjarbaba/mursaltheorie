import { authenticate, ensureUser, getSql, hasCourseAccess } from '../_lib.js';
import { accessSummary } from './_access.js';
import { fail, integer, locale, localized, ok } from './_contract.js';
import { summarizeResults } from './_results.js';

async function examHistory(sql, userId, url) {
  const language = locale(url.searchParams.get('locale'));
  const requestedLimit = url.searchParams.get('limit');
  const limit = requestedLimit == null ? 20 : integer(requestedLimit, { min: 1, max: 50 });
  if (limit === null) return fail('VALIDATION_ERROR', 'limit moet tussen 1 en 50 liggen.', 422);
  const rows = await sql`
    SELECT a.id, a.score, a.started_at, a.submitted_at,
      e.exam_number, e.title, e.question_count, e.pass_score,
      COUNT(answer.question_id)::INTEGER AS answered_count,
      COUNT(answer.question_id) FILTER (WHERE answer.is_correct)::INTEGER AS correct_count
    FROM exam_attempts_v1 a
    JOIN exam_definitions e ON e.id = a.exam_id
    LEFT JOIN exam_attempt_answers_v1 answer ON answer.attempt_id = a.id
    WHERE a.clerk_user_id = ${userId} AND a.status = 'submitted'
    GROUP BY a.id, e.id
    ORDER BY a.submitted_at DESC, a.id DESC
    LIMIT ${limit}
  `;
  const results = rows.map((row) => ({
    attemptId: Number(row.id), examNumber: row.exam_number, title: localized(row.title, language),
    score: row.score, passed: Number(row.score) >= Number(row.pass_score),
    questionCount: row.question_count, answeredCount: row.answered_count, correctCount: row.correct_count,
    startedAt: row.started_at, submittedAt: row.submitted_at
  }));
  return ok({ results, summary: summarizeResults(results), locale: language });
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      const user = await ensureUser(sql, auth.userId);
      const url = new URL(request.url);
      if (url.searchParams.get('resource') === 'results') return examHistory(sql, auth.userId, url);
      let entitlements = [];
      try {
        entitlements = await sql`
          SELECT product_key, source, status, starts_at, ends_at
          FROM entitlements
          WHERE clerk_user_id = ${auth.userId}
          ORDER BY created_at DESC
        `;
      } catch (error) {
        if (error?.code !== '42P01') throw error;
      }

      return ok({ access: accessSummary(entitlements, hasCourseAccess(user)) });
    } catch (error) {
      console.error('v1 access endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Toegang kon niet worden gecontroleerd.', 503);
    }
  }
};

