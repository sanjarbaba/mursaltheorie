import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const course = fs.readFileSync(new URL('../learn5.html', import.meta.url), 'utf8');
const access = fs.readFileSync(new URL('../api/v1/access.js', import.meta.url), 'utf8');

test('home checkout sends new and existing customers directly to Stripe without Clerk first', () => {
  const purchase = home.match(/async function beginPurchase\(productKey\)\{[\s\S]*?\}function startDemo/);
  assert.ok(purchase, 'direct purchase handler is present');
  assert.match(purchase[0], /resource=guest-stripe-checkout/);
  assert.match(purchase[0], /location\.assign\(checkoutUrl\)/);
  assert.doesNotMatch(purchase[0], /mtOpenAuth|homeSignedIn|purchaseEmail/);
});

test('only a verified paid Stripe session provisions access to the checkout email', () => {
  assert.match(access, /resource === 'guest-stripe-checkout'/);
  assert.match(access, /verifyStripeSignature\(payload/);
  assert.match(access, /object\.payment_status !== 'paid'/);
  assert.match(access, /object\.consent\?\.terms_of_service !== 'accepted'/);
  assert.match(access, /findOrCreatePaidCustomer\(paidEmail\)/);
  assert.match(access, /INSERT INTO entitlements/);
  assert.match(access, /purchaseConfirmationEmail/);
});

test('both pages offer one menu for all three languages', () => {
  for (const page of [home, course]) {
    assert.match(page, /Nederlands<\/button>/);
    assert.match(page, /دری \/ فارسی<\/button>/);
    assert.match(page, /پښتو<\/button>/);
  }
  assert.match(home, /header-languages/);
  assert.match(course, /course-language-menu/);
});
