import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../learn5.html', import.meta.url), 'utf8');
const queueCode = html.slice(html.indexOf('function queueExamAnswer('), html.indexOf('function renderExamPreservingScroll('));
function harness(save) {
  const context = vm.createContext({ window: { mtSaveExamAnswer: save }, Map });
  vm.runInContext(queueCode, context);
  return context;
}
test('a temporary save failure is retried and no longer blocks submitting', async () => {
  let calls = 0;
  const ctx = harness(async () => { if (++calls === 1) throw new Error('offline'); });
  const attempt = { id: 1 }, question = { id: 7 };
  ctx.queueExamAnswer(attempt, question, 2);
  assert.equal(await ctx.syncExamAnswers(attempt), true);
  assert.equal(calls, 2);
});
test('a failed older selection cannot overwrite or block the latest answer', async () => {
  const values = [];
  const ctx = harness(async (attempt, question, value) => {
    values.push(value);
    if (values.length === 1) throw new Error('offline');
  });
  const attempt = { id: 1 }, question = { id: 7 };
  ctx.queueExamAnswer(attempt, question, 0);
  ctx.queueExamAnswer(attempt, question, 2);
  assert.equal(await ctx.syncExamAnswers(attempt), true);
  assert.deepEqual(values, [0, 2]);
});
test('multiple failed questions retain their own latest answer for retry', async () => {
  const saved = new Map(), tries = new Map();
  const ctx = harness(async (attempt, id, answer) => {
    tries.set(id, (tries.get(id) || 0) + 1);
    if (tries.get(id) === 1) throw new Error('offline');
    saved.set(id, answer);
  });
  const attempt = { id: 1 };
  ctx.queueExamAnswer(attempt, { id: 7 }, 1);
  ctx.queueExamAnswer(attempt, { id: 8 }, [0, 2]);
  assert.equal(await ctx.syncExamAnswers(attempt), true);
  assert.deepEqual([...saved], [[7, 1], [8, [0, 2]]]);
});
test('a persistent failure can recover on a later submission attempt', async () => {
  let offline = true;
  const ctx = harness(async () => { if (offline) throw new Error('offline'); });
  const attempt = { id: 1 };
  ctx.queueExamAnswer(attempt, { id: 7 }, 0);
  assert.equal(await ctx.syncExamAnswers(attempt), false);
  offline = false;
  assert.equal(await ctx.syncExamAnswers(attempt), true);
});
test('clearing a multiple choice selection sends null, preserving save order', async () => {
  const values = [];
  const ctx = harness(async (attempt, question, answer) => { values.push(answer); });
  const attempt = { id: 1 }, question = { id: 7 };
  ctx.queueExamAnswer(attempt, question, [1]);
  ctx.queueExamAnswer(attempt, question, null);
  assert.equal(await ctx.syncExamAnswers(attempt), true);
  assert.deepEqual(values, [[1], null]);
  assert.match(html, /queueExamAnswer\(e,q,selected.length\?selected:null\)/);
});
test('clearing an answer is scoped to an active owned attempt and question', async () => {
  const source = readFileSync(new URL('../api/v1/exam-attempts.js', import.meta.url), 'utf8');
  const saveCode = source.slice(source.indexOf('async function saveAnswer('), source.indexOf('async function submitAttempt('));
  const queries = [];
  const context = vm.createContext({
    integer: value => Number.isSafeInteger(value) ? value : null,
    questionType: value => value,
    ok: value => value,
    fail: code => ({ error: code }),
    Object, Array,
  });
  vm.runInContext(saveCode, context);
  const sql = async (strings, ...values) => {
    const text = strings.join('?');
    queries.push({ text, values });
    return text.includes('SELECT') ? [{ id: 7, question_type: 'multiple_response', options: [0, 1] }] : [];
  };
  const result = await context.saveAnswer(sql, 'owner', { attemptId: 3, questionId: 7, answer: null });
  assert.equal(result.answer.value, null);
  assert.match(queries[0].text, /a.clerk_user_id = \?/);
  assert.match(queries[0].text, /a.status = 'started'/);
  assert.match(queries[1].text, /DELETE FROM exam_attempt_answers_v1 WHERE attempt_id = \? AND question_id = \?/);
  assert.deepEqual(queries[1].values, [3, 7]);
  queries.length = 0;
  const inactive = await context.saveAnswer(async () => [], 'other', { attemptId: 3, questionId: 7, answer: null });
  assert.equal(inactive.error, 'ATTEMPT_NOT_ACTIVE');
});
test('exam images and lesson detail images preserve the whole scene', () => {
  assert.match(html, /\.questionpic img, #app \.lesson-detail-picture img \{object-fit: contain;/);
  assert.match(html, /class="pic lesson-detail-picture"/);
  assert.doesNotMatch(html, /class=pic style="height:230px"/);
});
