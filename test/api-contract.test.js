import assert from 'node:assert/strict';
import test from 'node:test';
import { API_VERSION, fail, integer, locale, localized, ok } from '../api/v1/_contract.js';
import { accessSummary, entitlementIsActive } from '../api/v1/_access.js';
import { mutationId, percentage, publicQuestion } from '../api/v1/_exam.js';
import { clientTimestamp, deviceId, platform, shouldApplyProgress, syncMutationId } from '../api/v1/_sync.js';
import { summarizeResults } from '../api/v1/_results.js';
import { ACCOUNT_DELETE_CONFIRMATION, accountExport, validDeletionConfirmation } from '../api/v1/_privacy.js';
import { grantedLocales, grantsCourseAccess, productLocales } from '../api/v1/_products.js';

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
  assert.equal(locale('ps'), 'ps');
  assert.equal(locale('nl'), 'nl');
  assert.equal(locale('en'), 'nl');
});

test('localized gebruikt de gekozen taal en een gecontroleerde fallback', () => {
  assert.equal(localized({ nl: 'Les', fa: 'درس' }, 'fa'), 'درس');
  assert.equal(localized({ nl: 'Les', ps: 'درس' }, 'ps'), 'درس');
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
    locales: ['nl', 'fa'],
    entitlements: []
  });
});

test('taalpakketten houden Dari/Farsi en Pashto strikt gescheiden', () => {
  assert.deepEqual(productLocales('theory_b_nl_30d'), ['nl']);
  assert.deepEqual(productLocales('theory_b_nl_fa_30d'), ['nl', 'fa']);
  assert.deepEqual(productLocales('theory_b_nl_ps_30d'), ['nl', 'ps']);
  assert.equal(grantsCourseAccess('onbekend'), false);
  assert.deepEqual(grantedLocales([
    { product_key: 'theory_b_nl_ps_30d' }
  ]), ['nl', 'ps']);
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
    id: '12', prompt: { nl: 'Vraag?' }, options: [{ nl: 'A', fa: 'الف' }, { nl: 'B', fa: 'ب' }], category: 'regels',
    media: [], sort_order: 1, correct_option: 1, explanation: { nl: 'Omdat.' }
  }, 'nl', localized);
  assert.deepEqual(question, {
    id: 12, prompt: 'Vraag?', options: ['A', 'B'], category: 'regels', media: [], sortOrder: 1
  });
  assert.equal('correctOption' in question, false);
  assert.equal('explanation' in question, false);
});

test('sync-identifiers en platformen worden strikt gevalideerd', () => {
  assert.equal(deviceId(' web:550e8400-e29b-41d4-a716-446655440000 '), 'web:550e8400-e29b-41d4-a716-446655440000');
  assert.equal(deviceId('te kort'), null);
  assert.equal(syncMutationId('mutation_123'), 'mutation_123');
  assert.equal(syncMutationId('ongeldige sleutel!'), null);
  assert.equal(platform('ios'), 'ios');
  assert.equal(platform('windows'), null);
});

test('clientTimestamp weigert ongeldige en te toekomstige tijden', () => {
  const now = Date.parse('2026-09-02T12:00:00Z');
  assert.equal(clientTimestamp('2026-09-02T11:59:00Z', now), '2026-09-02T11:59:00.000Z');
  assert.equal(clientTimestamp('geen datum', now), null);
  assert.equal(clientTimestamp('2026-09-02T12:06:00Z', now), null);
});

test('nieuwste clientmutatie wint bij synchronisatieconflicten', () => {
  assert.equal(shouldApplyProgress(null, '2026-09-02T10:00:00Z'), true);
  assert.equal(shouldApplyProgress('2026-09-02T10:00:00Z', '2026-09-02T10:00:00Z'), true);
  assert.equal(shouldApplyProgress('2026-09-02T10:00:01Z', '2026-09-02T10:00:00Z'), false);
});

test('resultatensamenvatting berekent voortgang zonder lege-geschiedenisfouten', () => {
  assert.deepEqual(summarizeResults([]), {
    total: 0, passed: 0, passRate: 0, bestScore: null, averageScore: null
  });
  assert.deepEqual(summarizeResults([
    { score: 90, passed: true }, { score: 75, passed: false }, { score: 88, passed: true }
  ]), {
    total: 3, passed: 2, passRate: 67, bestScore: 90, averageScore: 84
  });
});

test('accountverwijdering vereist de exacte expliciete bevestiging', () => {
  assert.equal(validDeletionConfirmation({ confirmation: ACCOUNT_DELETE_CONFIRMATION }), true);
  assert.equal(validDeletionConfirmation({ confirmation: 'verwijder mijn account' }), false);
  assert.equal(validDeletionConfirmation(null), false);
});

test('gegevensexport bevat geen push-token', () => {
  const exported = accountExport({
    profile: { clerk_user_id: 'user_1' },
    devices: [{ device_id: 'web:1', platform: 'web', push_token: 'secret' }]
  }, '2026-09-02T12:00:00.000Z');
  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.exportedAt, '2026-09-02T12:00:00.000Z');
  assert.deepEqual(exported.devices, [{ device_id: 'web:1', platform: 'web' }]);
});

