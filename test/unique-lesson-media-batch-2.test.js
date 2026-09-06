import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('second unique-media batch covers the remaining obvious mismatches', async()=>{
  const sql=await readFile(new URL('../database/migrations/039_unique_lesson_media_batch_2.sql',import.meta.url),'utf8');
  for(const lesson of [1,48,76,79,81,102,149]) assert.match(sql,new RegExp(`\\(${lesson},`));
  assert.match(sql,/mismatches<>0/);
  assert.match(sql,/VALUES\(39,'unique_lesson_media_batch_2'\)/);
});