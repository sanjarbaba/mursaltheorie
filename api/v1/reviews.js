import { authenticate,getSql,parseBody } from '../_lib.js';
import { fail,ok } from './_contract.js';
import { reviewInput,verifiedReviewEligible } from './_review.js';
// Opt-in after the migration has been approved and applied to an isolated test database.
export default {async fetch(request){
  if(process.env.REVIEWS_ENABLED!=='true')return request.method==='GET'?ok({reviews:[]}):fail('REVIEWS_NOT_OPEN','Beoordelingen zijn nog niet geopend.',503);
  if(request.method==='GET'){
    try{const sql=getSql();const rows=await sql`SELECT rating,body,display_name,published_at FROM customer_reviews WHERE status='published' ORDER BY published_at DESC LIMIT 20`;
      return ok({reviews:rows.map(r=>({rating:r.rating,text:r.body,name:r.display_name,publishedAt:r.published_at}))});
    }catch{return fail('SERVICE_UNAVAILABLE','Beoordelingen zijn tijdelijk niet beschikbaar.',503);}
  }
  if(request.method!=='POST')return fail('METHOD_NOT_ALLOWED','Methode niet toegestaan.',405);
  const auth=await authenticate(request);if(auth.error)return fail('UNAUTHORIZED','Log in om een beoordeling te schrijven.',401);
  const input=reviewInput(await parseBody(request));if(!input)return fail('VALIDATION_ERROR','Vul een naam, 1–5 sterren en 20–1500 tekens in en geef toestemming voor publicatie.',422);
  try{const sql=getSql();const orders=await sql`SELECT id,paid_at,status FROM purchase_orders WHERE clerk_user_id=${auth.userId} AND paid_at IS NOT NULL AND status IN ('active','paid_awaiting_fulfillment','fulfilled') ORDER BY paid_at DESC LIMIT 1`;
    if(!verifiedReviewEligible(orders))return fail('VERIFIED_PURCHASE_REQUIRED','Een bevestigde aankoop is vereist.',403);
    await sql`INSERT INTO customer_reviews(clerk_user_id,purchase_order_id,rating,body,display_name,publication_consented_at,status) VALUES(${auth.userId},${orders[0].id},${input.rating},${input.text},${input.displayName},NOW(),'pending') ON CONFLICT(clerk_user_id) DO UPDATE SET rating=EXCLUDED.rating,body=EXCLUDED.body,display_name=EXCLUDED.display_name,publication_consented_at=NOW(),status='pending',published_at=NULL,updated_at=NOW()`;
    return ok({status:'pending',message:'Bedankt. Je beoordeling wordt eerst gecontroleerd.'});
  }catch{return fail('SERVICE_UNAVAILABLE','Je beoordeling kon niet worden opgeslagen.',503);}
}};
