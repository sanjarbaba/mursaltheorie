import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../database/migrations/038_correct_remaining_situation_content.sql', import.meta.url);

test('remaining mismatches receive situation-specific media', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  for (const lesson of [10, 58, 75, 105, 107, 108, 109, 114, 115, 132, 135]) {
    assert.match(sql, new RegExp(`\\(${lesson}, '/images/questions/lesson-${String(lesson).padStart(3, '0')}-`));
  }
  assert.match(sql, /\(82, '\/images\/signs\/G1\.svg'\)/);
});

test('incorrect snorfiets, load and trailer questions are replaced', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /blauwe kentekenplaat/);
  assert.match(sql, /Stevig vastzetten en zo nodig duidelijk markeren/);
  assert.match(sql, /aanhangwagen van minder dan 3\.500 kg/);
  assert.match(sql, /90 km\/u/);
  assert.match(sql, /VALUES \(38, 'correct_remaining_situation_content'\)/);
});