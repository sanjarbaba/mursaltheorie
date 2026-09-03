import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('homepage shows the approved 30-day prices and bilingual introduction offer', () => {
  assert.match(home, /<strong>€29,99<\/strong>/);
  assert.match(home, /<strong>€49,99<\/strong>/);
  assert.match(home, /INTRODUCTIEPRIJS · EERSTE 3 MAANDEN/);
  assert.match(home, /Daarna €64,99 voor 30 dagen\./);
  assert.match(home, /قیمت معرفی · ۳ ماه نخست/);
});

