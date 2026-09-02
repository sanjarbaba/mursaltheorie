import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(new URL('../database/migrations/025_exam_media_alignment.sql', import.meta.url), 'utf8');

test('specific exam prompts use matching existing situation images', () => {
  const mappings = [...sql.matchAll(/\('learn5-q(\d+)', '([^']+)'\)/g)];
  assert.equal(mappings.length, 11);
  assert.match(sql, /learn5-q12'.*landelijke 80-weg/);
  assert.match(sql, /learn5-q17'.*no-parking/);
  assert.match(sql, /learn5-q25'.*haalt grijze auto links in/);
  assert.match(sql, /learn5-q26'.*traffic-lights/);
  assert.match(sql, /learn5-q29'.*Bandenspanning controleren/);
  assert.match(sql, /'alt', question\.prompt->>'nl'/);
});

