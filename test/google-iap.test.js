import test from 'node:test';
import assert from 'node:assert/strict';
import { GOOGLE_PRODUCTS, googleReady, googleAccountId, purchaseHash, validateGooglePurchase } from '../api/v1/_google_iap.js';
import { productLocales } from '../api/v1/_products.js';
const now = Date.parse('2026-11-18T12:00:00Z');
const token = 'test-purchase-token-0123456789';
const accountId = googleAccountId('user-a', 'a'.repeat(32));
const productId = Object.keys(GOOGLE_PRODUCTS)[1];
const valid = { purchaseState: 0, consumptionState: 0, purchaseTimeMillis: String(now - 1000), obfuscatedExternalAccountId: accountId };
const options = { productId, token, accountId, now };

test('every translated Google package includes Dutch and only its purchased translation', () => {
  assert.deepEqual(productLocales(GOOGLE_PRODUCTS[productId]), ['nl', 'fa']);
  assert.deepEqual(productLocales(GOOGLE_PRODUCTS[Object.keys(GOOGLE_PRODUCTS)[2]]), ['nl', 'ps']);
  assert.deepEqual(productLocales(GOOGLE_PRODUCTS[Object.keys(GOOGLE_PRODUCTS)[0]]), ['nl']);
});
test('billing stays off until server credentials and authenticated refund notifications are configured', () => {
  assert.equal(googleReady({}), false);
  const env = { GOOGLE_PLAY_BILLING_ENABLED: 'true', GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: '{}', GOOGLE_PLAY_ACCOUNT_SECRET: 'x'.repeat(32), GOOGLE_PLAY_NOTIFICATION_AUDIENCE: 'https://example.test', GOOGLE_PLAY_NOTIFICATION_EMAIL: 'push@example.test' };
  assert.equal(googleReady(env), true);
  for (const key of Object.keys(env)) assert.equal(googleReady({ ...env, [key]: '' }), false);
});
test('verified purchase maps to its package without trusting client dates or identity', () => {
  const result = validateGooglePurchase(valid, options);
  assert.equal(result.productKey, 'theory_b_nl_fa_30d');
  assert.equal(result.tokenHash, purchaseHash(token));
  assert.equal(result.purchaseAt, new Date(now - 1000).toISOString());
  assert.equal(result.revoked, false);
});
test('pending, malformed and unsupported purchases fail closed', () => {
  for (const change of [{ purchaseState: 2 }, { purchaseState: '0' }, { purchaseState: 9 }, { consumptionState: 7 }, { quantity: 2 }, { quantity: 0 }, { purchaseTimeMillis: 'NaN' }, { purchaseTimeMillis: String(now + 300001) }, { purchaseTimeMillis: '1' }, { refundableQuantity: 2 }]) {
    assert.throws(() => validateGooglePurchase({ ...valid, ...change }, options));
  }
});
test('another account, product or token can never claim the payment', () => {
  for (const change of [{ obfuscatedExternalAccountId: 'another-user' }, { obfuscatedExternalAccountId: undefined }, { productId: 'other' }, { purchaseToken: 'other' }]) assert.throws(() => validateGooglePurchase({ ...valid, ...change }, options));
  assert.throws(() => validateGooglePurchase(valid, { ...options, productId: 'unknown' }));
});
test('test purchases require an explicit allowlist; rewards and promotions cannot grant paid access', () => {
  assert.throws(() => validateGooglePurchase({ ...valid, purchaseType: 0 }, options));
  assert.equal(validateGooglePurchase({ ...valid, purchaseType: 0 }, { ...options, allowTest: true }).revoked, false);
  for (const purchaseType of [1, 2, 9]) assert.throws(() => validateGooglePurchase({ ...valid, purchaseType }, { ...options, allowTest: true }));
});
test('cancellations and full refunds revoke instead of granting access', () => {
  assert.equal(validateGooglePurchase({ ...valid, purchaseState: 1 }, options).revoked, true);
  assert.equal(validateGooglePurchase({ ...valid, refundableQuantity: 0 }, options).revoked, true);
});
test('account identifier is stable, anonymous and distinct between users', () => {
  assert.match(accountId, /^[a-f0-9]{64}$/);
  assert.equal(accountId, googleAccountId('user-a', 'a'.repeat(32)));
  assert.notEqual(accountId, googleAccountId('user-b', 'a'.repeat(32)));
  assert.throws(() => googleAccountId('user-a', 'short'));
  for (const bad of [null, '', 'x', 'bad token 0123456789']) assert.throws(() => purchaseHash(bad));
});

test('refund notifications without authentication are rejected before reading any purchase', async () => {
  const { verifyGoogleNotification } = await import('../api/v1/_google_iap.js');
  await assert.rejects(verifyGoogleNotification(new Request('https://example.test')), /Missing notification authentication/);
});
