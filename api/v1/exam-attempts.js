import { authenticate, ensureUser, getSql, parseBody, requireCourseAccess } from '../_lib.js';
import { fail, integer, locale, localized, ok } from './_contract.js';
import { mutationId, percentage, publicQuestion } from './_exam.js';

async function startAttempt(sql, userId, body, language) {
  const examNumber = integer(body?.examNumber, { min: 1, max: 9999 });
  const mutation = mutationId(body?.mutationId);
  if (examNumber === null || !mutation) return fail('VALIDATION_ERROR', 'examNumber en een geldige mutationId zijn verplicht.', 422);

  const exams = await sql`
    SELECT e.id, e.exam_number, e.title, e.question_count, e.pass_score, e.duration_seconds
    FROM exam_definitions e
    JOIN content_releases r ON r.id = e.release_id
    WHERE e.exam_number = ${examNumber} AND e.published = TRUE AND r.status = 'published'
    LIMIT 1
  `;
  const exam = exams[0];
  if (!exam) return fail('EXAM_NOT_FOUND', 'Examen niet gevonden.', 404);

  const attempts = await sql`
    INSERT INTO exam_attempts_v1 (clerk_user_id, exam_id, mutation_id)
    VALUES (${userId}, ${exam.id}, ${mutation})
    ON CONFLICT (clerk_user_id, mutation_id) DO UPDATE SET mutation_id = EXCLUDED.mutation_id
    RETURNING id, exam_id, status, started_at, submitted_at, score
  `;
  const attempt = attempts[0];
  if (Number(attempt.exam_id) !== Number(exam.id)) return fail('IDEMPOTENCY_CONFLICT', 'mutationId is al voor een ander examen gebruikt.', 409);

  const questions = await sql`
    SELECT q.id, q.prompt, q.options, q.category, q.media, link.sort_order
    FROM exam_definition_questions_v1 link
    JOIN exam_questions_v1 q ON q.id = link.question_id
    WHERE link.exam_id = ${exam.id} AND q.published = TRUE
    ORDER BY link.sort_order
  `;
  return ok({
    attempt: {
      id: Number(attempt.id),
      status: attempt.status,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      score: attempt.score,
      exam: {
        number: exam.exam_number,
        title: localized(exam.title, language),
        questionCount: exam.question_count,
        passScore: exam.pass_score,
        durationSeconds: exam.duration_seconds
      },
      questions: questions.map((question) => publicQuestion(question, language, localized))
    }
  }, 201);
}

async function saveAnswer(sql, userId, body) {
  const attemptId = integer(body?.attemptId, { min: 1, max: Number.MAX_SAFE_INTEGER });
  const questionId = integer(body?.questionId, { min: 1, max: Number.MAX_SAFE_INTEGER });
  const selectedOption = integer(body?.selectedOption, { min: 0, max: 9 });
  if (attemptId === null || questionId === null || selectedOption === null) {
    return fail('VALIDATION_ERROR', 'attemptId, questionId en selectedOption zijn verplicht.', 422);
  }

  const rows = await sql`
    INSERT INTO exam_attempt_answers_v1 (attempt_id, question_id, selected_option, is_correct, answered_at)
    SELECT a.id, q.id, ${selectedOption}, q.correct_option = ${selectedOption}, NOW()
    FROM exam_attempts_v1 a
    JOIN exam_definitions e ON e.id = a.exam_id
    JOIN exam_definition_questions_v1 link ON link.exam_id = e.id
    JOIN exam_questions_v1 q ON q.id = link.question_id
    WHERE a.id = ${attemptId}
      AND a.clerk_user_id = ${userId}
      AND a.status = 'started'
      AND q.id = ${questionId}
      AND ${selectedOption} < jsonb_array_length(q.options)
      AND (e.duration_seconds IS NULL OR a.started_at + e.duration_seconds * INTERVAL '1 second' > NOW())
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
      selected_option = EXCLUDED.selected_option,
      is_correct = EXCLUDED.is_correct,
      answered_at = NOW()
    RETURNING attempt_id, question_id, selected_option, answered_at
  `;
  if (!rows[0]) return fail('ATTEMPT_NOT_ACTIVE', 'Deze examenpoging is niet actief of de vraag hoort niet bij het examen.', 409);
  return ok({
    answer: {
      attemptId: Number(rows[0].attempt_id),
      questionId: Number(rows[0].question_id),
      selectedOption: rows[0].selected_option,
      answeredAt: rows[0].answered_at
    }
  });
}

async function submitAttempt(sql, userId, body, language) {
  const attemptId = integer(body?.attemptId, { min: 1, max: Number.MAX_SAFE_INTEGER });
  if (attemptId === null) return fail('VALIDATION_ERROR', 'attemptId is verplicht.', 422);

  const attempts = await sql`
    SELECT a.id, a.exam_id, a.status, a.score, a.started_at, a.submitted_at,
      e.question_count, e.pass_score, e.duration_seconds,
      (e.duration_seconds IS NOT NULL
        AND a.started_at + e.duration_seconds * INTERVAL '1 second' <= NOW()) AS is_expired
    FROM exam_attempts_v1 a
    JOIN exam_definitions e ON e.id = a.exam_id
    WHERE a.id = ${attemptId} AND a.clerk_user_id = ${userId}
    LIMIT 1
  `;
  const attempt = attempts[0];
  if (!attempt) return fail('ATTEMPT_NOT_FOUND', 'Examenpoging niet gevonden.', 404);

  if (attempt.status === 'started') {
    if (attempt.is_expired) {
      await sql`
        UPDATE exam_attempts_v1 SET status = 'expired'
        WHERE id = ${attemptId} AND clerk_user_id = ${userId} AND status = 'started'
      `;
      return fail('ATTEMPT_EXPIRED', 'De tijd voor deze examenpoging is verstreken.', 409);
    }
    const counts = await sql`
      SELECT COUNT(*)::INTEGER AS answered,
        COUNT(*) FILTER (WHERE answer.is_correct)::INTEGER AS correct
      FROM exam_definition_questions_v1 link
      LEFT JOIN exam_attempt_answers_v1 answer
        ON answer.question_id = link.question_id AND answer.attempt_id = ${attemptId}
      WHERE link.exam_id = ${attempt.exam_id}
    `;
    const total = Number(attempt.question_count);
    const score = percentage(Number(counts[0].correct), total);
    const updated = await sql`
      UPDATE exam_attempts_v1
      SET status = 'submitted', score = ${score}, submitted_at = NOW()
      WHERE id = ${attemptId} AND clerk_user_id = ${userId} AND status = 'started'
      RETURNING status, score, submitted_at
    `;
    if (updated[0]) {
      Object.assign(attempt, updated[0]);
    } else {
      const concurrent = await sql`
        SELECT status, score, submitted_at
        FROM exam_attempts_v1
        WHERE id = ${attemptId} AND clerk_user_id = ${userId}
      `;
      if (concurrent[0]?.status !== 'submitted') {
        return fail('ATTEMPT_NOT_ACTIVE', 'Deze examenpoging kon niet worden ingediend.', 409);
      }
      Object.assign(attempt, concurrent[0]);
    }
  } else if (attempt.status !== 'submitted') {
    return fail('ATTEMPT_NOT_ACTIVE', 'Deze examenpoging kan niet worden ingediend.', 409);
  }

  const results = await sql`
    SELECT q.id AS question_id, answer.selected_option, q.correct_option,
      COALESCE(answer.is_correct, FALSE) AS is_correct, q.explanation
    FROM exam_definition_questions_v1 link
    JOIN exam_questions_v1 q ON q.id = link.question_id
    LEFT JOIN exam_attempt_answers_v1 answer
      ON answer.question_id = q.id AND answer.attempt_id = ${attemptId}
    WHERE link.exam_id = ${attempt.exam_id}
    ORDER BY link.sort_order
  `;
  return ok({
    result: {
      attemptId,
      status: attempt.status,
      score: attempt.score,
      passed: Number(attempt.score) >= Number(attempt.pass_score),
      submittedAt: attempt.submitted_at,
      answers: results.map((row) => ({
        questionId: Number(row.question_id),
        selectedOption: row.selected_option,
        correctOption: row.correct_option,
        isCorrect: row.is_correct,
        explanation: localized(row.explanation, language)
      }))
    }
  });
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      const access = await requireCourseAccess(sql, auth.userId);
      if (access.error) return fail('ACCESS_REQUIRED', 'Geen actieve toegang.', 403);
      const body = await parseBody(request);
      if (!body || !['start', 'answer', 'submit'].includes(body.action)) {
        return fail('VALIDATION_ERROR', 'Een geldige action is verplicht.', 422);
      }
      const language = locale(body.locale);
      if (body.action === 'start') return startAttempt(sql, auth.userId, body, language);
      if (body.action === 'answer') return saveAnswer(sql, auth.userId, body);
      return submitAttempt(sql, auth.userId, body, language);
    } catch (error) {
      console.error('v1 exam attempts endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'De examenpoging kon niet worden verwerkt.', 503);
    }
  }
};
