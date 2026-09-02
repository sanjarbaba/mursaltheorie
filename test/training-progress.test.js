import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../learn5.source.html', import.meta.url), 'utf8');

test('training score persists and only counts the first answer', () => {
  assert.match(html, /localStorage\.getItem\('mt-training'\)/);
  assert.match(html, /if\(S\.hazAns!=null\)return;S\.hazAns=a;S\.training\.answered\+\+/);
  assert.match(html, /localStorage\.setItem\('mt-training',JSON\.stringify\(S\.training\)\)/);
});

test('training screen displays correct, answered and percentage', () => {
  assert.match(html, /S\.training\.correct\/S\.training\.answered\*100/);
  assert.match(html, /S\.training\.correct\}\/\$\{S\.training\.answered\}/);
});

