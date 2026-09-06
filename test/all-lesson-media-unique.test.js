import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const lessons = [8, 22, 23, 28, 30, 38, 41, 54, 56, 57, 60, 68, 84, 91, 92, 94, 96, 100, 106, 113, 126, 140, 144, 145];

test('final media migration assigns a dedicated image to every remaining duplicate lesson', async () => {
  const sql = await readFile(new URL('../database/migrations/041_make_all_lesson_media_unique.sql', import.meta.url), 'utf8');
  for (const lesson of lessons) {
    const prefix = String(lesson).padStart(3, '0');
    assert.match(sql, new RegExp(`\\(${lesson}, '/images/questions/lesson-${prefix}-`));
    const match = sql.match(new RegExp(`\\(${lesson}, '([^']+)'\\)`));
    assert.ok(match, `missing media mapping for lesson ${lesson}`);
    await access(new URL(`..${match[1]}`, import.meta.url));
  }
  assert.equal(new Set([...sql.matchAll(/\/images\/questions\/lesson-[^']+/g)].map((match) => match[0])).size, lessons.length);
  assert.match(sql, /VALUES \(41, 'make_all_lesson_media_unique'\)/);
});