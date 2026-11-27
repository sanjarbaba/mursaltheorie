// One verified catalogue shared by the public pages and checkout creation.
// Never use current catalogue amounts to validate older paid orders.
export const CAMPAIGN_END = '2026-11-30T23:59:00+01:00';
export const PASHTO_SALES_READY = false;
export const OFFERS = Object.freeze({
  theory_b_nl_30d: { name: ['Nederlands','هالندی','هالنډي'], regular: 2999, sale: 1999, locales: ['nl'],
    saleLink: { id:'plink_1UZeFyKBUCvMx3oMiDbpDge9',url:'https://buy.stripe.com/bJe3cw1uL37Das14b0aVa09' },
    regularLink: { id:'plink_1UTNb0KBUCvMx3oMW7c491tF',url:'https://buy.stripe.com/14A7sMehxfUpdEd5f4aVa04' } },
  theory_b_nl_fa_30d: { name: ['Nederlands + Dari/Farsi','هالندی + دری/فارسی','هالنډي + دري/فارسي'], regular: 4999, sale: 1999, locales: ['nl','fa'],
    saleLink: { id:'plink_1UZeG0KBUCvMx3oMpLw8jIX8',url:'https://buy.stripe.com/dRm5kEflB0Zv2Zz36WaVa0a' },
    regularLink: { id:'plink_1UTNbGKBUCvMx3oMd0ZLAj4X',url:'https://buy.stripe.com/dRm28s6P5cIdcA96j8aVa05' } },
  theory_b_nl_ps_30d: { name: ['Nederlands + Pashto','هالندی + پشتو','هالنډي + پښتو'], regular: 4999, sale: 1999, locales: ['nl','ps'],
    saleLink: { id:'plink_1UZeG2KBUCvMx3oMSw1vkLhz',url:'https://buy.stripe.com/4gM6oIddt5fL0RrgXMaVa0b' },
    regularLink: { id:'plink_1UTNbKKBUCvMx3oMgJygTZSd',url:'https://buy.stripe.com/5kQ5kEgpF5fL0Rr22SaVa06' } },
  theory_b_book: { name:['Mursal Theorie B-boek','کتاب تیوری B مرسال','د مرسال تیوري B کتاب'],regular:6500,locales:[],
    regularLink:{id:'plink_1UTOpPKBUCvMx3oMZdkQAVVy',url:'https://buy.stripe.com/fZu7sM2yPgYt9nXcHwaVa07'} }
});
export function catalogue(now = Date.now()) {
  const sale = Number(now) < Date.parse(CAMPAIGN_END);
  return { campaign: { active:sale, endsAt:CAMPAIGN_END, timeZone:'Europe/Amsterdam' },
    products:Object.entries(OFFERS).map(([key,p])=>({key,name:p.name,locales:p.locales,
      kind:key==='theory_b_book'?'physical':'digital', days:key==='theory_b_book'?null:30,
      amount: sale && p.sale ? p.sale : p.regular, currency:'EUR',
      available:!p.locales.includes('ps')||PASHTO_SALES_READY,
      paymentLink:sale&&p.sale?p.saleLink:p.regularLink })) };
}
export function offerFor(key, now = Date.now()) {
  return catalogue(now).products.find(p=>p.key===key)||null;
}
