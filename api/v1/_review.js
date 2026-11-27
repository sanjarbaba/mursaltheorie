export function reviewInput(body) {
  const rating=Number(body?.rating);
  const text=typeof body?.text==='string'?body.text.trim():'';
  const displayName=typeof body?.displayName==='string'?body.displayName.trim():'';
  if(!Number.isInteger(rating)||rating<1||rating>5||text.length<20||text.length>1500||displayName.length<2||displayName.length>60||body?.publicationConsent!==true)return null;
  return {rating,text,displayName};
}
export function verifiedReviewEligible(orders) {
  return Array.isArray(orders)&&orders.some(order=>order.paid_at&&['active','paid_awaiting_fulfillment','fulfilled'].includes(order.status));
}
