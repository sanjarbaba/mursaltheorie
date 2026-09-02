import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('special manoeuvres receive ten bilingual rules, tips and matching media', async () => {
  const sql = await readFile(
    new URL('../database/migrations/008_special_manoeuvres_content.sql', import.meta.url),
    'utf8'
  );
  const lessonNumbers = [...sql.matchAll(/^\s*\((5[1-9]|60),/gm)].map((match) => Number(match[1]));
  assert.deepEqual(lessonNumbers, [51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
  assert.match(sql, /theory-028-exit-parking\.webp/);
  assert.match(sql, /theory-029-three-point-turn\.webp/);
  assert.match(sql, /theory-030-lane-change\.webp/);
  assert.match(sql, /updated_count <> 10/);
});

