import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('intersection lesson migration covers lessons 41-50', () => {
  const sql = fs.readFileSync(new URL('../database/migrations/013_intersections_lessons.sql', import.meta.url), 'utf8');
  for (let n = 41; n <= 50; n++) assert.match(sql, new RegExp(`\\(${n},`));
  assert.match(sql, /VALUES\(13,'intersections_lessons'\)/);
  assert.match(sql, /content_blocks->2->>'type'='quiz'/);
});

