import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';
test('a new language purchase lasts 30 days and cannot extend or alter another purchased language',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`CREATE TABLE entitlements(clerk_user_id text,product_key text,source text,external_reference text,status text,starts_at timestamptz,ends_at timestamptz,updated_at timestamptz,UNIQUE(source,external_reference));
    INSERT INTO entitlements VALUES('test-user','theory_b_nl_30d','web','old-payment','active',now(),now()+interval '90 days',now());`);
  const before=(await db.query("SELECT ends_at FROM entitlements WHERE external_reference='old-payment'")).rows[0].ends_at;
  const source=readFileSync(new URL('../api/v1/access.js',import.meta.url),'utf8');
  const start=source.indexOf('async function processStripeWebhook('),part=source.slice(start);
  const match=part.match(/await sql`\s*INSERT INTO entitlements[\s\S]*?`;/);
  assert.ok(match);
  const ctx=vm.createContext({sql:async(strings,...values)=>db.query(strings.reduce((q,p,i)=>q+p+(i<values.length?'$'+(i+1):''),''),values),userId:'test-user',order:{product_key:'theory_b_nl_fa_30d'},object:{id:'new-payment'}});
  await vm.runInContext('(async()=>{'+match[0]+'})()',ctx);
  const row=(await db.query("SELECT ends_at,starts_at FROM entitlements WHERE external_reference='new-payment'")).rows[0];
  assert.ok(Math.abs((new Date(row.ends_at)-new Date(row.starts_at))/86400000-30)<0.001);
  assert.equal(+new Date((await db.query("SELECT ends_at FROM entitlements WHERE external_reference='old-payment'")).rows[0].ends_at),+new Date(before));
  await vm.runInContext('(async()=>{'+match[0]+'})()',ctx);
  assert.equal(+new Date((await db.query("SELECT ends_at FROM entitlements WHERE external_reference='new-payment'")).rows[0].ends_at),+new Date(row.ends_at));
 }finally{await db.close();}
});
