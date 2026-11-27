import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../api/v1/access.js',import.meta.url),'utf8');
const start=source.indexOf('async function processStripeWebhook(');
const fn=source.slice(start,source.indexOf('\nasync function examHistory',start));
function setup(){
  const state={processed:false,entitlements:new Set(),mailReady:false,events:0};
  const order={id:1,clerk_user_id:'test-user',product_key:'theory_b_nl_fa_30d',amount_value:'19.99',status:'active',confirmation_sent_at:null};
  const sql=async(strings,...values)=>{const text=strings.join('?');
    if(text.includes('SELECT id FROM purchase_events'))return state.processed?[{id:1}]:[];
    if(text.includes('FROM purchase_orders'))return[order];
    if(text.includes('INSERT INTO entitlements'))state.entitlements.add('cs_test_example');
    if(text.includes('INSERT INTO purchase_events')){state.processed=true;state.events++;}
    return[];
  };
  const ctx=vm.createContext({configured:()=> 'test-secret',verifyStripeSignature:()=>true,
    getSql:()=>sql,normalizeGuestEmail:e=>e,MOLLIE_PRODUCTS:{theory_b_nl_fa_30d:{kind:'digital'}},
    STRIPE_PAYMENT_LINKS:{theory_b_nl_fa_30d:{id:'plink_sale'}},PRE_BLACK_FRIDAY_STRIPE_PAYMENT_LINK_IDS:{},LEGACY_STRIPE_PAYMENT_LINK_IDS:{},
    ensureUser:async()=>({id:'test-user'}),CONSENT_TEXT:'test consent',CONSENT_VERSION:'test',
    purchaseConfirmationEmail:async()=>state.mailReady?{sent:true,id:'mail_test'}:{sent:false},
    fail:(code,message,status)=>({code,status}),ok:data=>({status:200,data}),console,Date,JSON,Number});
  vm.runInContext(fn,ctx);
  const request=(payment_status='paid')=>({headers:{get:()=> 'verified-test-signature'},text:async()=>JSON.stringify({id:'evt_test',type:'checkout.session.completed',data:{object:{id:'cs_test_example',client_reference_id:'mt_testref',payment_status,payment_link:'plink_sale',currency:'eur',amount_total:1999,customer_details:{email:'test@example.com'}}}})});
  return{ctx,state,request};
}
test('failed confirmation email asks Stripe to retry while preserving a single active entitlement',async()=>{
 const {ctx,state,request}=setup();const first=await ctx.processStripeWebhook(request());
 assert.equal(first.status,503);assert.equal(first.code,'PURCHASE_CONFIRMATION_PENDING');
 assert.equal(state.entitlements.size,1);assert.equal(state.processed,false);
 state.mailReady=true;const second=await ctx.processStripeWebhook(request());
 assert.equal(second.status,200);assert.equal(state.entitlements.size,1);assert.equal(state.events,1);
 const third=await ctx.processStripeWebhook(request());assert.equal(third.data.duplicate,true);assert.equal(state.events,1);
});
test('an unpaid completion does not create access or process an event',async()=>{
 const {ctx,state,request}=setup();const result=await ctx.processStripeWebhook(request('unpaid'));
 assert.equal(result.data.pending,true);assert.equal(state.entitlements.size,0);assert.equal(state.events,0);
});
