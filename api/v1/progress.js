import { authenticate, ensureUser, getSql, parseBody, requireCourseAccess } from '../_lib.js';
import { fail, integer, ok, requestId } from './_contract.js';
import { clientTimestamp, deviceId, syncMutationId } from './_sync.js';

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

      const resource = new URL(request.url).searchParams.get('resource');
      if (resource === 'training') {
        if (request.method === 'GET') {
          const rows = await sql`SELECT answered, correct, scenario_index, client_updated_at, updated_at FROM training_progress WHERE clerk_user_id=${auth.userId}`;
          return ok({ progress: rows[0] || { answered: 0, correct: 0, scenario_index: 0 } });
        }
        const training = await parseBody(request);
        const answered = integer(training?.answered, { min: 0, max: 1000000 });
        const correct = integer(training?.correct, { min: 0, max: 1000000 });
        const scenarioIndex = integer(training?.scenarioIndex, { min: 0, max: 1000000 });
        const updated = clientTimestamp(training?.clientUpdatedAt || new Date().toISOString());
        if (answered === null || correct === null || correct > answered || scenarioIndex === null || !updated) {
          return fail('VALIDATION_ERROR', 'Ongeldige trainingsvoortgang.', 422);
        }
        const rows = await sql`
          INSERT INTO training_progress(clerk_user_id,answered,correct,scenario_index,client_updated_at,updated_at)
          VALUES(${auth.userId},${answered},${correct},${scenarioIndex},${updated},NOW())
          ON CONFLICT(clerk_user_id) DO UPDATE SET answered=EXCLUDED.answered,correct=EXCLUDED.correct,scenario_index=EXCLUDED.scenario_index,client_updated_at=EXCLUDED.client_updated_at,updated_at=NOW()
          WHERE EXCLUDED.client_updated_at >= training_progress.client_updated_at
          RETURNING answered,correct,scenario_index,client_updated_at,updated_at`;
        if (rows[0]) return ok({ progress: rows[0], applied: true });
        const current = await sql`SELECT answered,correct,scenario_index,client_updated_at,updated_at FROM training_progress WHERE clerk_user_id=${auth.userId}`;
        return ok({ progress: current[0], applied: false });
      }

      if (request.method === 'GET') {
        const url = new URL(request.url);
        const sinceValue = url.searchParams.get('since');
        const since = sinceValue ? clientTimestamp(sinceValue) : null;
        if (sinceValue && !since) return fail('VALIDATION_ERROR', 'Ongeldige since-tijd.', 422);
        const rows = since
          ? await sql`
              SELECT lesson_id, completed, progress_percent, client_updated_at,
                device_id, mutation_id, updated_at
              FROM lesson_progress
              WHERE clerk_user_id = ${auth.userId} AND updated_at > ${since}
              ORDER BY lesson_id
            `
          : await sql`
              SELECT lesson_id, completed, progress_percent, client_updated_at,
                device_id, mutation_id, updated_at
              FROM lesson_progress
              WHERE clerk_user_id = ${auth.userId}
              ORDER BY lesson_id
            `;
        return ok({ progress: rows, serverTime: new Date().toISOString() });
      }

      const body = await parseBody(request);
      const lessonId = integer(body?.lessonId, { min: 1, max: 150 });
      const progressPercent = body?.progressPercent == null
        ? (body?.completed ? 100 : 0)
        : integer(body.progressPercent, { min: 0, max: 100 });
      const incomingClientTime = body?.clientUpdatedAt == null
        ? new Date().toISOString()
        : clientTimestamp(body.clientUpdatedAt);
      const normalizedDeviceId = body?.deviceId == null ? 'web-legacy' : deviceId(body.deviceId);
      const normalizedMutationId = body?.mutationId == null ? null : syncMutationId(body.mutationId);
      if (lessonId === null || typeof body?.completed !== 'boolean' || progressPercent === null
        || !incomingClientTime || !normalizedDeviceId || (body?.mutationId != null && !normalizedMutationId)) {
        return fail('VALIDATION_ERROR', 'Ongeldige voortgangsmutatie.', 422);
      }

      if (normalizedMutationId) {
        const duplicate = await sql`
          SELECT lesson_id, completed, progress_percent, client_updated_at,
            device_id, mutation_id, updated_at
          FROM lesson_progress
          WHERE clerk_user_id = ${auth.userId} AND mutation_id = ${normalizedMutationId}
          LIMIT 1
        `;
        if (duplicate[0]) return ok({ progress: duplicate[0], applied: false, idempotent: true, requestId: requestId(request) });
      }

      let rows;
      try {
        rows = await sql`
          INSERT INTO lesson_progress (
            clerk_user_id, lesson_id, completed, progress_percent,
            client_updated_at, device_id, mutation_id, updated_at
          ) VALUES (
            ${auth.userId}, ${lessonId}, ${body.completed}, ${progressPercent},
            ${incomingClientTime}, ${normalizedDeviceId}, ${normalizedMutationId}, NOW()
          )
          ON CONFLICT (clerk_user_id, lesson_id) DO UPDATE SET
            completed = EXCLUDED.completed,
            progress_percent = EXCLUDED.progress_percent,
            client_updated_at = EXCLUDED.client_updated_at,
            device_id = EXCLUDED.device_id,
            mutation_id = EXCLUDED.mutation_id,
            updated_at = NOW()
          WHERE EXCLUDED.client_updated_at >= COALESCE(lesson_progress.client_updated_at, '-infinity'::timestamptz)
          RETURNING lesson_id, completed, progress_percent, client_updated_at,
            device_id, mutation_id, updated_at
        `;
      } catch (error) {
        if (error?.code !== '23505' || !normalizedMutationId) throw error;
        rows = await sql`
          SELECT lesson_id, completed, progress_percent, client_updated_at,
            device_id, mutation_id, updated_at
          FROM lesson_progress
          WHERE clerk_user_id = ${auth.userId} AND mutation_id = ${normalizedMutationId}
          LIMIT 1
        `;
        return ok({ progress: rows[0], applied: false, idempotent: true, requestId: requestId(request) });
      }

      if (rows[0]) return ok({ progress: rows[0], applied: true, idempotent: false, requestId: requestId(request) });
      const current = await sql`
        SELECT lesson_id, completed, progress_percent, client_updated_at,
          device_id, mutation_id, updated_at
        FROM lesson_progress
        WHERE clerk_user_id = ${auth.userId} AND lesson_id = ${lessonId}
      `;
      return ok({ progress: current[0], applied: false, idempotent: false, requestId: requestId(request) });
    } catch (error) {
      console.error('v1 progress endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Voortgang kon niet worden verwerkt.', 503);
    }
  }
};

