import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../learn5.source.html', import.meta.url), 'utf8');
const accountData = fs.readFileSync(new URL('../account-data.js', import.meta.url), 'utf8');

test('account data loads course access before rendering the account view', () => {
  assert.match(accountData, /apiRequest\('\/api\/v1\/access'\)/);
  assert.match(accountData, /access: access\.access \|\| null/);
  assert.match(html, /S\.access=event\.detail\.access\|\|null/);
});

test('checkout is shown only without access and redirects to hosted checkout', () => {
  assert.match(html, /S\.access&&!S\.access\.hasAccess/);
  assert.match(html, /onclick=startCheckout\(\)/);
  assert.match(accountData, /apiRequest\('\/api\/v1\/access\?resource=checkout'/);
  assert.match(accountData, /window\.location\.assign\(result\.checkoutUrl\)/);
  assert.doesNotMatch(html, /cardNumber|cvc|expiry/i);
});

