import { authenticate, ensureUser, getSql, json } from '../_lib.js';
import { gameAccess } from './_game-access.js';
import { SOURCES,SIGNS,signByCode,WORLDS,CHAPTERS,LEVELS,MODES,SCENARIOS,PRIORITY_QUESTIONS,WORLD_CONFIG } from './_game-data.js';

export async function GET(request) {
  const auth = await authenticate(request);
  if (auth.error) return auth.error;
  try {
    const sql = getSql();
    const user = await ensureUser(sql, auth.userId);
    const entitlements = await sql`SELECT product_key, status, starts_at, ends_at FROM entitlements WHERE clerk_user_id = ${auth.userId}`;
    const validUntil = gameAccess(user, entitlements);
    if (!validUntil) return json({error:'Een actief digitaal abonnement is nodig om te spelen.'},403);
    const data = { userId:auth.userId, validUntil };
    if (!new URL(request.url).searchParams.has('check')) data.content = {SOURCES,SIGNS,signByCode,WORLDS,CHAPTERS,LEVELS,MODES,SCENARIOS,PRIORITY_QUESTIONS,WORLD_CONFIG};
    return json({data});
  } catch {
    return json({error:'Toegang controleren lukt nu niet. Probeer het straks opnieuw.'},503);
  }
}
