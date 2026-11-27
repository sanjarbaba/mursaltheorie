// One verified catalogue shared by the public pages and checkout creation.
// Never use current catalogue amounts to validate older paid orders.
export const CAMPAIGN_END = '2026-11-30T23:59:00+01:00';
export const PASHTO_SALES_READY = false;
export const OFFERS = Object.freeze({
  "theory_b_nl_30d": {
    "name": [
      "Nederlands",
      "هالندی",
      "هالنډي"
    ],
    "regular": 2999,
    "sale": 1999,
    "locales": [
      "nl"
    ]
  },
  "theory_b_nl_fa_30d": {
    "name": [
      "Nederlands + Dari/Farsi",
      "هالندی + دری/فارسی",
      "هالنډي + دري/فارسي"
    ],
    "regular": 4999,
    "sale": 1999,
    "locales": [
      "nl",
      "fa"
    ]
  },
  "theory_b_nl_ps_30d": {
    "name": [
      "Nederlands + Pashto",
      "هالندی + پشتو",
      "هالنډي + پښتو"
    ],
    "regular": 4999,
    "sale": 1999,
    "locales": [
      "nl",
      "ps"
    ]
  },
  "theory_b_book": {
    "name": [
      "Mursal Theorie B-boek",
      "کتاب تیوری B مرسال",
      "د مرسال تیوري B کتاب"
    ],
    "regular": 6500,
    "locales": []
  }
});

export function catalogue(now = Date.now()) {
  const sale = Number(now) < Date.parse(CAMPAIGN_END);
  return { campaign: { active:sale, endsAt:CAMPAIGN_END, timeZone:'Europe/Amsterdam' },
    products:Object.entries(OFFERS).map(([key,p])=>({key,name:p.name,locales:p.locales,
      kind:key==='theory_b_book'?'physical':'digital', days:key==='theory_b_book'?null:30,
      amount: sale && p.sale ? p.sale : p.regular, currency:'EUR',
      available:!p.locales.includes('ps')||PASHTO_SALES_READY })) };
}
export function offerFor(key, now = Date.now()) {
  return catalogue(now).products.find(p=>p.key===key)||null;
}
