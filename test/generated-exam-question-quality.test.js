import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../database/migrations/035_generated_exam_question_quality.sql', import.meta.url);

test('generated questions use only their own lesson and unambiguous distractors', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.doesNotMatch(sql, /next_rule|second_next_rule|next_tip|second_next_tip|next_summary/);
  assert.match(sql, /verkeersborden, wegmarkering of andere weggebruikers/);
  assert.match(sql, /'\[0,1\]'::jsonb/);
  assert.match(sql, /corrected_count <> 888/);
  assert.match(sql, /invalid_answers <> 0/);
  assert.match(sql, /VALUES \(35, 'generated_exam_question_quality'\)/);
});
