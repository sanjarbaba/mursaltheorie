import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('mobile layout prevents horizontal swipe into an empty canvas', () => {
  const html = fs.readFileSync(new URL('../learn5.source.html', import.meta.url), 'utf8');
  assert.match(html, /html,body\{max-width:100%;overflow-x:hidden;overscroll-behavior-x:none\}/);
  assert.match(html, /body\{touch-action:pan-y\}/);
  assert.match(html, /\.top>\.signout span\{display:none\}/);
});

