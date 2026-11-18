import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { googleAccountId, purchaseHash } from '../api/v1/_google_iap.js';
import { verifyAndRecord } from '../api/v1/google-purchases.js';
const db = new PGlite();
const originalSecret = process.env.GOOGLE_PLAY_ACCOUNT_SECRET;
process.env.GOOGLE_PLAY_ACCOUNT_SECRET = 'integration-test-secret-value-32-characters';
const productId = 'nl.mursaltheorie.course.nl.fa.30d';
const purchaseTimeMillis = String(Date.now() - 60000);
const good = { purchaseState: 0, consumptionState: 0, purchaseTimeMillis, obfuscatedExternalAccountId: googleAccountId('user-a') };
async function sql(parts, ...values) {
  let query = parts[0];
  for (let i = 0; i < values.length; i++) query += '$' + (i + 1) + parts[i + 1];
  return (await db.query(query, values)).rows;
}
before(async () => {
  await db.exec(`CREATE TABLE app_users (clerk_user_id TEXT PRIMARY KEY);
    INSERT INTO app_users VALUES ('user-a'), ('user-b');
    CREATE TABLE entitlements (clerk_user_id TEXT REFERENCES app_users ON DELETE CASCADE, product_key TEXT, source TEXT, external_reference TEXT, status TEXT, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(source, external_reference));
    CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT);`);
  await db.exec(await readFile(new URL('../database/migrations/047_google_in_app_purchases.sql', import.meta.url), 'utf8'));
});
after(async () => { await db.close(); if (originalSecret === undefined) delete process.env.GOOGLE_PLAY_ACCOUNT_SECRET; else process.env.GOOGLE_PLAY_ACCOUNT_SECRET = originalSecret; });

test('durable access exists before consumption and a retry never adds another 30 days', async () => {
  const token = 'integration-purchase-00000001';
  let calls = 0;
  const dependencies = { lookup: async () => good, consume: async () => {
    calls++;
    const record = await db.query('SELECT * FROM entitlements WHERE external_reference = $1', [purchaseHash(token)]);
    assert.equal(record.rows[0].status, 'active');
    if (calls === 1) throw new Error('simulated network timeout');
  } };
  await assert.rejects(verifyAndRecord(sql, 'user-a', productId, token, dependencies));
  const first = (await db.query('SELECT ends_at FROM entitlements WHERE external_reference = $1', [purchaseHash(token)])).rows[0].ends_at;
  const second = await verifyAndRecord(sql, 'user-a', productId, token, dependencies);
  assert.equal(second.status, 'active');
  assert.equal(new Date(second.accessUntil).getTime(), new Date(first).getTime());
  assert.equal((await db.query('SELECT count(*)::int AS n FROM google_iap_transactions')).rows[0].n, 1);
});
test('a refund is terminal even if an old purchased callback arrives later', async () => {
  const token = 'integration-purchase-00000001';
  const noConsume = async () => { throw new Error('revoked purchase must not be consumed'); };
  assert.equal((await verifyAndRecord(sql, 'user-a', productId, token, { lookup: async () => ({ ...good, purchaseState: 1 }), consume: noConsume })).status, 'revoked');
  assert.equal((await verifyAndRecord(sql, 'user-a', productId, token, { lookup: async () => good, consume: noConsume })).status, 'revoked');
});
test('another user cannot replay the same token even if a forged response matches their identity', async () => {
  await assert.rejects(verifyAndRecord(sql, 'user-b', productId, 'integration-purchase-00000001', { lookup: async () => ({ ...good, obfuscatedExternalAccountId: googleAccountId('user-b') }), consume: async () => {} }));
});
test('pending and already consumed unknown payments do not create any entitlement', async () => {
  for (const value of [{ ...good, purchaseState: 2 }, { ...good, consumptionState: 1 }]) {
    await assert.rejects(verifyAndRecord(sql, 'user-a', productId, 'integration-purchase-00000002', { lookup: async () => value, consume: async () => assert.fail('must not consume') }));
  }
  assert.equal((await db.query('SELECT count(*)::int AS n FROM entitlements')).rows[0].n, 1);
});
test('repeat purchases stack, and a refund removes only the refunded pass', async () => {
  const one = 'integration-purchase-00000003', two = 'integration-purchase-00000004';
  const dependencies = { lookup: async () => good, consume: async () => {} };
  const first = await verifyAndRecord(sql, 'user-a', productId, one, dependencies);
  const second = await verifyAndRecord(sql, 'user-a', productId, two, { ...dependencies, lookup: async () => ({ ...good, purchaseTimeMillis: String(Number(purchaseTimeMillis) + 1000) }) });
  assert.equal(new Date(second.accessUntil) - new Date(first.accessUntil), 30 * 86400000);
  await verifyAndRecord(sql, 'user-a', productId, one, { ...dependencies, lookup: async () => ({ ...good, refundableQuantity: 0 }) });
  const remaining = (await db.query('SELECT ends_at FROM entitlements WHERE external_reference = $1', [purchaseHash(two)])).rows[0];
  assert.equal(new Date(remaining.ends_at).getTime(), new Date(first.accessUntil).getTime() + 1000);
});
test('deleting an account keeps a tombstone that blocks reassignment', async () => {
  await db.query('DELETE FROM app_users WHERE clerk_user_id = $1', ['user-a']);
  const ledger = (await db.query('SELECT clerk_user_id FROM google_iap_transactions LIMIT 1')).rows[0];
  assert.equal(ledger.clerk_user_id, null);
  await assert.rejects(verifyAndRecord(sql, 'user-b', productId, 'integration-purchase-00000004', { lookup: async () => ({ ...good, obfuscatedExternalAccountId: googleAccountId('user-b') }), consume: async () => {} }));
});
