import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { catalogue,offerFor,CAMPAIGN_END } from '../storefront-config.js';
import { GET as accessRequest } from '../api/v1/access.js';
import reviews from '../api/v1/reviews.js';
import {reviewInput,verifiedReviewEligible} from '../api/v1/_review.js';
const access={fetch:accessRequest};

test('the approved Dutch deadline is an absolute CET instant',()=>{
  assert.equal(new Date(CAMPAIGN_END).toISOString(),'2026-11-30T22:59:00.000Z');
});
test('website and checkout use the verified 1999-cent offers before the deadline',()=>{
  const active=catalogue(Date.parse(CAMPAIGN_END)-1);
  assert.equal(active.campaign.active,true);
  for(const p of active.products.filter(p=>p.kind==='digital'))assert.equal(p.amount,1999);
  assert.equal(active.products.find(p=>p.key==='theory_b_book').amount,6500);
});
test('the sale ends without a visit or timer callback, selecting the existing regular links',()=>{
  const now=Date.parse(CAMPAIGN_END),after=catalogue(now);
  assert.equal(after.campaign.active,false);
  assert.equal(offerFor('theory_b_nl_30d',now).amount,2999);
  assert.equal(offerFor('theory_b_nl_fa_30d',now).amount,4999);
  assert.equal(offerFor('theory_b_nl_30d',now).paymentLink.id,'plink_1UTNb0KBUCvMx3oMW7c491tF');
  assert.equal(offerFor('theory_b_nl_fa_30d',now).paymentLink.id,'plink_1UTNbGKBUCvMx3oMd0ZLAj4X');
});
test('Pashto sales are paused without removing existing entitlement products',async()=>{
  assert.equal(offerFor('theory_b_nl_ps_30d').available,false);
  const {productLocales}=await import('../api/v1/_products.js');
  assert.deepEqual(productLocales('theory_b_nl_ps_30d'),['nl','ps']);
});
test('every checkout entry point rejects a paused product before any database call',async()=>{
  const source=readFileSync(new URL('../api/v1/access.js',import.meta.url),'utf8');
  for(const name of ['createCheckout','createGuestCheckout','createGuestStripeCheckout']){
    const start=source.indexOf('async function '+name+'('),next=source.indexOf('\nasync function ',start+1);
    const fn=source.slice(start,next<0?source.length:next);
    const ctx=vm.createContext({offerFor,configured:()=> 'test_key',normalizeGuestEmail:value=>value,fail:(code,message,status)=>({code,status})});
    vm.runInContext(fn,ctx);
    const sql=()=>{throw Error('Database must not be called for paused sales');};
    const result=name==='createCheckout'?await ctx[name](sql,'user','test@example.com','theory_b_nl_ps_30d'):name==='createGuestCheckout'?await ctx[name](sql,'test@example.com','theory_b_nl_ps_30d',true):await ctx[name](sql,'theory_b_nl_ps_30d');
    assert.equal(result.code,'PRODUCT_COMING_SOON');
  }
});
test('the public catalogue does not require Clerk or query customer data',async()=>{
  const response=await access.fetch(new Request('https://test.example/api/v1/access?resource=catalog'));
  assert.equal(response.status,200);const payload=await response.json();
  assert.equal(payload.data.products.length,4);assert.equal(typeof payload.data.serverTime,'number');
  assert.equal(JSON.stringify(payload).includes('customer_email'),false);
});
test('preview cannot create purchases or process production webhooks',async()=>{
  const previous=process.env.VERCEL_ENV;process.env.VERCEL_ENV='preview';
  try{for(const resource of ['guest-stripe-checkout','guest-checkout','checkout','stripe-webhook','mollie-webhook']){
    const response=await access.fetch(new Request('https://preview.example/api/v1/access?resource='+resource,{method:'POST',body:'{}'}));
    assert.equal(response.status,403);assert.equal((await response.json()).error.code,'PREVIEW_READ_ONLY');
  }}finally{if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
});
test('preview cannot use the shared live database, even through a GET endpoint',async()=>{
  const previous=process.env.VERCEL_ENV;process.env.VERCEL_ENV='preview';
  try{const {getSql}=await import('../api/_lib.js');assert.throws(()=>getSql(),{code:'PREVIEW_ISOLATION_REQUIRED'});}
  finally{if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
});
test('an unlaunched review system exposes no customer data and accepts no submissions',async()=>{
  const previous=process.env.REVIEWS_ENABLED;delete process.env.REVIEWS_ENABLED;
  try{assert.deepEqual((await(await reviews.fetch(new Request('https://test/reviews'))).json()).data.reviews,[]);
    assert.equal((await reviews.fetch(new Request('https://test/reviews',{method:'POST'}))).status,503);
  }finally{if(previous!==undefined)process.env.REVIEWS_ENABLED=previous;}
});
test('review input requires explicit publication consent and bounded text',()=>{
  const input={rating:5,text:'Dit is een echte inhoudelijke beoordeling.',displayName:'Student',publicationConsent:true};
  assert.ok(reviewInput(input));assert.equal(reviewInput({...input,publicationConsent:false}),null);
  assert.equal(reviewInput({...input,rating:6}),null);assert.equal(reviewInput({...input,text:'kort'}),null);
  assert.equal(verifiedReviewEligible([{status:'payment_pending',paid_at:null}]),false);
  assert.equal(verifiedReviewEligible([{status:'active',paid_at:'2026-11-20'}]),true);
});
