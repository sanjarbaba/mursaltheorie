import { authenticate, ensureUser, getSql, parseBody } from '../_lib.js';
import { fail, ok } from './_contract.js';
import { GOOGLE_PACKAGE, GOOGLE_PRODUCTS, googleReady, googleAccountId, purchaseHash,
  validateGooglePurchase, testPurchaseAllowed, getGooglePurchase, consumeGooglePurchase,
  verifyGoogleNotification } from './_google_iap.js';

async function accountId(sql, userId) {
  const id = googleAccountId(userId);
  await sql`INSERT INTO google_account_tokens (clerk_user_id, account_id) VALUES (${userId}, ${id})
    ON CONFLICT (clerk_user_id) DO NOTHING`;
  const rows = await sql`SELECT account_id FROM google_account_tokens WHERE clerk_user_id = ${userId}`;
  return rows[0].account_id;
}
export async function verifyAndRecord(sql, userId, productId, token, dependencies = {}) {
  const lookup = dependencies.lookup || getGooglePurchase;
  const consume = dependencies.consume || consumeGooglePurchase;
  const expected = await accountId(sql, userId);
  const value = await lookup(productId, token);
  const verified = validateGooglePurchase(value, { productId, token, accountId: expected, allowTest: testPurchaseAllowed(userId) });
  const existing = await sql`SELECT clerk_user_id FROM google_iap_transactions WHERE token_hash = ${verified.tokenHash}`;
  if (verified.consumed && !verified.revoked && !existing[0]) throw new Error('Consumed purchase has no account record');
  const recorded = await sql`SELECT * FROM record_google_iap_transaction(
    ${verified.tokenHash}, ${userId}, ${verified.productKey}, ${productId}, ${verified.purchaseAt}::timestamptz, ${verified.revoked})`;
  // Persist access before consumption. A failed consume is retried by the app or RTDN;
  // the unique token and SQL function make this safe after a network timeout.
  if (!verified.consumed && !verified.revoked && recorded[0].entitlement_status === 'active') await consume(productId, token);
  return { productId, status: recorded[0].entitlement_status, accessUntil: recorded[0].access_until };
}
async function notification(request) {
  try { await verifyGoogleNotification(request); }
  catch { return fail('UNAUTHORIZED_NOTIFICATION', 'Ongeldige afzender.', 401); }
  const body = await parseBody(request);
  const encoded = body?.message?.data;
  if (typeof encoded !== 'string' || encoded.length > 20000) return fail('INVALID_NOTIFICATION', 'Ongeldige melding.', 400);
  const event = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  if (event.packageName !== GOOGLE_PACKAGE) return fail('INVALID_PACKAGE', 'Ongeldige app.', 400);
  if (event.testNotification) return ok({ received: true });
  const notice = event.oneTimeProductNotification || event.voidedPurchaseNotification;
  if (!notice?.purchaseToken) return ok({ received: true, ignored: true });
  if (!googleReady()) return fail('GOOGLE_NOT_AVAILABLE', 'Aankopen zijn tijdelijk niet beschikbaar.', 503);
  const sql = getSql();
  const hash = purchaseHash(notice.purchaseToken);
  const known = await sql`SELECT clerk_user_id, product_id FROM google_iap_transactions WHERE token_hash = ${hash}`;
  // A deleted account cannot be granted access again by a late notification.
  if (known[0] && !known[0].clerk_user_id) return ok({ received: true, deletedAccount: true });
  const productId = notice.sku || known[0]?.product_id;
  if (!GOOGLE_PRODUCTS[productId]) return fail('PURCHASE_NOT_LINKED', 'Aankoop wacht op koppeling.', 503);
  const current = await getGooglePurchase(productId, notice.purchaseToken);
  const linked = await sql`SELECT clerk_user_id FROM google_account_tokens WHERE account_id = ${current.obfuscatedExternalAccountId || ''}`;
  const userId = linked[0]?.clerk_user_id || known[0]?.clerk_user_id;
  if (!userId) return fail('ACCOUNT_NOT_LINKED', 'Aankoop wacht op accountkoppeling.', 503);
  // Google state must reflect a cancellation/refund before acknowledging the notification.
  const mustRevoke = Boolean(event.voidedPurchaseNotification) || notice.notificationType === 2;
  if (mustRevoke && current.purchaseState !== 1 && current.refundableQuantity !== 0) return fail('STATE_PENDING', 'Terugbetaling wordt verwerkt.', 503);
  await verifyAndRecord(sql, userId, productId, notice.purchaseToken, { lookup: async () => current });
  return ok({ received: true });
}
async function handler(request) {
  try {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.searchParams.get('resource') === 'notification') return await notification(request);
    if (!googleReady()) return request.method === 'GET' ? ok({ enabled: false, products: [] }) : fail('GOOGLE_NOT_AVAILABLE', 'Aankopen zijn tijdelijk niet beschikbaar.', 503);
    const sql = getSql();
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);
    await ensureUser(sql, auth.userId);
    if (request.method === 'GET') return ok({ enabled: true, obfuscatedAccountId: await accountId(sql, auth.userId), products: Object.keys(GOOGLE_PRODUCTS) });
    if (request.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const body = await parseBody(request);
    if (!GOOGLE_PRODUCTS[body?.productId]) return fail('INVALID_PRODUCT', 'Ongeldig pakket.', 422);
    purchaseHash(body?.purchaseToken);
    return ok(await verifyAndRecord(sql, auth.userId, body.productId, body.purchaseToken));
  } catch {
    // Google errors can include credential-bearing URLs; never log raw errors or tokens.
    return fail('GOOGLE_VERIFICATION_FAILED', 'De aankoop kon nog niet worden bevestigd. Probeer aankopen herstellen.', 503);
  }
}
export const GET = handler;
export const POST = handler;
