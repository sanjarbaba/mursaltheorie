import { authenticate, ensureUser, getSql, parseBody, requireCourseAccess } from '../_lib.js';
import { fail, integer, ok } from './_contract.js';
import { clientTimestamp } from './_sync.js';

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
        const rows = await sql`SELECT answered, correct, scenario_index, client_updated_at, updated_at FROM training_progress WHERE clerk_user_id=${auth.userId}`;
        return ok({ progress: rows[0] || { answered: 0, correct: 0, scenario_index: 0 } });
      }
      const body = await parseBody(request);
      const answered = integer(body?.answered, { min: 0, max: 1000000 });
      const correct = integer(body?.correct, { min: 0, max: 1000000 });
      const scenarioIndex = integer(body?.scenarioIndex, { min: 0, max: 1000000 });
      const updated = clientTimestamp(body?.clientUpdatedAt || new Date().toISOString());
      if (answered === null || correct === null || correct > answered || scenarioIndex === null || !updated) return fail('VALIDATION_ERROR', 'Ongeldige trainingsvoortgang.', 422);
      const rows = await sql`
        INSERT INTO training_progress(clerk_user_id,answered,correct,scenario_index,client_updated_at,updated_at)
        VALUES(${auth.userId},${answered},${correct},${scenarioIndex},${updated},NOW())
        ON CONFLICT(clerk_user_id) DO UPDATE SET answered=EXCLUDED.answered,correct=EXCLUDED.correct,scenario_index=EXCLUDED.scenario_index,client_updated_at=EXCLUDED.client_updated_at,updated_at=NOW()
        WHERE EXCLUDED.client_updated_at >= training_progress.client_updated_at
        RETURNING answered,correct,scenario_index,client_updated_at,updated_at`;
      if (rows[0]) return ok({ progress: rows[0], applied: true });
      const current = await sql`SELECT answered,correct,scenario_index,client_updated_at,updated_at FROM training_progress WHERE clerk_user_id=${auth.userId}`;
      return ok({ progress: current[0], applied: false });
    } catch (error) {
      console.error('v1 training progress endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Trainingsvoortgang kon niet worden verwerkt.', 503);
    }
  }
};

