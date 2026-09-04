import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const access = fs.readFileSync(new URL('../api/v1/access.js', import.meta.url), 'utf8');
const email = fs.readFileSync(new URL('../api/v1/_email.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../database/migrations/031_purchase_activation_and_withdrawal.sql', import.meta.url), 'utf8');
const terms = fs.readFileSync(new URL('../voorwaarden.html', import.meta.url), 'utf8');

test('purchase consent, confirmation and activation are auditable', () => {
  assert.match(migration, /consent_text TEXT NOT NULL/);
  assert.match(migration, /consented_at TIMESTAMPTZ NOT NULL/);
  assert.match(migration, /confirmation_sent_at TIMESTAMPTZ/);
  assert.match(migration, /activated_at TIMESTAMPTZ/);
  assert.match(access, /CONSENT_VERSION/);
  assert.match(access, /confirmation_sent_at IS NOT NULL/);
  assert.match(email, /purchase-confirmation-\$\{orderId\}/);
});

test('online withdrawal records time, refunds and sends a receipt', () => {
  assert.match(migration, /withdrawal_requested_at TIMESTAMPTZ/);
  assert.match(migration, /refund_reference TEXT/);
  assert.match(email, /withdrawal-confirmation-\$\{orderId\}/);
  assert.match(terms, /learn5\?withdraw=1/);
});
