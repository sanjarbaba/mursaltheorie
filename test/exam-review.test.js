import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../learn5.source.html', import.meta.url), 'utf8');
const account = fs.readFileSync(new URL('../account-data.js', import.meta.url), 'utf8');

test('exam review merges and renders bilingual server explanations', () => {
  assert.match(account, /const nl = await submit\('nl'\)/);
  assert.match(account, /const fa = await submit\('fa'\)/);
  assert.match(account, /explanationNl: answer\.explanation/);
  assert.match(html, /explanationNl:byId\.get\(q\.id\)/);
  assert.match(html, /q\.explanationFa/);
});

test('exam scene map covers specialized question categories', () => {
  for (const category of ['bus','seatbelt','motorway','overtaking','road-position','trailer','emergency']) {
    assert.match(html, new RegExp(`${category.replace('-', '\\-')}[:']`));
  }
  assert.match(html, /bus:'\/images\/Bus vertrekt, auto geeft ruimte\.jpg'/);
  assert.match(html, /'traffic-light':'\/images\/theory-021-traffic-lights\.webp'/);
  assert.match(html, /turning:'\/images\/Auto slaat rechtsaf, fietser rijdt rechtdoor\.jpg'/);
  assert.match(html, /safety:'\/images\/Nederlandse portiercheck bij rood fietspad\.jpg'/);
  assert.match(html, /alcohol:'\/images\/Beginnende bestuurder met alcoholgrens 0,2‰\.jpg'/);
});

