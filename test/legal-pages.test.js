import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('privacy and terms pages are present and linked', () => {
  const app = fs.readFileSync(new URL('../learn5.source.html', import.meta.url), 'utf8');
  const privacy = fs.readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
  const terms = fs.readFileSync(new URL('../voorwaarden.html', import.meta.url), 'utf8');
  assert.match(app, /href="\/privacy"/);
  assert.match(app, /href="\/voorwaarden"/);
  assert.match(privacy, /account en voortgang verwijderen/);
  assert.match(terms, /geen garantie op slagen/);
});

