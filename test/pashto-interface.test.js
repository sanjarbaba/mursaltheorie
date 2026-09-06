import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../learn5.html', import.meta.url), 'utf8');
const accountData = readFileSync(new URL('../account-data.js', import.meta.url), 'utf8');

test('every literal interface phrase has a Pashto translation', () => {
  const base = page.match(/const PS_UI=\{([\s\S]*?)\};/)?.[1] || '';
  const additions = page.match(/Object\.assign\(PS_UI,\{([\s\S]*?)\}\);/)?.[1] || '';
  const keys = new Set();
  for (const source of [base, additions]) {
    for (const match of source.matchAll(/'((?:\\'|[^'])*)'\s*:/g)) keys.add(match[1]);
  }
  const phrases = [...page.matchAll(/\btr\(\s*'((?:\\'|[^'])*)'/g)].map((match) => match[1]);
  const missing = [...new Set(phrases.filter((phrase) => !keys.has(phrase)))];
  assert.deepEqual(missing, []);
  assert.ok(keys.size >= 140);
});

test('Pashto content is fetched separately and never replaced with Dari', () => {
  assert.match(accountData, /lessons\?locale=ps/);
  assert.match(accountData, /exams\?locale=ps/);
  assert.match(accountData, /promptPs: psQuestions/);
  assert.match(accountData, /optionsPs: psQuestions/);
  assert.doesNotMatch(accountData, /promptPs:\s*faQuestions/);
  assert.doesNotMatch(accountData, /optionsPs:\s*faQuestions/);
});

