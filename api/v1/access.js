import { createHmac, timingSafeEqual } from 'node:crypto';
import { authenticate, ensureUser, getSql, hasCourseAccess } from '../_lib.js';
import { accessSummary } from './_access.js';
import { fail, integer, locale, localized, ok } from './_contract.js';
import { summarizeResults } from './_results.js';

function configured(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function createCheckout(userId) {
  const secret = configured('STRIPE_SECRET_KEY');
  const price = configured('STRIPE_PRICE_ID');
  const appUrl = configured('APP_URL') || 'https://www.mursaltheorie.nl';
  if (!secret || !price) return fail('PAYMENTS_NOT_CONFIGURED', 'Betalen is nog niet geactiveerd.', 503);
  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    success_url: `${appUrl}/learn5?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/learn5?payment=cancelled`,
    client_reference_id: userId,
    'metadata[clerk_user_id]': userId,
    'metadata[product_key]': 'theory_b_access'
  });
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `checkout:${userId}:${Math.floor(Date.now() / 60000)}`
    },
    body: form
  });
  const session = await response.json();
  if (!response.ok || !session.url) return fail('PAYMENT_PROVIDER_ERROR', 'De betaalpagina kon niet worden geopend.', 502);
  return ok({ checkoutUrl: session.url });
}

function verifyStripeSignature(payload, header, secret) {
  const parts = String(header || '').split(',').map((part) => part.split('='));
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1]);
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

async function loadEntitlements(sql, userId) {
  try {
    return await sql`
      SELECT product_key, source, status, starts_at, ends_at
      FROM entitlements
      WHERE clerk_user_id = ${userId}
      ORDER BY created_at DESC
    `;
  } catch (error) {
    if (error?.code === '42P01') return [];
    throw error;
  }
}

async function processStripeWebhook(request) {
  const secret = configured('STRIPE_WEBHOOK_SECRET');
  if (!secret) return fail('PAYMENTS_NOT_CONFIGURED', 'Webhook is niet geactiveerd.', 503);
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), secret)) return fail('INVALID_SIGNATURE', 'Ongeldige webhookhandtekening.', 400);
  const event = JSON.parse(payload);
  const object = event?.data?.object || {};
  const safePayload = { id: object.id, payment_status: object.payment_status, amount_total: object.amount_total, currency: object.currency, client_reference_id: object.client_reference_id };
  const sql = getSql();
  await sql`INSERT INTO purchase_events(provider,provider_event_id,event_type,payload,processed_at) VALUES('stripe',${event.id},${event.type},${JSON.stringify(safePayload)}::jsonb,NOW()) ON CONFLICT(provider,provider_event_id) DO NOTHING`;
  if (event.type === 'checkout.session.completed' && object.payment_status === 'paid') {
    const userId = object.metadata?.clerk_user_id || object.client_reference_id;
    if (userId) {
      await ensureUser(sql, userId);
      await sql`INSERT INTO entitlements(clerk_user_id,product_key,source,external_reference,status) VALUES(${userId},${object.metadata?.product_key || 'theory_b_access'},'web',${object.id},'active') ON CONFLICT(source,external_reference) DO UPDATE SET status='active',updated_at=NOW()`;
    }
  }
  return ok({ received: true });
}

async function examHistory(sql, userId, url) {
  const language = locale(url.searchParams.get('locale'));
  const requestedLimit = url.searchParams.get('limit');
  const limit = requestedLimit == null ? 20 : integer(requestedLimit, { min: 1, max: 50 });
  if (limit === null) return fail('VALIDATION_ERROR', 'limit moet tussen 1 en 50 liggen.', 422);
  const rows = await sql`
    SELECT a.id, a.score, a.started_at, a.submitted_at,
      e.exam_number, e.title, e.question_count, e.pass_score,
      COUNT(answer.question_id)::INTEGER AS answered_count,
      COUNT(answer.question_id) FILTER (WHERE answer.is_correct)::INTEGER AS correct_count
    FROM exam_attempts_v1 a
    JOIN exam_definitions e ON e.id = a.exam_id
    LEFT JOIN exam_attempt_answers_v1 answer ON answer.attempt_id = a.id
    WHERE a.clerk_user_id = ${userId} AND a.status = 'submitted'
    GROUP BY a.id, e.id
    ORDER BY a.submitted_at DESC, a.id DESC
    LIMIT ${limit}
  `;
  const results = rows.map((row) => ({
    attemptId: Number(row.id), examNumber: row.exam_number, title: localized(row.title, language),
    score: row.score, passed: Number(row.score) >= Number(row.pass_score),
    questionCount: row.question_count, answeredCount: row.answered_count, correctCount: row.correct_count,
    startedAt: row.started_at, submittedAt: row.submitted_at
  }));
  return ok({ results, summary: summarizeResults(results), locale: language });
}

export default {
  async fetch(request) {
    if (!['GET', 'POST'].includes(request.method)) return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const url = new URL(request.url);
    const resource = url.searchParams.get('resource');
    if (request.method === 'POST' && resource === 'stripe-webhook') {
      try { return await processStripeWebhook(request); }
      catch (error) { console.error('Stripe webhook failed', error); return fail('WEBHOOK_ERROR', 'Webhook kon niet worden verwerkt.', 400); }
    }
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      const user = await ensureUser(sql, auth.userId);
      if (request.method === 'POST' && resource === 'checkout') {
        const entitlements = await loadEntitlements(sql, auth.userId);
        if (accessSummary(entitlements, hasCourseAccess(user)).hasAccess) {
          return fail('ACCESS_ALREADY_ACTIVE', 'Dit account heeft al volledige toegang.', 409);
        }
        return createCheckout(auth.userId);
      }
      if (request.method !== 'GET') return fail('VALIDATION_ERROR', 'Ongeldige betaalactie.', 422);
      if (url.searchParams.get('resource') === 'results') return examHistory(sql, auth.userId, url);
      const entitlements = await loadEntitlements(sql, auth.userId);

      return ok({ access: accessSummary(entitlements, hasCourseAccess(user)) });
    } catch (error) {
      console.error('v1 access endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Toegang kon niet worden gecontroleerd.', 503);
    }
  }
};

