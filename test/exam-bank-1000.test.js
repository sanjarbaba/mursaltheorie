import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../database/migrations/028_expand_exam_bank_to_1000.sql', import.meta.url);

test('question bank migration creates exactly 1,000 unique bilingual questions', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /lesson\.lesson_number BETWEEN 1 AND 148/);
  assert.match(sql, /generate_series\(1, 6\)/);
  assert.match(sql, /bank_count <> 1000/);
  assert.match(sql, /generated_count <> 888/);
  assert.match(sql, /duplicate_prompts <> 0/);
  assert.match(sql, /count\(DISTINCT link\.question_id\) <> 50/);
  assert.match(sql, /minimum_usage <> 1/);
  assert.match(sql, /maximum_usage <> 2/);
  assert.match(sql, /'nl'/);
  assert.match(sql, /'fa'/);
});

