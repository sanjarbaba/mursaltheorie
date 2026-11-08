import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const access = fs.readFileSync(new URL('../api/v1/access.js', import.meta.url), 'utf8');

test('Black Friday 2026 pricing shows €19,99 on each digital 30-day plan', () => {
  assert.match(home, /BLACK FRIDAY ACTIE/);
  assert.equal((home.match(/<strong>€19,99<\/strong>/g) || []).length, 3);
  assert.match(home, /Mursaltheorie B-boek · €65/);
});

test('server prices and three Stripe links match the campaign', () => {
  assert.equal((access.match(/amount: '19\.99'/g) || []).length, 3);
  assert.match(access, /plink_1UZeFyKBUCvMx3oMiDbpDge9/);
  assert.match(access, /plink_1UZeG0KBUCvMx3oMpLw8jIX8/);
  assert.match(access, /plink_1UZeG2KBUCvMx3oMSw1vkLhz/);
  assert.match(access, /PRE_BLACK_FRIDAY_STRIPE_PAYMENT_LINK_IDS/);
});
