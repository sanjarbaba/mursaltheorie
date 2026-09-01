import { authenticate, ensureUser, getSql, hasCourseAccess, json, parseBody } from './_lib.js';

export default {
  async fetch(request) {
    if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'Methode niet toegestaan.' }, 405, { Allow: 'GET, PUT' });
    const auth = await authenticate(request);
    if (auth.error) return auth.error;

    try {
      const sql = getSql();
      const profile = request.method === 'PUT' ? (await parseBody(request) || {}) : {};
      const user = await ensureUser(sql, auth.userId, profile);
      return json({ user: { ...user, hasAccess: hasCourseAccess(user) } });
    } catch (error) {
      console.error('me endpoint failed', error);
      return json({ error: 'Database tijdelijk niet beschikbaar.' }, 503);
    }
  }
};
