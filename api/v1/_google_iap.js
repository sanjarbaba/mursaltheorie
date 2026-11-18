import { createHash, createHmac } from 'node:crypto';

export const GOOGLE_PACKAGE = 'nl.mursaltheorie.app';
export const GOOGLE_PRODUCTS = Object.freeze({
  'nl.mursaltheorie.course.nl.30d': 'theory_b_nl_30d',
  'nl.mursaltheorie.course.nl.fa.30d': 'theory_b_nl_fa_30d',
  'nl.mursaltheorie.course.nl.ps.30d': 'theory_b_nl_ps_30d'
});
export function googleReady(env = process.env) {
  return env.GOOGLE_PLAY_BILLING_ENABLED === 'true'
    && Boolean(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)
    && (env.GOOGLE_PLAY_ACCOUNT_SECRET || '').length >= 32
    && Boolean(env.GOOGLE_PLAY_NOTIFICATION_AUDIENCE && env.GOOGLE_PLAY_NOTIFICATION_EMAIL);
}
export function googleAccountId(userId, secret = process.env.GOOGLE_PLAY_ACCOUNT_SECRET) {
  if (!userId || !secret || secret.length < 32) throw new Error('Missing Google account configuration');
  return createHmac('sha256', secret).update('mursal-google:' + userId).digest('hex');
}
export function purchaseHash(token) {
  if (typeof token !== 'string' || token.length < 10 || token.length > 4096 || /\s/.test(token)) throw new Error('Invalid purchase token');
  return createHash('sha256').update(token).digest('hex');
}
export function validateGooglePurchase(value, { productId, token, accountId, allowTest = false, now = Date.now() }) {
  const productKey = GOOGLE_PRODUCTS[productId];
  if (!productKey || !value || typeof value !== 'object') throw new Error('Invalid product');
  purchaseHash(token);
  if (value.productId !== undefined && value.productId !== productId) throw new Error('Product mismatch');
  if (value.purchaseToken !== undefined && value.purchaseToken !== token) throw new Error('Token mismatch');
  if (!accountId || value.obfuscatedExternalAccountId !== accountId) throw new Error('Account mismatch');
  if (![0, 1, 2].includes(value.purchaseState) || ![0, 1].includes(value.consumptionState)) throw new Error('Invalid purchase state');
  if (value.purchaseState === 2) throw new Error('Purchase pending');
  if ((value.quantity ?? 1) !== 1) throw new Error('Invalid quantity');
  if (value.refundableQuantity !== undefined && ![0, 1].includes(value.refundableQuantity)) throw new Error('Invalid refundable quantity');
  if (value.purchaseType !== undefined && !(value.purchaseType === 0 && allowTest)) throw new Error('Nonstandard purchase not permitted');
  const purchased = Number(value.purchaseTimeMillis);
  if (!Number.isSafeInteger(purchased) || purchased < Date.UTC(2020, 0, 1) || purchased > now + 300000) throw new Error('Invalid purchase time');
  return { productId, productKey, tokenHash: purchaseHash(token), purchaseAt: new Date(purchased).toISOString(),
    revoked: value.purchaseState === 1 || value.refundableQuantity === 0,
    consumed: value.consumptionState === 1 };
}
export function testPurchaseAllowed(userId, env = process.env) {
  return (env.GOOGLE_PLAY_TEST_USER_IDS || '').split(',').map(x => x.trim()).filter(Boolean).includes(userId);
}
let authClient;
async function client() {
  if (!authClient) {
    const { GoogleAuth } = await import('google-auth-library');
    authClient = await new GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/androidpublisher'] }).getClient();
  }
  return authClient;
}
function purchaseUrl(productId, token) {
  if (!GOOGLE_PRODUCTS[productId]) throw new Error('Unknown product');
  purchaseHash(token);
  return 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' + GOOGLE_PACKAGE
    + '/purchases/products/' + encodeURIComponent(productId) + '/tokens/' + encodeURIComponent(token);
}
export async function getGooglePurchase(productId, token) {
  const response = await (await client()).request({ url: purchaseUrl(productId, token), method: 'GET', timeout: 10000 });
  return response.data;
}
export async function consumeGooglePurchase(productId, token) {
  await (await client()).request({ url: purchaseUrl(productId, token) + ':consume', method: 'POST', data: {}, timeout: 10000 });
}
export async function verifyGoogleNotification(request) {
  const bearer = request.headers.get('authorization') || '';
  if (!bearer.startsWith('Bearer ')) throw new Error('Missing notification authentication');
  const { OAuth2Client } = await import('google-auth-library');
  const ticket = await new OAuth2Client().verifyIdToken({ idToken: bearer.slice(7), audience: process.env.GOOGLE_PLAY_NOTIFICATION_AUDIENCE });
  const payload = ticket.getPayload();
  if (payload?.email !== process.env.GOOGLE_PLAY_NOTIFICATION_EMAIL || payload.email_verified !== true) throw new Error('Untrusted notification sender');
}
