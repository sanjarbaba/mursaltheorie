import { authenticate, ensureUser, getSql, json, parseBody, requireCourseAccess } from './_lib.js';

export default {
  async fetch(request) {
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Methode niet toegestaan.' }, 405, { Allow: 'GET, POST' });
    const auth = await authenticate(request);
    if (auth.error) return auth.error;

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      const access = await requireCourseAccess(sql, auth.userId);
      if (access.error) return access.error;

      if (request.method === 'GET') {
        const rows = await sql`
          SELECT id, exam_number, score, total_questions, wrong_questions, completed_at
          FROM exam_results
          WHERE clerk_user_id = ${auth.userId}
          ORDER BY completed_at DESC
          LIMIT 50
        `;
        return json({ results: rows });
      }

      const body = await parseBody(request);
      const examNumber = Number(body?.examNumber);
      const score = Number(body?.score);
      const answers = Array.isArray(body?.answers) ? body.answers.slice(0, 50) : [];
      const wrongQuestions = Array.isArray(body?.wrongQuestions) ? body.wrongQuestions.slice(0, 50) : [];
      if (!Number.isInteger(examNumber) || examNumber < 1 || examNumber > 30 || !Number.isInteger(score) || score < 0 || score > 50) {
        return json({ error: 'Ongeldig examenresultaat.' }, 400);
      }

      const rows = await sql`
        INSERT INTO exam_results (
          clerk_user_id, exam_number, score, total_questions, answers, wrong_questions
        ) VALUES (
          ${auth.userId}, ${examNumber}, ${score}, 50,
          ${JSON.stringify(answers)}::jsonb, ${JSON.stringify(wrongQuestions)}::jsonb
        )
        RETURNING id, exam_number, score, total_questions, wrong_questions, completed_at
      `;
      return json({ result: rows[0] }, 201);
    } catch (error) {
      console.error('results endpoint failed', error);
      return json({ error: 'Examenresultaat kon niet worden opgeslagen.' }, 503);
    }
  }
};
