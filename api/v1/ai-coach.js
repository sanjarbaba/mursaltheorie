import { authenticate, getSql, parseBody } from '../_lib.js';
import { fail, ok } from './_contract.js';
import { buildCoachInput, buildCoachInstructions, demoCoachReply, normalizeCoachRequest } from './_ai-coach.js';

async function isProjectAdmin(sql, userId) {
  const rows = await sql\`SELECT access_status FROM app_users WHERE clerk_user_id = \${userId} LIMIT 1\`;
  return rows[0]?.access_status === 'admin';
}

async function coachReply(input) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { reply: demoCoachReply(input), mode: 'demo' };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.AI_COACH_MODEL || 'gpt-4.1-mini',
      instructions: buildCoachInstructions(input.language),
      input: buildCoachInput(input),
      max_output_tokens: 450,
      store: false
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    console.error('AI coach provider returned an error', { status: response.status });
    throw new Error('AI_PROVIDER_ERROR');
  }
  const payload = await response.json();
  const reply = payload.output?.flatMap((item) => item.content || [])
    .find((item) => item.type === 'output_text')?.text?.trim();
  if (!reply) throw new Error('AI_EMPTY_RESPONSE');
  return { reply: reply.slice(0, 4000), mode: 'ai' };
}

async function handler(request) {
  if (!['GET', 'POST'].includes(request.method)) return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
  const auth = await authenticate(request);
  if (auth.error) return fail('UNAUTHORIZED', 'Log in met het beheerdersaccount om de proefcoach te testen.', 401);

  try {
    const sql = getSql();
    if (!await isProjectAdmin(sql, auth.userId)) return fail('FORBIDDEN', 'Deze proefversie is alleen beschikbaar voor beheerders.', 403);
    if (request.method === 'GET') return ok({ enabled: true, mode: process.env.OPENAI_API_KEY ? 'ai' : 'demo' });

    const input = normalizeCoachRequest(await parseBody(request));
    if (!input) return fail('INVALID_MESSAGE', 'Typ eerst een vraag voor Mursal AI.', 422);
    try {
      return ok(await coachReply(input));
    } catch (error) {
      console.error('AI coach reply failed', { name: error?.name || 'Error' });
      return fail('COACH_UNAVAILABLE', 'De proefcoach kon nu geen antwoord maken. Probeer het straks opnieuw.', 503);
    }
  } catch (error) {
    console.error('AI coach authorization failed', { name: error?.name || 'Error' });
    return fail('SERVICE_UNAVAILABLE', 'De beheerdersstatus kon niet worden gecontroleerd.', 503);
  }
}

export const GET = handler;
export const POST = handler;
