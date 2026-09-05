import { createHmac, timingSafeEqual } from 'node:crypto';
import { authenticate, ensureUser, getSql, hasCourseAccess, parseBody } from '../_lib.js';
import { accessSummary } from './_access.js';
import { fail, integer, locale, localized, ok } from './_contract.js';
import { answersEqual, normalizeAnswer, percentage, publicQuestion, questionType } from './_exam.js';
import { purchaseConfirmationEmail, withdrawalConfirmationEmail } from './_email.js';
import { summarizeResults } from './_results.js';

function configured(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const MOLLIE_PRODUCTS = Object.freeze({
  theory_b_nl_30d: Object.freeze({ amount: '29.99', description: 'Mursaltheorie Nederlands - 30 dagen' }),
  theory_b_nl_fa_30d: Object.freeze({ amount: '49.99', description: 'Mursaltheorie Nederlands + Dari/Farsi - 30 dagen' })
});

const CONSENT_VERSION = 'digital-content-v2-2026-09-04';
const CONSENT_TEXT = 'Ik geef uitdrukkelijk toestemming om de digitale inhoud na mijn eigen activatie direct te leveren. Ik verklaar dat mijn wettelijke herroepingsrecht vervalt zodra ik op “Start mijn 30 dagen toegang” klik.';

async function createCheckout(sql, userId, customerEmail, productKey, immediateAccessConsent) {
  const secret = configured('MOLLIE_API_KEY');
  const product = MOLLIE_PRODUCTS[productKey];
  const appUrl = configured('APP_URL') || 'https://www.mursaltheorie.nl';
  if (!secret) return fail('PAYMENTS_NOT_CONFIGURED', 'Betalen is nog niet geactiveerd.', 503);
  if (!product) return fail('INVALID_PRODUCT', 'Kies een geldig taalpakket.', 422);
  const response = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `checkout:${userId}:${productKey}:${Math.floor(Date.now() / 60000)}`
    },
    body: JSON.stringify({
      amount: { currency: 'EUR', value: product.amount },
      description: product.description,
      redirectUrl: `${appUrl}/learn5?payment=return`,
      cancelUrl: `${appUrl}/learn5?payment=cancelled`,
      webhookUrl: `${appUrl}/api/v1/access?resource=mollie-webhook`,
      metadata: {
        clerk_user_id: userId,
        product_key: productKey,
        immediate_access_consent: immediateAccessConsent ? 'true' : 'false',
        consent_version: CONSENT_VERSION,
        consented_at: new Date().toISOString()
      }
    })
  });
  const payment = await response.json();
  const checkoutUrl = payment?._links?.checkout?.href;
  if (!response.ok || !payment?.id || !checkoutUrl) {
    console.error('Mollie payment creation failed', { status: response.status, detail: payment?.detail });
    return fail('PAYMENT_PROVIDER_ERROR', 'De betaalpagina kon niet worden geopend.', 502);
  }
  await sql`
    INSERT INTO purchase_orders(
      provider, provider_payment_id, clerk_user_id, customer_email, product_key, description,
      amount_value, amount_currency, status, consent_version, consent_text, consented_at
    ) VALUES(
      'mollie', ${payment.id}, ${userId}, ${customerEmail || null}, ${productKey}, ${product.description},
      ${product.amount}, 'EUR', 'payment_pending', ${CONSENT_VERSION}, ${CONSENT_TEXT},
      ${payment.metadata.consented_at}
    )
    ON CONFLICT(provider, provider_payment_id) DO NOTHING
  `;
  return ok({ checkoutUrl });
}

async function fetchMolliePayment(paymentId, secret) {
  const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${secret}` }
  });
  const payment = await response.json();
  if (!response.ok) throw new Error(`Mollie payment lookup failed: ${response.status}`);
  return payment;
}

async function processMollieWebhook(request) {
  const secret = configured('MOLLIE_API_KEY');
  if (!secret) return fail('PAYMENTS_NOT_CONFIGURED', 'Webhook is niet geactiveerd.', 503);
  const paymentId = new URLSearchParams(await request.text()).get('id');
  if (!/^tr_[A-Za-z0-9]+$/.test(paymentId || '')) return fail('INVALID_PAYMENT_ID', 'Ongeldig betalingskenmerk.', 400);
  const payment = await fetchMolliePayment(paymentId, secret);
  const productKey = payment?.metadata?.product_key;
  const userId = payment?.metadata?.clerk_user_id;
  const product = MOLLIE_PRODUCTS[productKey];
  const amountMatches = payment?.amount?.currency === 'EUR' && payment?.amount?.value === product?.amount;
  const consentMatches = payment?.metadata?.immediate_access_consent === 'true';
  if (!product || !userId || !amountMatches || !consentMatches) return fail('PAYMENT_MISMATCH', 'Betalingsgegevens komen niet overeen.', 400);
  const sql = getSql();
  const safePayload = { id: payment.id, status: payment.status, amount: payment.amount, product_key: productKey, immediate_access_consent: true };
  await sql`INSERT INTO purchase_events(provider,provider_event_id,event_type,payload,processed_at) VALUES('mollie',${payment.id},${`payment.${payment.status}`},${JSON.stringify(safePayload)}::jsonb,NOW()) ON CONFLICT(provider,provider_event_id) DO UPDATE SET event_type=EXCLUDED.event_type,payload=EXCLUDED.payload,processed_at=NOW()`;
  const ensuredUser = await ensureUser(sql, userId);
  const orderStatus = payment.status === 'paid'
    ? 'paid_awaiting_activation'
    : ['canceled', 'expired'].includes(payment.status) ? 'cancelled'
      : payment.status === 'failed' ? 'failed' : 'payment_pending';
  const consentedAt = payment?.metadata?.consented_at || new Date().toISOString();
  const savedOrders = await sql`
    INSERT INTO purchase_orders(
      provider, provider_payment_id, clerk_user_id, customer_email, product_key, description,
      amount_value, amount_currency, status, consent_version, consent_text, consented_at, paid_at
    ) VALUES(
      'mollie', ${payment.id}, ${userId}, ${ensuredUser.email || null}, ${productKey}, ${product.description},
      ${product.amount}, 'EUR', ${orderStatus}, ${payment?.metadata?.consent_version || CONSENT_VERSION},
      ${CONSENT_TEXT}, ${consentedAt}, ${payment.status === 'paid' ? new Date().toISOString() : null}
    )
    ON CONFLICT(provider, provider_payment_id) DO UPDATE SET
      status = CASE WHEN purchase_orders.status IN ('active','withdrawn') THEN purchase_orders.status ELSE EXCLUDED.status END,
      paid_at = COALESCE(purchase_orders.paid_at, EXCLUDED.paid_at),
      updated_at = NOW()
    RETURNING provider_payment_id,amount_value::TEXT AS amount_value,amount_currency,status,refund_reference
  `;
  if (payment.status === 'paid') {
    const savedOrder = savedOrders[0];
    if (savedOrder?.status === 'withdrawn') {
      if (!savedOrder.refund_reference) {
        const refund = await createMollieRefund(savedOrder);
        await sql`UPDATE purchase_orders SET refund_reference=${refund.id},refunded_at=NOW(),updated_at=NOW() WHERE provider='mollie' AND provider_payment_id=${payment.id}`;
      }
      await sql`UPDATE entitlements SET status='revoked',updated_at=NOW() WHERE source='web' AND external_reference=${payment.id} AND status='pending'`;
      return ok({ received: true, withdrawn: true });
    }
    await sql`INSERT INTO entitlements(clerk_user_id,product_key,source,external_reference,status,starts_at,ends_at) VALUES(${userId},${productKey},'web',${payment.id},'pending',NOW(),NULL) ON CONFLICT(source,external_reference) DO UPDATE SET product_key=EXCLUDED.product_key,status=CASE WHEN entitlements.status='active' THEN 'active' ELSE 'pending' END,updated_at=NOW()`;
    const orders = await sql`
      SELECT order_row.id, order_row.provider_payment_id, order_row.description,
        order_row.amount_value::TEXT AS amount_value, order_row.consent_text, app_users.email
      FROM purchase_orders order_row
      JOIN app_users ON app_users.clerk_user_id = order_row.clerk_user_id
      WHERE order_row.provider = 'mollie' AND order_row.provider_payment_id = ${payment.id}
        AND order_row.confirmation_sent_at IS NULL
      LIMIT 1
    `;
    const order = orders[0];
    if (order) {
      const appUrl = configured('APP_URL') || 'https://www.mursaltheorie.nl';
      const email = await purchaseConfirmationEmail({
        email: order.email,
        orderId: order.provider_payment_id,
        description: order.description,
        amount: order.amount_value,
        consentText: order.consent_text,
        appUrl
      });
      if (email.sent) {
        await sql`UPDATE purchase_orders SET confirmation_sent_at=NOW(),confirmation_email_id=${email.id},updated_at=NOW() WHERE id=${order.id}`;
      }
    }
  }
  return ok({ received: true });
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

async function loadLatestPurchase(sql, userId) {
  try {
    const rows = await sql`
      SELECT provider_payment_id, product_key, description, amount_value::TEXT AS amount_value,
        amount_currency, status, consent_version, consent_text, consented_at, paid_at,
        confirmation_sent_at, activated_at, withdrawal_requested_at, refund_reference, refunded_at
      FROM purchase_orders
      WHERE clerk_user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    if (error?.code === '42P01') return null;
    throw error;
  }
}

function purchaseSummary(order) {
  if (!order) return null;
  return {
    orderId: order.provider_payment_id,
    productKey: order.product_key,
    description: order.description,
    amount: order.amount_value,
    currency: order.amount_currency,
    status: order.status,
    consentVersion: order.consent_version,
    consentText: order.consent_text,
    consentedAt: order.consented_at,
    paidAt: order.paid_at,
    confirmationSentAt: order.confirmation_sent_at,
    activatedAt: order.activated_at,
    withdrawalRequestedAt: order.withdrawal_requested_at,
    refundReference: order.refund_reference,
    refundedAt: order.refunded_at
  };
}

async function sendPendingPurchaseConfirmation(sql, userId) {
  const rows = await sql`
    SELECT order_row.id, order_row.provider_payment_id, order_row.description,
      order_row.amount_value::TEXT AS amount_value, order_row.consent_text, app_users.email
    FROM purchase_orders order_row
    JOIN app_users ON app_users.clerk_user_id = order_row.clerk_user_id
    WHERE order_row.clerk_user_id = ${userId}
      AND order_row.status = 'paid_awaiting_activation'
      AND order_row.confirmation_sent_at IS NULL
    ORDER BY order_row.created_at DESC
    LIMIT 1
  `;
  const order = rows[0];
  if (!order) return { sent: false, reason: 'not_pending' };
  const appUrl = configured('APP_URL') || 'https://www.mursaltheorie.nl';
  const email = await purchaseConfirmationEmail({
    email: order.email,
    orderId: order.provider_payment_id,
    description: order.description,
    amount: order.amount_value,
    consentText: order.consent_text,
    appUrl
  });
  if (email.sent) {
    await sql`UPDATE purchase_orders SET confirmation_sent_at=NOW(),confirmation_email_id=${email.id},updated_at=NOW() WHERE id=${order.id}`;
  }
  return email;
}

async function activatePurchase(sql, userId) {
  const rows = await sql`
    WITH activated AS (
      UPDATE purchase_orders
      SET status='active',activated_at=NOW(),updated_at=NOW()
      WHERE id=(
        SELECT id FROM purchase_orders
        WHERE clerk_user_id=${userId} AND status='paid_awaiting_activation'
          AND confirmation_sent_at IS NOT NULL AND withdrawal_requested_at IS NULL
        ORDER BY created_at DESC LIMIT 1
      )
      RETURNING provider_payment_id,activated_at
    )
    UPDATE entitlements entitlement
    SET status='active',starts_at=activated.activated_at,
      ends_at=activated.activated_at+INTERVAL '30 days',updated_at=NOW()
    FROM activated
    WHERE entitlement.source='web' AND entitlement.external_reference=activated.provider_payment_id
    RETURNING entitlement.product_key,entitlement.starts_at,entitlement.ends_at
  `;
  if (!rows[0]) {
    const order = await loadLatestPurchase(sql, userId);
    if (!order || order.status === 'payment_pending') return fail('PAYMENT_PENDING', 'De betaling wordt nog verwerkt.', 409);
    if (order.status === 'withdrawn') return fail('PURCHASE_WITHDRAWN', 'Deze aankoop is ongedaan gemaakt.', 409);
    if (!order.confirmation_sent_at) return fail('CONFIRMATION_PENDING', 'Starten kan pas nadat de aankoopbevestiging is verzonden.', 409);
    return fail('ACTIVATION_UNAVAILABLE', 'Deze aankoop kan niet worden geactiveerd.', 409);
  }
  return ok({ activated: true, startsAt: rows[0].starts_at, endsAt: rows[0].ends_at });
}

async function createMollieRefund(order) {
  const secret = configured('MOLLIE_API_KEY');
  if (!secret) throw new Error('Mollie is not configured');
  const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(order.provider_payment_id)}/refunds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `withdrawal:${order.provider_payment_id}`
    },
    body: JSON.stringify({ amount: { currency: order.amount_currency, value: order.amount_value } })
  });
  const refund = await response.json().catch(() => ({}));
  if (!response.ok || !refund?.id) throw new Error(`Mollie refund failed: ${response.status}`);
  return refund;
}

async function withdrawPurchase(sql, userId) {
  const order = await loadLatestPurchase(sql, userId);
  if (!order || !['payment_pending', 'paid_awaiting_activation'].includes(order.status)) {
    if (order?.status === 'active') return fail('WITHDRAWAL_RIGHT_EXPIRED', 'De digitale inhoud is al geactiveerd. Neem contact op bij een probleem met de levering.', 409);
    if (order?.status === 'withdrawn') return ok({ withdrawn: true, alreadyProcessed: true, purchase: purchaseSummary(order) });
    return fail('NO_WITHDRAWABLE_PURCHASE', 'Er is geen aankoop die online ongedaan kan worden gemaakt.', 404);
  }
  let refund = null;
  if (order.status === 'paid_awaiting_activation') refund = await createMollieRefund(order);
  const requestedAt = new Date().toISOString();
  const rows = await sql`
    UPDATE purchase_orders
    SET status='withdrawn',withdrawal_requested_at=${requestedAt},
      refund_reference=${refund?.id || null},refunded_at=${refund ? requestedAt : null},updated_at=NOW()
    WHERE clerk_user_id=${userId} AND provider='mollie' AND provider_payment_id=${order.provider_payment_id}
      AND status IN ('payment_pending','paid_awaiting_activation')
    RETURNING provider_payment_id,description
  `;
  if (!rows[0]) return fail('WITHDRAWAL_ALREADY_PROCESSED', 'De status van deze aankoop is al gewijzigd.', 409);
  await sql`UPDATE entitlements SET status='revoked',updated_at=NOW() WHERE clerk_user_id=${userId} AND source='web' AND external_reference=${order.provider_payment_id} AND status='pending'`;
  const users = await sql`SELECT email FROM app_users WHERE clerk_user_id=${userId} LIMIT 1`;
  const email = await withdrawalConfirmationEmail({ email: users[0]?.email, orderId: order.provider_payment_id, description: order.description, requestedAt });
  if (email.sent) await sql`UPDATE purchase_orders SET withdrawal_confirmation_sent_at=NOW(),updated_at=NOW() WHERE provider='mollie' AND provider_payment_id=${order.provider_payment_id}`;
  return ok({ withdrawn: true, requestedAt, refundReference: refund?.id || null });
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

async function topicStats(sql, userId) {
  const rows = await sql`
    SELECT q.category,
      COUNT(*)::INTEGER AS answered,
      COUNT(*) FILTER (WHERE answer.is_correct)::INTEGER AS correct,
      COUNT(*) FILTER (WHERE NOT answer.is_correct)::INTEGER AS wrong
    FROM exam_attempt_answers_v1 answer
    JOIN exam_attempts_v1 attempt ON attempt.id = answer.attempt_id
    JOIN exam_questions_v1 q ON q.id = answer.question_id
    WHERE attempt.clerk_user_id = ${userId} AND attempt.status = 'submitted'
    GROUP BY q.category
    ORDER BY (COUNT(*) FILTER (WHERE answer.is_correct))::DECIMAL / NULLIF(COUNT(*), 0), q.category
  `;
  return ok({
    topics: rows.map((row) => ({
      category: row.category,
      answered: Number(row.answered),
      correct: Number(row.correct),
      wrong: Number(row.wrong),
      percentage: percentage(Number(row.correct), Number(row.answered))
    }))
  });
}

async function errorQuestions(sql, userId, url) {
  const language = locale(url.searchParams.get('locale'));
  const rows = await sql`
    SELECT DISTINCT ON (q.id) q.id, q.prompt, q.options, q.category, q.question_type, q.media,
      answer.answered_at, ROW_NUMBER() OVER (ORDER BY answer.answered_at DESC) AS sort_order
    FROM exam_attempt_answers_v1 answer
    JOIN exam_attempts_v1 attempt ON attempt.id = answer.attempt_id
    JOIN exam_questions_v1 q ON q.id = answer.question_id
    WHERE attempt.clerk_user_id = ${userId}
      AND attempt.status = 'submitted'
      AND answer.is_correct = FALSE
      AND q.published = TRUE
      AND q.question_type IN ('single_choice', 'yes_no', 'hotspot')
    ORDER BY q.id, answer.answered_at DESC
    LIMIT 20
  `;
  return ok({ questions: rows.map((row) => publicQuestion(row, language, localized)) });
}

async function checkErrorAnswer(sql, userId, request, language) {
  const body = await parseBody(request);
  const questionId = integer(body?.questionId, { min: 1, max: Number.MAX_SAFE_INTEGER });
  if (questionId === null) return fail('VALIDATION_ERROR', 'questionId is verplicht.', 422);
  const rows = await sql`
    SELECT q.id, q.question_type, q.options, q.correct_answer, q.correct_option, q.explanation
    FROM exam_questions_v1 q
    WHERE q.id = ${questionId} AND EXISTS (
      SELECT 1 FROM exam_attempt_answers_v1 answer
      JOIN exam_attempts_v1 attempt ON attempt.id = answer.attempt_id
      WHERE answer.question_id = q.id AND attempt.clerk_user_id = ${userId}
        AND attempt.status = 'submitted' AND answer.is_correct = FALSE
    )
    LIMIT 1
  `;
  const question = rows[0];
  if (!question) return fail('QUESTION_NOT_FOUND', 'Deze vraag staat niet in jouw foutentraining.', 404);
  const type = questionType(question.question_type);
  const answer = normalizeAnswer(type, body?.answer, Array.isArray(question.options) ? question.options.length : 0);
  const correctAnswer = normalizeAnswer(type, question.correct_answer, Array.isArray(question.options) ? question.options.length : 0);
  if (answer === null) return fail('VALIDATION_ERROR', 'Het antwoord past niet bij dit vraagtype.', 422);
  return ok({ result: {
    questionId,
    isCorrect: answersEqual(type, answer, correctAnswer),
    correctAnswer,
    correctOption: question.correct_option,
    explanation: localized(question.explanation, language)
  } });
}

const endpoint = {
  async fetch(request) {
    if (!['GET', 'POST'].includes(request.method)) return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const url = new URL(request.url);
    const resource = url.searchParams.get('resource');
    if (request.method === 'POST' && resource === 'mollie-webhook') {
      try { return await processMollieWebhook(request); }
      catch (error) { console.error('Mollie webhook failed', error); return fail('WEBHOOK_ERROR', 'Webhook kon niet worden verwerkt.', 400); }
    }
    if (request.method === 'POST' && resource === 'stripe-webhook') {
      return fail('PAYMENT_PROVIDER_DISABLED', 'Deze betaalprovider is niet actief.', 410);
    }
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      const user = await ensureUser(sql, auth.userId);
      if (request.method === 'POST' && resource === 'error-answer') {
        return checkErrorAnswer(sql, auth.userId, request, locale(url.searchParams.get('locale')));
      }
      if (request.method === 'POST' && resource === 'checkout') {
        const body = await parseBody(request);
        const productKey = typeof body?.productKey === 'string' ? body.productKey : '';
        if (!MOLLIE_PRODUCTS[productKey]) return fail('INVALID_PRODUCT', 'Kies een geldig taalpakket.', 422);
        if (body?.immediateAccessConsent !== true) {
          return fail('CONSENT_REQUIRED', 'Bevestig dat de digitale toegang direct mag starten.', 422);
        }
        const entitlements = await loadEntitlements(sql, auth.userId);
        if (accessSummary(entitlements, hasCourseAccess(user)).hasAccess) {
          return fail('ACCESS_ALREADY_ACTIVE', 'Dit account heeft al volledige toegang.', 409);
        }
        return createCheckout(sql, auth.userId, user.email, productKey, true);
      }
      if (request.method === 'POST' && resource === 'resend-purchase-confirmation') {
        const email = await sendPendingPurchaseConfirmation(sql, auth.userId);
        if (!email.sent) {
          const code = email.reason === 'not_configured' ? 'EMAIL_NOT_CONFIGURED' : 'CONFIRMATION_NOT_SENT';
          return fail(code, 'De aankoopbevestiging kon nog niet worden verzonden.', 503);
        }
        return ok({ sent: true });
      }
      if (request.method === 'POST' && resource === 'activate') return activatePurchase(sql, auth.userId);
      if (request.method === 'POST' && resource === 'withdraw') return withdrawPurchase(sql, auth.userId);
      if (request.method !== 'GET') return fail('VALIDATION_ERROR', 'Ongeldige betaalactie.', 422);
      if (url.searchParams.get('resource') === 'results') return examHistory(sql, auth.userId, url);
      if (url.searchParams.get('resource') === 'topic-stats') return topicStats(sql, auth.userId);
      if (url.searchParams.get('resource') === 'errors') return errorQuestions(sql, auth.userId, url);
      const entitlements = await loadEntitlements(sql, auth.userId);
      const purchase = await loadLatestPurchase(sql, auth.userId);

      return ok({ access: { ...accessSummary(entitlements, hasCourseAccess(user)), purchase: purchaseSummary(purchase) } });
    } catch (error) {
      console.error('v1 access endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Toegang kon niet worden gecontroleerd.', 503);
    }
  }
};

async function handler(request) {
  return endpoint.fetch(request);
}

export const GET = handler;
export const POST = handler;
