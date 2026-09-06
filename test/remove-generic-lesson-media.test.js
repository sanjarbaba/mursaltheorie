import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../database/migrations/037_remove_generic_lesson_media.sql', import.meta.url);

test('all remaining generic lesson images receive a dedicated situation image', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  const mappings = [...sql.matchAll(/\((77|78|124|128|130|136|137|141|143), '\/images\/questions\/[^']+'\)/g)];

  assert.equal(mappings.length, 9);
  assert.match(sql, /generic_lessons <> 0/);
  assert.match(sql, /question\.media IS DISTINCT FROM lesson\.media/);
  assert.match(sql, /VALUES \(37, 'remove_generic_lesson_media'\)/);
});
