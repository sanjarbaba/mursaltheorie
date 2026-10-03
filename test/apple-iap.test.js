import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Environment, InAppOwnershipType, Type } from '@apple/app-store-server-library';
import {
  appleAccountToken, applePurchasesEnabled, applePurchasesVisibleTo, sameAccountToken,
  sandboxAllowed, validateAppleTransaction
} from '../api/v1/_apple_iap.js';

const names = [
  'APPLE_ACCOUNT_TOKEN_SECRET', 'APPLE_IAP_ENABLED', 'APPLE_IAP_KEY_ID',
  'APPLE_IAP_ISSUER_ID', 'APPLE_IAP_PRIVATE_KEY', 'APPLE_APP_ID',
  'APPLE_IAP_SANDBOX_TEST_USER_IDS', 'APPLE_IAP_TEST_USER_IDS',
  'APPLE_IAP_PUBLIC_ENABLED', 'VERCEL_ENV'
];
const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));

before(() => {
  process.env.APPLE_ACCOUNT_TOKEN_SECRET = 'a-test-secret-that-is-at-least-32-characters-long';
  process.env.APPLE_IAP_ENABLED = 'false';
});

after(() => {
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

test('Apple account token is stable, unique per Clerk account, and UUID shaped', () => {
  const token = appleAccountToken('user_one');
  assert.match(token, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(token, appleAccountToken('user_one'));
  assert.notEqual(token, appleAccountToken('user_two'));
  assert.ok(sameAccountToken(token.toUpperCase(), token));
  assert.equal(sameAccountToken(token, appleAccountToken('user_two')), false);
});

test('purchase feature remains off without explicit activation and complete credentials', () => {
  assert.equal(applePurchasesEnabled(), false);
  process.env.APPLE_IAP_ENABLED = 'true';
  assert.equal(applePurchasesEnabled(), false);
  process.env.APPLE_IAP_ENABLED = 'false';
});

test('purchase screen is limited to named test accounts until public release', () => {
  process.env.APPLE_IAP_KEY_ID = 'test-key';
  process.env.APPLE_IAP_ISSUER_ID = 'test-issuer';
  process.env.APPLE_IAP_PRIVATE_KEY = 'test-private-key';
  process.env.APPLE_APP_ID = '6817092966';
  process.env.APPLE_IAP_ENABLED = 'true';
  process.env.APPLE_IAP_TEST_USER_IDS = 'user_one,user_two';
  assert.equal(applePurchasesVisibleTo('user_one'), true);
  assert.equal(applePurchasesVisibleTo('real_customer'), false);
  delete process.env.APPLE_IAP_TEST_USER_IDS;
  assert.equal(applePurchasesVisibleTo('real_customer'), false);
  process.env.APPLE_IAP_PUBLIC_ENABLED = 'true';
  assert.equal(applePurchasesVisibleTo('real_customer'), true);
  process.env.APPLE_IAP_PUBLIC_ENABLED = 'false';
  process.env.APPLE_IAP_ENABLED = 'false';
});

test('server accepts only the exact app, product, account and purchase shape', () => {
  const token = appleAccountToken('user_one');
  const valid = {
    productId: 'nl.mursaltheorie.course.nl.fa.30d',
    bundleId: 'nl.mursaltheorie.app',
    environment: Environment.PRODUCTION,
    type: Type.NON_RENEWING_SUBSCRIPTION,
    inAppOwnershipType: InAppOwnershipType.PURCHASED,
    appAccountToken: token,
    transactionId: '123456789012345',
    purchaseDate: Date.now() - 1000,
    quantity: 1
  };
  assert.equal(validateAppleTransaction(valid, Environment.PRODUCTION, token).productKey, 'theory_b_nl_fa_30d');
  for (const change of [
    { productId: 'unknown' },
    { bundleId: 'nl.someoneelse.app' },
    { environment: Environment.SANDBOX },
    { type: Type.CONSUMABLE },
    { inAppOwnershipType: InAppOwnershipType.FAMILY_SHARED },
    { appAccountToken: appleAccountToken('user_two') },
    { transactionId: 'not-a-transaction' },
    { purchaseDate: Date.now() + 3600_000 },
    { quantity: 2 }
  ]) {
    assert.throws(() => validateAppleTransaction({ ...valid, ...change }, Environment.PRODUCTION, token));
  }
});

test('production rejects sandbox transactions outside named test accounts', () => {
  process.env.VERCEL_ENV = 'production';
  process.env.APPLE_IAP_SANDBOX_TEST_USER_IDS = 'user_one,user_two';
  assert.equal(sandboxAllowed('user_one'), true);
  assert.equal(sandboxAllowed('real_customer'), false);
});
