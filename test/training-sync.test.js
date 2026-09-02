import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('training progress has an account API and database table', () => {
  const migration = fs.readFileSync(new URL('../database/migrations/024_training_progress.sql', import.meta.url), 'utf8');
  const api = fs.readFileSync(new URL('../api/v1/progress.js', import.meta.url), 'utf8');
  const client = fs.readFileSync(new URL('../account-data.js', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS training_progress/);
  assert.match(api, /correct > answered/);
  assert.match(api, /EXCLUDED\.client_updated_at >= training_progress\.client_updated_at/);
  assert.match(client, /window\.mtSaveTrainingProgress/);
  assert.match(client, /apiRequest\('\/api\/v1\/progress\?resource=training'/);
});

