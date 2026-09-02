import { authenticate, ensureUser, getSql, parseBody } from '../_lib.js';
import { fail, ok } from './_contract.js';
import { deviceId, platform } from './_sync.js';

export default {
  async fetch(request) {
    if (!['GET', 'PUT'].includes(request.method)) return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);

      if (request.method === 'GET') {
        const rows = await sql`
          SELECT device_id, platform, last_seen_at, created_at
          FROM user_devices
          WHERE clerk_user_id = ${auth.userId}
          ORDER BY last_seen_at DESC
        `;
        return ok({ devices: rows });
      }

      const body = await parseBody(request);
      const normalizedDeviceId = deviceId(body?.deviceId);
      const normalizedPlatform = platform(body?.platform);
      const pushToken = body?.pushToken == null ? null : String(body.pushToken).trim();
      if (!normalizedDeviceId || !normalizedPlatform || (pushToken && pushToken.length > 4096)) {
        return fail('VALIDATION_ERROR', 'Ongeldige apparaatregistratie.', 422);
      }

      const rows = await sql`
        INSERT INTO user_devices (clerk_user_id, device_id, platform, push_token, last_seen_at)
        VALUES (${auth.userId}, ${normalizedDeviceId}, ${normalizedPlatform}, ${pushToken || null}, NOW())
        ON CONFLICT (clerk_user_id, device_id) DO UPDATE SET
          platform = EXCLUDED.platform,
          push_token = COALESCE(EXCLUDED.push_token, user_devices.push_token),
          last_seen_at = NOW()
        RETURNING device_id, platform, last_seen_at, created_at
      `;
      return ok({ device: rows[0] });
    } catch (error) {
      console.error('v1 devices endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Apparaat kon niet worden geregistreerd.', 503);
    }
  }
};

