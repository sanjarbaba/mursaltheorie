import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('exam bank migration adds questions 51 through 100 and selects 50 per exam', async () => {
  const sql = await readFile(
    new URL('../database/migrations/007_expand_exam_bank_to_100.sql', import.meta.url),
    'utf8'
  );

  const keys = [...sql.matchAll(/'cbr2025-q(\d+)'/g)].map((match) => Number(match[1]));
  assert.equal(new Set(keys).size, 50);
  assert.equal(Math.min(...keys), 51);
  assert.equal(Math.max(...keys), 100);
  assert.match(sql, /WHERE sort_order <= 50/);
  assert.match(sql, /count\(DISTINCT link\.question_id\) <> 50/);
  assert.match(sql, /bank_count < 100/);
});

