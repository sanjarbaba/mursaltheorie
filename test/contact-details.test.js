import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

for (const file of ['index.html', 'privacy.html', 'voorwaarden.html']) {
  test(`${file} uses the current phone and WhatsApp number`, () => {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /tel:\+31612604593/);
    assert.match(source, /wa\.me\/31612604593/);
    assert.doesNotMatch(source, /31647077801|06 47077801/);
  });
}

