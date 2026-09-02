import fs from 'node:fs';
import path from 'node:path';

const migration = process.argv[2] ?? path.resolve('database/migrations/003_seed_learn5_content.sql');
const source = fs.readFileSync(migration, 'utf8');
const blocks = [...source.matchAll(/\$content\$([\s\S]*?)\$content\$::jsonb/g)].map((match) => JSON.parse(match[1]));
const lessons = blocks.flat().filter((item) => item.lessonNumber !== undefined);
const questions = blocks.flat().filter((item) => item.externalKey !== undefined);

const duplicates = (values) => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count] => count > 1).sort((a, b) => b[1] - a[1]);
};
