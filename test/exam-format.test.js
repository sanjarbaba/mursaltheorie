import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('CBR 2025-migratie maakt elk examen 50 vragen met een 44/50-slaaggrens', async () => {
  const sql = await readFile(
    new URL('../database/migrations/006_cbr_2025_fifty_question_exams.sql', import.meta.url),
    'utf8'
  );

  const newQuestionKeys = [...sql.matchAll(/'cbr2025-q(\d{2})'/g)].map((match) => match[1]);
  assert.equal(new Set(newQuestionKeys).size, 20);
  assert.match(sql, /SET question_count = 50/);
  assert.match(sql, /pass_score = 88/);
  assert.match(sql, /duration_seconds = 1800/);
  assert.match(sql, /linked<>50 OR unique_linked<>50|CROSS JOIN added_questions/);
});

