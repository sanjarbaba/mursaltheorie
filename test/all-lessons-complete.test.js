import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('final lesson migration requires all 150 lessons to have a quiz', () => {
  const sql = fs.readFileSync(new URL('../database/migrations/023_special_manoeuvres_quizzes.sql', import.meta.url), 'utf8');
  for (let n = 51; n <= 60; n++) assert.match(sql, new RegExp(`\\b${n}\\b`));
  assert.match(sql, /IF n<>150 THEN RAISE EXCEPTION/);
  assert.match(sql, /VALUES\(23,'special_manoeuvres_quizzes'\)/);
});

