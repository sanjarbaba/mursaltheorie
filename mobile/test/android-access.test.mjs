import test from 'node:test';
import assert from 'node:assert/strict';
import { canOpenCourse, serverGrantExpiry } from '../src/access-policy.ts';

const now = Date.parse('2026-11-17T18:00:00Z');
const paid = { userId: 'paid-account', status: 'active', validUntil: now + 30_000 };

test('Google sign-in alone does not unlock a new account', () => {
  for (const status of ['checking', 'denied', 'error']) {
    assert.equal(canOpenCourse({ userId: 'google-account', status, validUntil: now + 60_000 }, 'google-account', true, now), false);
  }
  assert.equal(serverGrantExpiry({ hasAccess: false }, now), 0);
});

test('a verified payment unlocks the existing signed-in account without another login', () => {
  const validUntil = serverGrantExpiry({ hasAccess: true, entitlements: [{ ends_at: new Date(now + 30_000).toISOString() }] }, now);
  assert.equal(canOpenCourse({ userId: 'google-account', status: 'active', validUntil }, 'google-account', true, now), true);
});

test('sign-out, switching Google accounts and expiry revoke course access', () => {
  assert.equal(canOpenCourse(paid, 'paid-account', false, now), false);
  assert.equal(canOpenCourse(paid, 'other-google-account', true, now), false);
  assert.equal(canOpenCourse(paid, 'paid-account', true, paid.validUntil), false);
  assert.equal(canOpenCourse(paid, null, true, now), false);
});

test('only explicit server grants unlock; malformed or expired grants fail closed', () => {
  for (const hasAccess of [undefined, false, 'true', 1]) assert.equal(serverGrantExpiry({ hasAccess }, now), 0);
  const expired = serverGrantExpiry({ hasAccess: true, entitlements: [{ ends_at: new Date(now - 1).toISOString() }] }, now);
  assert.equal(canOpenCourse({ ...paid, validUntil: expired }, paid.userId, true, now), false);
  const invalid = serverGrantExpiry({ hasAccess: true, entitlements: [{ ends_at: 'invalid' }] }, now);
  assert.equal(canOpenCourse({ ...paid, validUntil: invalid }, paid.userId, true, now), false);
});

test('refresh checks preserve ongoing exams and allow a still-valid second entitlement', () => {
  assert.equal(serverGrantExpiry({ hasAccess: true }, now), Number.MAX_SAFE_INTEGER);
  assert.equal(serverGrantExpiry({ hasAccess: true, entitlements: [{ ends_at: new Date(now + 3_600_000).toISOString() }] }, now), now + 3_600_000);
  assert.equal(serverGrantExpiry({ hasAccess: true, entitlements: [{ ends_at: new Date(now + 10_000).toISOString() }, { ends_at: new Date(now + 40_000).toISOString() }] }, now), now + 40_000);
});
