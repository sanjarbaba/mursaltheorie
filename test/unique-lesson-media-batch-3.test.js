import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('third media batch gives ten lessons a dedicated situation image', async () => {
  const sql = await readFile(
    new URL('../database/migrations/040_unique_lesson_media_batch_3.sql', import.meta.url),
    'utf8',
  );

  for (const lessonNumber of [40, 49, 59, 65, 70, 74, 88, 99, 103, 129]) {
    assert.match(sql, new RegExp(`\\(${lessonNumber}, '/images/questions/lesson-${String(lessonNumber).padStart(3, '0')}-`));
  }
  assert.match(sql, /UPDATE exam_questions_v1 AS question/);
  assert.match(sql, /external_key LIKE 'cbr2026-q%'/);
  assert.match(sql, /VALUES \(40, 'unique_lesson_media_batch_3'\)/);
});