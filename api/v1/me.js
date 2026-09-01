import { authenticate, ensureUser, getSql, hasCourseAccess, parseBody } from '../_lib.js';
import { fail, ok } from './_contract.js';

export default {
  async fetch(request) {
    if (!['GET', 'PUT'].includes(request.method)) return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const profile = request.method === 'PUT' ? await parseBody(request) : {};
      if (request.method === 'PUT' && (!profile || typeof profile !== 'object' || Array.isArray(profile))) {
        return fail('INVALID_BODY', 'Ongeldige profielgegevens.', 400);
      }
      const user = await ensureUser(getSql(), auth.userId, profile || {});
      return ok({ user: { ...user, hasAccess: hasCourseAccess(user) } });
    } catch (error) {
      console.error('v1 me endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Database tijdelijk niet beschikbaar.', 503);
    }
  }
};
