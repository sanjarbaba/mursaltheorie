import { authenticate, ensureUser, getSql, hasCourseAccess } from '../_lib.js';
import { accessSummary } from './_access.js';
import { fail, ok } from './_contract.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      const user = await ensureUser(sql, auth.userId);
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
