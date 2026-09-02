import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const access = fs.readFileSync(new URL('../api/v1/access.js', import.meta.url), 'utf8');

test('Stripe preparation uses hosted checkout and never accepts card data', () => {
  assert.match(access, /https:\/\/api\.stripe\.com\/v1\/checkout\/sessions/);
  assert.match(access, /STRIPE_SECRET_KEY/);
  assert.match(access, /STRIPE_PRICE_ID/);
  assert.doesNotMatch(access, /cardNumber|cvc|expiry/);
});

test('Stripe webhook is signed, idempotent and grants access only after payment', () => {
  assert.match(access, /timingSafeEqual/);
  assert.match(access, /STRIPE_WEBHOOK_SECRET/);
  assert.match(access, /ON CONFLICT\(provider,provider_event_id\) DO NOTHING/);
  assert.match(access, /payment_status === 'paid'/);
  assert.match(access, /'active'/);
});

