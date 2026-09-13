import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { localized } from '../api/v1/_contract.js';

const html = fs.readFileSync(new URL('../learn5.html', import.meta.url), 'utf8');
const catalog = fs.readFileSync(new URL('../pashto-content.js', import.meta.url), 'utf8');
test('all inline application scripts parse after Pashto integration', () => {
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => new vm.Script(match[1]));
  }
});
function app(language = 'ps') {
  const context = vm.createContext({ S: { lang: language }, PS_UI: {} });
  vm.runInContext(catalog, context);
  vm.runInContext("const isRtl=()=>S.lang==='fa'||S.lang==='ps'; const tr=(nl,fa,ps)=>S.lang==='fa'?fa:S.lang==='ps'?(ps||MT_PASHTO[nl]||nl):nl;", context);
  for (const name of ['bilingual', 'bilingualAnswer', 'questionFor', 'reviewAnswerMarkup', 'wordsView', 'signsView', 'hazardView']) {
    const line = html.split('\n').find(line => line.startsWith(`function ${name}(`));
    // wordsView and hazardView continue on the next line.
    const start = html.indexOf(line);
    const count = ['wordsView', 'hazardView'].includes(name) ? 2 : 1;
    vm.runInContext(html.slice(start).split('\n').slice(0, count).join('\n'), context);
  }
  vm.runInContext(html.slice(html.indexOf('const WORD='), html.indexOf('\n', html.indexOf('const WORD='))), context);
  vm.runInContext(html.slice(html.indexOf('const H='), html.indexOf('const FA_H=')), context);
  return context;
}

test('first lesson module has complete draft translations with three stable options', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../docs/pashto-module-01.json', import.meta.url), 'utf8'));
  assert.equal(data.status, 'draft-needs-native-review');
  assert.equal(data.lessons.length, 10);
  data.lessons.forEach((lesson, index) => {
    assert.equal(lesson.n, index + 1);
    for (const key of ['title', 'summary', 'rule', 'tip', 'question', 'explanation']) assert.match(lesson[key], /[\u0600-\u06ff]/);
    assert.equal(lesson.options.length, 3);
    assert.equal(new Set(lesson.options).size, 3);
  });
});

test('Pashto localization never falls back to Dari', () => {
  assert.equal(localized({ fa: 'DARI' }, 'ps'), '');
  assert.equal(localized({ nl: 'Dutch', fa: 'DARI' }, 'ps'), 'Dutch');
  assert.equal(localized({ nl: 'Dutch', ps: 'پښتو' }, 'ps'), 'پښتو');
});

test('all 30 training questions and explanations have independent Pashto text', () => {
  const context = app();
  const report = vm.runInContext('H.map(h=>({q:MT_PASHTO[h.q],why:MT_PASHTO[h.why]}))', context);
  assert.equal(report.length, 30);
  for (const row of report) {
    assert.match(row.q, /[\u0600-\u06ff]/);
    assert.match(row.why, /[\u0600-\u06ff]/);
  }
});

test('Pashto word list renders all 24 words without Dari', () => {
  const context = app();
  const result = vm.runInContext('wordsView()', context);
  assert.equal((result.match(/lang=ps/g) || []).length, 24);
  assert.ok(!result.includes('حق تقدم'));
  context.S.lang = 'nl';
  assert.ok(!vm.runInContext('wordsView()', context).includes('lang=ps'));
});

test('all 13 traffic signs include separate Pashto titles and descriptions', () => {
  const context = app();
  context.S.signCat = 'all';
  context.signSvg = () => '';
  const result = vm.runInContext('signsView()', context);
  assert.equal((result.match(/lang=ps/g) || []).length, 26);
  assert.ok(!result.includes('lang=fa'));
  assert.ok(result.includes('د لومړي تېرېدو حق'));
});

test('exam questions keep Dutch and Pashto separate and review shows Pashto options', () => {
  const context = app();
  context.questions = [{ id: 1, promptNl: 'Dutch question', promptFa: 'Dari question', promptPs: 'پښتو پوښتنه', optionsNl: ['Dutch A', 'Dutch B'], optionsFa: ['Dari A', 'Dari B'], optionsPs: ['ځواب الف', 'ځواب ب'], correctOption: 1, explanationPs: 'تشریح' }];
  const question = vm.runInContext('questionFor(0,1,questions)', context);
  assert.equal(question.qNl, 'Dutch question');
  assert.equal(question.qPs, 'پښتو پوښتنه');
  assert.equal(question.aNl[0], 'Dutch A');
  context.question = question;
  const result = vm.runInContext('reviewAnswerMarkup(question,0)', context);
  assert.ok(result.includes('Dutch A'));
  assert.ok(result.includes('ځواب الف'));
  assert.ok(!result.includes('Dari A'));
  assert.ok(result.includes('bad'));
  assert.ok(result.includes('good'));
});
