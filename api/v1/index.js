import { API_VERSION, ok } from './_contract.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Methode niet toegestaan.' } }, {
        status: 405,
        headers: { Allow: 'GET', 'API-Version': API_VERSION }
      });
    }

    return ok({
      service: 'mursaltheorie-api',
      version: API_VERSION,
      status: 'ok'
    });
  }
};
