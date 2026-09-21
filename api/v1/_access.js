import { grantedLocales } from './_products.js';

export function entitlementIsActive(entitlement, now = Date.now()) {
  if (!entitlement || !['active', 'grace'].includes(entitlement.status)) return false;
  const startsAt = entitlement.starts_at ? new Date(entitlement.starts_at).getTime() : 0;
  const endsAt = entitlement.ends_at ? new Date(entitlement.ends_at).getTime() : Infinity;
  return Number.isFinite(startsAt) && startsAt <= now && endsAt > now;
}

export function accessSummary(entitlements, legacyHasAccess = false, now = Date.now()) {
  const active = Array.isArray(entitlements)
    ? entitlements.filter((entitlement) => entitlementIsActive(entitlement, now))
    : [];
  const legacy = active.length === 0 && legacyHasAccess;
  return {
    hasAccess: active.length > 0 || legacy,
    source: active.length > 0 ? 'entitlement' : (legacy ? 'legacy' : 'none'),
    products: [...new Set(active.map((entitlement) => entitlement.product_key))],
    locales: grantedLocales(active, legacy),
    entitlements: active
  };
}

