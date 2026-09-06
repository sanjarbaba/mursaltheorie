import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../database/migrations/036_lesson_situation_media_batch_1.sql', import.meta.url);

test('first situation-media batch replaces unrelated images and syncs exam questions', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /lesson-067-landbouwvoertuig-inhalen\.jpg/);
  assert.match(sql, /lesson-089-file-veilig-rijden\.jpg/);
  assert.match(sql, /lesson-117-ouderen-oversteekplaats\.jpg/);
  assert.match(sql, /lesson-119-rolstoelgebruiker-oversteken\.jpg/);
  assert.match(sql, /lesson-123-medicijnen-en-rijden\.jpg/);
  assert.match(sql, /lesson-138-veilig-slepen\.jpg/);
  assert.match(sql, /question\.media IS DISTINCT FROM lesson\.media/);
  assert.match(sql, /VALUES \(36, 'lesson_situation_media_batch_1'\)/);
});
