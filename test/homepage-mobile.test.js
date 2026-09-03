import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('signed-in mobile homepage header cannot widen the page', () => {
  assert.match(home, /html,body\{max-width:100%;overflow-x:hidden;overscroll-behavior-x:none\}/);
  assert.match(home, /@media\(max-width:620px\)\{\.top\{display:grid;grid-template-columns:38px minmax\(0,1fr\) minmax\(0,1\.15fr\) 40px/);
  assert.match(home, /\.brandName\{display:none\}/);
  assert.match(home, /\.top #logoutTop\{display:block;width:40px;min-width:40px;height:40px/);
  assert.match(home, /\.top #logoutTop\[hidden\]\{display:none\}/);
  assert.doesNotMatch(home, /width:\s*100vw/);
});

test('compact sign-out control remains accessible', () => {
  assert.match(home, /id="logoutTop" aria-label="Uitloggen" title="Uitloggen"/);
  assert.match(home, /logout\.setAttribute\('aria-label',logout\.textContent\)/);
});

