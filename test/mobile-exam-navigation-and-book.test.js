import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const learn = readFileSync(new URL('../learn5.html', import.meta.url), 'utf8');
const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const accessApi = readFileSync(new URL('../api/v1/access.js', import.meta.url), 'utf8');
const bookMigration = readFileSync(new URL('../database/migrations/043_physical_book_orders.sql', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../database/migrations/042_fix_exam_one_first_question_media.sql', import.meta.url), 'utf8');

test('mobile exam stays in one viewport and keeps answer scroll position', () => {
  assert.match(learn, /height:100dvh/);
  assert.match(learn, /renderExamPreservingScroll/);
  assert.match(learn, /class=exam-answers/);
  assert.match(learn, /moveExam\(-1\)/);
  assert.match(learn, /moveExam\(1\)/);
  assert.match(learn, />← \$\{tr\('Vorige'/);
});

test('lesson, exercise, exam and book buttons have explicit actions', () => {
  assert.match(learn, /Naar lessen/);
  assert.match(learn, /Naar oefeningen/);
  assert.match(learn, /Naar examens/);
  assert.match(learn, /Mursaltheorie B-boek/);
  assert.match(home, /Koop voor €65 via Mollie/);
  assert.match(home, /\/learn5\?buy=book/);
  assert.match(learn, /submitBookCheckout/);
  assert.match(learn, /mtStartCheckout\?\.\('theory_b_book',false,shipping\)/);
});

test('physical book checkout is separate from digital access', () => {
  assert.match(accessApi, /theory_b_book: Object\.freeze\(\{ amount: '65\.00'/);
  assert.match(accessApi, /product\.kind === 'physical'/);
  assert.match(accessApi, /if \(!isPhysical\) \{/);
  assert.match(accessApi, /paid_awaiting_fulfillment/);
  assert.match(accessApi, /normalizedShipping/);
  assert.match(bookMigration, /shipping_details JSONB/);
  assert.match(bookMigration, /paid_awaiting_fulfillment/);
});

test('exam one first generated question receives the tram intersection image', () => {
  assert.match(migration, /lesson_number = 37/);
  assert.match(migration, /lesson-037-tram-gelijkwaardig-kruispunt\.jpg/);
  assert.match(migration, /exam_questions_v1/);
});
