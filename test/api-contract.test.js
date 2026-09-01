import assert from 'node:assert/strict';
import test from 'node:test';
import { API_VERSION, fail, integer, locale, localized, ok } from '../api/v1/_contract.js';
import { accessSummary, entitlementIsActive } from '../api/v1/_access.js';
import { mutationId, percentage, publicQuestion } from '../api/v1/_exam.js';

test('integer accepteert alleen gehele getallen binnen het bereik', () => {
  assert.equal(integer('12', { min: 1, max: 150 }), 12);
  assert.equal(integer(0, { min: 1, max: 150 }), null);
  assert.equal(integer(151, { min: 1, max: 150 }), null);
  assert.equal(integer(1.5, { min: 1, max: 150 }), null);
});

test('ok gebruikt het vaste v1 response-contract', async () => {
  const response = ok({ status: 'ok' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('API-Version'), API_VERSION);
  assert.deepEqual(await response.json(), { data: { status: 'ok' } });
});

test('fail gebruikt een machineleesbare foutcode', async () => {
  const response = fail('VALIDATION_ERROR', 'Ongeldig.', 422);
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), {
    error: { code: 'VALIDATION_ERROR', message: 'Ongeldig.' }
  });
});

test('locale valt veilig terug op Nederlands', () => {
  assert.equal(locale('fa'), 'fa');
  assert.equal(locale('nl'), 'nl');
  assert.equal(locale('en'), 'nl');
});

test('localized gebruikt de gekozen taal en een gecontroleerde fallback', () => {
  assert.equal(localized({ nl: 'Les', fa: 'درس' }, 'fa'), 'درس');
  assert.equal(localized({ nl: 'Les' }, 'fa'), 'Les');
  assert.equal(localized(null, 'nl'), '');
});

test('entitlementIsActive controleert status en geldigheidsperiode', () => {
  const now = Date.parse('2026-09-01T12:00:00Z');
  assert.equal(entitlementIsActive({ status: 'active', starts_at: '2026-08-01', ends_at: null }, now), true);
  assert.equal(entitlementIsActive({ status: 'grace', starts_at: '2026-08-01', ends_at: '2026-09-02' }, now), true);
  assert.equal(entitlementIsActive({ status: 'expired', starts_at: '2026-08-01', ends_at: null }, now), false);
  assert.equal(entitlementIsActive({ status: 'active', starts_at: '2026-09-02', ends_at: null }, now), false);
});

test('accessSummary valt gecontroleerd terug op legacy-toegang', () => {
  assert.deepEqual(accessSummary([], true), {
    hasAccess: true,
    source: 'legacy',
    products: [],
    entitlements: []
  });
});

test('mutationId accepteert alleen bruikbare idempotency-sleutels', () => {
  assert.equal(mutationId(' mobile-123 '), 'mobile-123');
  assert.equal(mutationId('kort'), null);
  assert.equal(mutationId(null), null);
});

test('percentage rondt examenscores voorspelbaar af', () => {
  assert.equal(percentage(7, 10), 70);
  assert.equal(percentage(2, 3), 67);
  assert.equal(percentage(0, 0), 0);
});

test('publicQuestion lekt geen antwoord of uitleg', () => {
  const question = publicQuestion({
    id: '12', prompt: { nl: 'Vraag?' }, options: ['A', 'B'], category: 'regels',
    media: [], sort_order: 1, correct_option: 1, explanation: { nl: 'Omdat.' }
  }, 'nl', localized);
  assert.deepEqual(question, {
    id: 12, prompt: 'Vraag?', options: ['A', 'B'], category: 'regels', media: [], sortOrder: 1
  });
  assert.equal('correctOption' in question, false);
  assert.equal('explanation' in question, false);
});
