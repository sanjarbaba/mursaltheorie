import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalogue,CAMPAIGN_END} from '../storefront-config.js';

const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const access = fs.readFileSync(new URL('../api/v1/access.js', import.meta.url), 'utf8');

test('Black Friday prices are time-dependent and unreviewed Pashto is not sold', () => {
  const offers=catalogue(Date.parse(CAMPAIGN_END)-1).products;
  assert.equal(offers.filter(p=>p.kind==='digital'&&p.available&&p.amount===1999).length,2);
  assert.equal(offers.find(p=>p.key==='theory_b_nl_ps_30d').available,false);
  assert.equal(offers.find(p=>p.key==='theory_b_book').amount,6500);
  assert.match(home, /id="storefrontPlans"/);
});

test('server prices and three Stripe links match the campaign', () => {
  assert.equal((access.match(/amount: '19\.99'/g) || []).length, 3);
  assert.match(access, /plink_1UZeFyKBUCvMx3oMiDbpDge9/);
  assert.match(access, /plink_1UZeG0KBUCvMx3oMpLw8jIX8/);
  assert.match(access, /plink_1UZeG2KBUCvMx3oMSw1vkLhz/);
  assert.match(access, /PRE_BLACK_FRIDAY_STRIPE_PAYMENT_LINK_IDS/);
});
