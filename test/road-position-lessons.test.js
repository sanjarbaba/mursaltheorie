import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('road-position lessons 11-20 have bilingual quizzes and corrected media', async () => {
  const sql = await readFile(new URL('../database/migrations/010_road_position_lessons.sql', import.meta.url), 'utf8');
  const lessons = [...sql.matchAll(/^\s*\((1[1-9]|20),/gm)].map((match) => Number(match[1]));
  assert.deepEqual(lessons, [11,12,13,14,15,16,17,18,19,20]);
  assert.match(sql, /theory-037-motorway-exit\.webp/);
  assert.match(sql, /theory-030-lane-change\.webp/);
  assert.match(sql, /valid_count<>10/);
});

