import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('priority lesson migration covers lessons 31-40 with bilingual quizzes', () => {
  const sql = fs.readFileSync(new URL('../database/migrations/012_priority_lessons.sql', import.meta.url), 'utf8');
  for (let n = 31; n <= 40; n++) assert.match(sql, new RegExp(`\\(${n},`));
  assert.equal((sql.match(/'type','quiz'/g) || []).length, 1);
  assert.match(sql, /INSERT INTO schema_migrations\(version,name\) VALUES\(12,'priority_lessons'\)/);
  assert.match(sql, /'fa'/);
});

