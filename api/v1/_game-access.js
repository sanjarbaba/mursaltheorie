const DAY = 86400000;
const digital = new Set(['theory_b_nl_30d','theory_b_nl_fa_30d','theory_b_nl_ps_30d','course.full','theory_b_access']);
// Game access follows paid digital access; a physical book or beta flag is not a subscription.
export function gameAccess(user, entitlements, now = Date.now()) {
  if (!user || ['blocked','expired'].includes(user.access_status)) return null;
  if (user.access_status === 'admin') return new Date(now + 3600000).toISOString();
  const ends = [];
  for (const e of entitlements || []) {
    if (!digital.has(e.product_key) || !['active','grace'].includes(e.status)) continue;
    const start = Date.parse(e.starts_at), end = Date.parse(e.ends_at);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > now) continue;
    const until = Math.min(end, start + 30 * DAY);
    if (until > now) ends.push(until);
  }
  // Existing paid legacy accounts already carry their purchase expiration.
  if (user.access_status === 'active' && !(entitlements || []).some(e => digital.has(e.product_key))) {
    const start = Date.parse(user.access_starts_at), end = Date.parse(user.access_ends_at);
    if (Number.isFinite(start) && Number.isFinite(end) && start <= now && end > now) ends.push(end);
  }
  return ends.length ? new Date(Math.max(...ends)).toISOString() : null;
}
