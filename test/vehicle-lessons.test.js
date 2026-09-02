import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('vehicle lessons 1-10 contain bilingual rules, tips and unique quizzes', async () => {
  const sql = await readFile(
    new URL('../database/migrations/009_vehicle_documents_lessons.sql', import.meta.url),
    'utf8'
  );
  const lessonNumbers = [...sql.matchAll(/^\s*\((10|[1-9]),/gm)].map((match) => Number(match[1]));
  assert.deepEqual(lessonNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.match(sql, /'type', 'quiz'/);
  assert.match(sql, /'correctOption', data\.correct_option/);
  assert.match(sql, /jsonb_array_length\(content_blocks->2->'options'\) = 3/);
  assert.match(sql, /valid_count <> 10/);
});

test('lesson modal renders lesson-specific quiz data with a safe fallback', async () => {
  const html = await readFile(new URL('../learn5.source.html', import.meta.url), 'utf8');
  assert.match(html, /function lessonQuiz\(l\)/);
  assert.match(html, /quiz=lessonQuiz\(l\)/);
  assert.match(html, /quiz\.question\?\.nl/);
  assert.match(html, /quiz\.explanation\?\.nl/);
  assert.match(html, /bilingualAnswer\(a\.nl\|\|''/);
});

