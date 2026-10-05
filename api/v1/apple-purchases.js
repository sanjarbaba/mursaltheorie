import { APIException } from '@apple/app-store-server-library';
import { authenticate, ensureUser, getSql, parseBody } from '../_lib.js';
import { fail, ok } from './_contract.js';
import {
  APPLE_PRODUCTS, appleAccountToken, appleConfigurationReady, applePurchasesEnabled,
  applePurchasesVisibleTo,
  sandboxAllowed, validateAppleTransaction, verifiedNotification,
  verifiedSignedTransaction, verifiedTransactionInfo
} from './_apple_iap.js';

async function accountToken(sql, userId) {
  const token = appleAccountToken(userId);
  await sql`
    INSERT INTO apple_account_tokens (clerk_user_id, app_account_token)
    VALUES (${userId}, ${token}::uuid)
    ON CONFLICT (clerk_user_id) DO NOTHING
  `;
  const rows = await sql`SELECT app_account_token::text AS token FROM apple_account_tokens WHERE clerk_user_id = ${userId}`;
  return rows[0].token;
}

async function recordTransaction(sql, userId, value) {
  const rows = await sql`
    SELECT * FROM record_apple_iap_transaction(
      ${value.environment}, ${value.transactionId}, ${userId}, ${value.productKey},
      ${value.productId}, ${value.purchaseAt}::timestamptz,
      ${value.revokedAt}::timestamptz, ${sandboxAllowed(userId)}
    )
  `;
  return rows[0];
}

async function getConfiguration(sql, userId) {
  if (!applePurchasesVisibleTo(userId)) return ok({ enabled: false, products: [] });
  const token = await accountToken(sql, userId);
  return ok({
    enabled: true,
    appAccountToken: token,
    products: Object.keys(APPLE_PRODUCTS)
  });
}

async function verifyPurchase(sql, userId, request) {
  if (!applePurchasesVisibleTo(userId)) return fail('APPLE_NOT_AVAILABLE', 'Apple-aankopen zijn nog niet beschikbaar.', 503);
  const body = await parseBody(request);
  const transactionId = typeof body?.transactionId === 'string' ? body.transactionId.trim() : '';
  if (!/^[0-9]{1,30}$/.test(transactionId)) return fail('INVALID_TRANSACTION', 'Ongeldige Apple-transactie.', 422);

  const expectedToken = await accountToken(sql, userId);
  let verified;
  try {
    const { transaction, environment } = await verifiedTransactionInfo(transactionId);
    verified = validateAppleTransaction(transaction, environment, expectedToken);
  } catch (error) {
    console.error('Apple purchase verification failed', error?.constructor?.name,
      error instanceof APIException ? error.httpStatusCode : null,
      error instanceof APIException ? error.apiError : null);
    return fail('APPLE_VERIFICATION_FAILED', 'De Apple-aankoop kon nog niet worden bevestigd.', 422);
  }
  if (verified.environment === 'Sandbox' && !sandboxAllowed(userId)) {
    return fail('SANDBOX_ONLY', 'Deze testaankoop kan geen echte cursustoegang geven.', 403);
  }

  const recorded = await recordTransaction(sql, userId, verified);
  return ok({
    transactionId: verified.transactionId,
    productId: verified.productId,
    status: recorded.entitlement_status,
    accessUntil: recorded.access_until
  });
}

async function receiveNotification(sql, request) {
  if (!applePurchasesEnabled()) return fail('APPLE_NOT_AVAILABLE', 'Apple-aankopen zijn nog niet beschikbaar.', 503);
  const body = await parseBody(request);
  let decoded;
  try {
    decoded = await verifiedNotification(body?.signedPayload);
  } catch (error) {
    console.error('Apple notification verification failed', error?.constructor?.name);
    return fail('INVALID_NOTIFICATION', 'Ongeldige Apple-melding.', 400);
  }
  const { notification, environment } = decoded;
  if (notification.notificationType === 'TEST') return ok({ received: true });
  if (!notification.notificationUUID || !notification.data?.signedTransactionInfo) {
    return ok({ received: true, ignored: true });
  }

  const notified = await verifiedSignedTransaction(notification.data.signedTransactionInfo, environment);
  if (!/^[0-9]{1,30}$/.test(notified.transactionId || '')) {
    return fail('INVALID_NOTIFICATION', 'Ongeldige Apple-transactie.', 400);
  }
  // Apple's current transaction state takes precedence over a delayed notification.
  const { transaction } = await verifiedTransactionInfo(notified.transactionId, environment);
  const linked = transaction.appAccountToken
    ? await sql`SELECT clerk_user_id, app_account_token::text AS token
        FROM apple_account_tokens WHERE app_account_token = ${transaction.appAccountToken}::uuid`
    : [];
  const existing = linked[0] ? [] : await sql`
    SELECT clerk_user_id FROM apple_iap_transactions
    WHERE environment = ${environment} AND transaction_id = ${transaction.transactionId}
  `;
  const userId = linked[0]?.clerk_user_id || existing[0]?.clerk_user_id;
  if (!userId) return fail('ACCOUNT_NOT_LINKED', 'Apple-aankoop wacht op accountkoppeling.', 503);
  const token = linked[0]?.token || await accountToken(sql, userId);
  const verified = validateAppleTransaction(transaction, environment, token);
  if (environment === 'Sandbox' && !sandboxAllowed(userId)) {
    return ok({ received: true, sandbox: true });
  }
  if (notification.notificationType === 'REFUND' && !verified.revokedAt) {
    return fail('APPLE_STATE_PENDING', 'Terugbetaling wordt nog verwerkt.', 503);
  }
  await recordTransaction(sql, userId, verified);
  const safePayload = {
    environment, transactionId: verified.transactionId,
    productId: verified.productId, revoked: Boolean(verified.revokedAt)
  };
  await sql`
    INSERT INTO purchase_events (provider, provider_event_id, event_type, payload, processed_at)
    VALUES ('apple', ${notification.notificationUUID}, ${notification.notificationType},
      ${JSON.stringify(safePayload)}::jsonb, NOW())
    ON CONFLICT (provider, provider_event_id) DO NOTHING
  `;
  return ok({ received: true });
}

async function handler(request) {
  try {
    const url = new URL(request.url);
    const sql = getSql();
    if (request.method === 'POST' && url.searchParams.get('resource') === 'notification') {
      return await receiveNotification(sql, request);
    }
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);
    await ensureUser(sql, auth.userId);
    if (request.method === 'GET') return getConfiguration(sql, auth.userId);
    if (request.method === 'POST') return verifyPurchase(sql, auth.userId, request);
    return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
  } catch (error) {
    console.error('Apple purchase endpoint failed', error?.constructor?.name, error?.message);
    return fail('APPLE_SERVICE_UNAVAILABLE', 'Apple-aankopen zijn tijdelijk niet beschikbaar.', 503);
  }
}

export const GET = handler;
export const POST = handler;
