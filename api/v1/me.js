import { createClerkClient } from '@clerk/backend';
import { authenticate, ensureUser, getSql, hasCourseAccess, parseBody } from '../_lib.js';
import { fail, ok } from './_contract.js';
import { accountExport, validDeletionConfirmation } from './_privacy.js';

async function exportAccount(sql, userId) {
  const [profiles, progress, examAttempts, entitlements, purchases, devices] = await Promise.all([
    sql`SELECT clerk_user_id, email, display_name, access_status, access_starts_at, access_ends_at, created_at, updated_at FROM app_users WHERE clerk_user_id = ${userId}`,
    sql`SELECT lesson_id, completed, progress_percent, client_updated_at, device_id, updated_at FROM lesson_progress WHERE clerk_user_id = ${userId} ORDER BY lesson_id`,
    sql`SELECT a.id, e.exam_number, a.status, a.score, a.started_at, a.submitted_at FROM exam_attempts_v1 a JOIN exam_definitions e ON e.id = a.exam_id WHERE a.clerk_user_id = ${userId} ORDER BY a.started_at DESC`,
    sql`SELECT product_key, source, status, starts_at, ends_at, created_at, updated_at FROM entitlements WHERE clerk_user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT provider_payment_id, product_key, description, amount_value, amount_currency, status, consent_version, consent_text, consented_at, paid_at, confirmation_sent_at, activated_at, withdrawal_requested_at, refund_reference, refunded_at, created_at FROM purchase_orders WHERE clerk_user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT device_id, platform, last_seen_at, created_at FROM user_devices WHERE clerk_user_id = ${userId} ORDER BY last_seen_at DESC`
  ]);
  return accountExport({ profile: profiles[0], progress, examAttempts, entitlements, purchases, devices });
}

async function deleteAccount(sql, userId) {
  await sql`DELETE FROM exam_attempts_v1 WHERE clerk_user_id = ${userId}`;
  await sql`DELETE FROM lesson_progress WHERE clerk_user_id = ${userId}`;
  await sql`DELETE FROM entitlements WHERE clerk_user_id = ${userId}`;
  await sql`DELETE FROM user_devices WHERE clerk_user_id = ${userId}`;
  await sql`DELETE FROM app_users WHERE clerk_user_id = ${userId}`;
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  await clerk.users.deleteUser(userId);
}

async function handler(request) {
    if (!['GET', 'PUT', 'DELETE'].includes(request.method)) return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      if (request.method === 'DELETE') {
        const body = await parseBody(request);
        if (!validDeletionConfirmation(body)) {
          return fail('CONFIRMATION_REQUIRED', 'Typ exact: VERWIJDER MIJN ACCOUNT', 422);
        }
        await deleteAccount(sql, auth.userId);
        return ok({ deleted: true });
      }

      const url = new URL(request.url);
      if (request.method === 'GET' && url.searchParams.get('resource') === 'export') {
        return ok({ export: await exportAccount(sql, auth.userId) });
      }

      const profile = request.method === 'PUT' ? await parseBody(request) : {};
      if (request.method === 'PUT' && (!profile || typeof profile !== 'object' || Array.isArray(profile))) {
        return fail('INVALID_BODY', 'Ongeldige profielgegevens.', 400);
      }
      const user = await ensureUser(sql, auth.userId, profile || {});
      return ok({ user: { ...user, hasAccess: hasCourseAccess(user) } });
    } catch (error) {
      console.error('v1 me endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Database tijdelijk niet beschikbaar.', 503);
    }
}

export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
