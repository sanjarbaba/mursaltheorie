import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../database/migrations/034_tram_lesson_media_fix.sql', import.meta.url), 'utf8');

test('existing databases receive the corrected tram image', () => {
  assert.match(migration, /lesson_number\s*=\s*37/i);
  assert.match(migration, /tram-gelijkwaardig-kruispunt\.jpg/);
  assert.match(migration, /schema_migrations\(version, name\)[\s\S]*34/);
});

