export const COURSE_PRODUCTS = Object.freeze({
  'course.full': Object.freeze({ locales: ['nl', 'fa'], legacy: true }),
  theory_b_access: Object.freeze({ locales: ['nl', 'fa'], legacy: true }),
  theory_b_nl_30d: Object.freeze({ locales: ['nl'] }),
  theory_b_nl_fa_30d: Object.freeze({ locales: ['nl', 'fa'] }),
  theory_b_nl_ps_30d: Object.freeze({ locales: ['nl', 'ps'], comingSoon: true })
});

export const COURSE_PRODUCT_KEYS = Object.freeze(Object.keys(COURSE_PRODUCTS));

export function productLocales(productKey) {
  return COURSE_PRODUCTS[productKey]?.locales || [];
}

export function grantsCourseAccess(productKey) {
  return productLocales(productKey).length > 0;
}

export function grantedLocales(entitlements, legacyHasAccess = false) {
  const locales = new Set(legacyHasAccess ? ['nl', 'fa'] : []);
  for (const entitlement of entitlements || []) {
    for (const language of productLocales(entitlement.product_key)) locales.add(language);
  }
  return [...locales];
}

