import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('speed and distance lessons 21-30 have ten bilingual quizzes', async () => {
  const sql=await readFile(new URL('../database/migrations/011_speed_distance_lessons.sql',import.meta.url),'utf8');
  const lessons=[...sql.matchAll(/^\s*\((2[1-9]|30),/gm)].map(m=>Number(m[1]));
  assert.deepEqual(lessons,[21,22,23,24,25,26,27,28,29,30]);
  assert.match(sql,/theory-015-stopping-distance\.webp/);
  assert.match(sql,/Mistachterlicht bij 50 meter zicht\.jpg/);
  assert.match(sql,/n<>10/);
});

