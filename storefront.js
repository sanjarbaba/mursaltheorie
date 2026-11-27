import { catalogue, CAMPAIGN_END } from './storefront-config.js';

const words = {
  nl:{buy:'Koop direct via Stripe',soon:'Binnenkort beschikbaar',once:'Eenmalig · 30 dagen · geen automatische verlenging',
    includes:'150 lessen, verkeersborden, trainingen en 30 oefenexamens.',bilingual:'Nederlandse uitleg met Dari/Farsi ernaast.',
    pending:'De Pashto-inhoud wordt nog inhoudelijk gecontroleerd. Nieuwe aankopen zijn tijdelijk gesloten.',
    end:'Black Friday eindigt op 30 november om 23:59 (Nederlandse tijd).',timer:'Nog',time:'dagen · uur · minuten · seconden',
    ended:'De Black Friday-actie is afgelopen. Hieronder zie je de actuele prijzen.',safe:'Veilig betalen via Stripe. Eén betaling, geen abonnement.'},
  fa:{buy:'خرید مستقیم با Stripe',soon:'به‌زودی',once:'یک‌بار · ۳۰ روز · بدون تمدید خودکار',
    includes:'۱۵۰ درس، علایم ترافیکی، تمرین‌ها و ۳۰ امتحان تمرینی.',bilingual:'توضیح هالندی همراه با دری/فارسی.',
    pending:'محتوای پشتو هنوز از نظر معنایی بررسی می‌شود. خرید جدید موقتاً بسته است.',
    end:'پیشنهاد جمعه سیاه تا ۳۰ نوامبر ساعت ۲۳:۵۹ به وقت هالند است.',timer:'زمان باقی‌مانده',time:'روز · ساعت · دقیقه · ثانیه',
    ended:'پیشنهاد جمعه سیاه پایان یافته است. قیمت‌های فعلی را در زیر ببینید.',safe:'پرداخت امن با Stripe. یک‌بار، بدون اشتراک.'},
  ps:{buy:'مستقیم د Stripe له لارې واخلئ',soon:'ژر به چمتو شي',once:'یو ځل · ۳۰ ورځې · بې اتومات نوي کېدو',
    includes:'۱۵۰ درسونه، ترافیکي نښې، تمرینونه او ۳۰ تمریني ازموینې.',bilingual:'هالنډي تشریح له دري/فارسي سره.',
    pending:'د پښتو منځپانګه لا د معنا له مخې کتل کېږي. نوي پېرودونه موقتي تړلي دي.',
    end:'د تورې جمعې وړاندیز د نومبر پر ۳۰مه د هالنډ په وخت ۲۳:۵۹ پای ته رسېږي.',timer:'پاتې وخت',time:'ورځې · ساعتونه · دقیقې · ثانیې',
    ended:'د تورې جمعې وړاندیز پای ته ورسېد. اوسني نرخونه لاندې وګورئ.',safe:'د Stripe له لارې خوندي تادیه. یو ځل، بې ګډون.'}
};
const money = value => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(value/100);
let timer, refresh, clockOffset=0;
fetch('/api/v1/access?resource=catalog').then(r=>r.ok?r.json():null).then(payload=>{
  const serverTime=payload?.data?.serverTime;
  if(Number.isFinite(serverTime)){clockOffset=serverTime-Date.now();renderOffers();}
}).catch(()=>{});
function renderOffers(){
  const language=['fa','ps'].includes(document.documentElement.lang)?document.documentElement.lang:'nl';
  const w=words[language], i={nl:0,fa:1,ps:2}[language], data=catalogue(Date.now()+clockOffset);
  window.mtOfferCatalogue=data;
  for(const container of document.querySelectorAll('#storefrontPlans,.purchase-plans')){
    const signature=language+data.campaign.active;
    if(container.dataset.offerSignature===signature)continue;
    container.dataset.offerSignature=signature;
    container.innerHTML=data.products.filter(p=>p.kind==='digital').map(p=>`<article class="price box ${p.key==='theory_b_nl_fa_30d'?'featured':''}" dir="${language==='nl'?'ltr':'rtl'}">
      <span class="pill">${p.locales.map(l=>({nl:'NL',fa:'دری/فارسی',ps:'پښتو'}[l])).join(' + ')}</span>
      <h3>${p.name[i]}</h3>${p.available?`<strong class="offer-price" dir="ltr">${money(p.amount)}</strong>`:''}
      <p>${p.available?w.includes:w.pending}</p>${p.locales.includes('fa')?`<p>${w.bilingual}</p>`:''}
      ${p.available?`<small>${w.once}</small><button class="primary" type="button" data-offer-product="${p.key}">${w.buy}</button>`:`<button type="button" class="ghost" disabled>${w.soon}</button>`}</article>`).join('');
  }
  for(const price of document.querySelectorAll('[data-product-amount]')){
    const product=data.products.find(p=>p.key===price.dataset.productAmount);
    if(product&&price.textContent!==money(product.amount))price.textContent=money(product.amount);
  }
  const campaign=document.getElementById('campaignBanner');
  if(campaign){
    const signature=language+data.campaign.active;
    if(campaign.dataset.offerSignature!==signature){
      campaign.dataset.offerSignature=signature;
      campaign.classList.toggle('campaign-ended',!data.campaign.active);
      campaign.innerHTML=data.campaign.active?`<div><span class="campaign-label">BLACK FRIDAY</span><p>${w.end}</p><small>${w.safe}</small></div><div class="campaign-clock"><span>${w.timer}</span><time id="campaignTimer" datetime="${CAMPAIGN_END}" dir="ltr"></time><small>${w.time}</small></div>`:`<p>${w.ended}</p>`;
    }
  }
  const clock=document.getElementById('campaignTimer');
  if(clock){let seconds=Math.max(0,Math.floor((Date.parse(CAMPAIGN_END)-Date.now()-clockOffset)/1000));
    const next=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(' : ');
    if(clock.textContent!==next)clock.textContent=next;}
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-offer-product]');if(!button)return;
  const key=button.dataset.offerProduct;
  if(typeof window.beginPurchase==='function')window.beginPurchase(key);
  else if(typeof window.startCheckout==='function')window.startCheckout(key);
});
const observer=new MutationObserver(()=>{clearTimeout(refresh);refresh=setTimeout(renderOffers,40)});
observer.observe(document.body,{childList:true,subtree:true});
new MutationObserver(renderOffers).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
renderOffers();timer=setInterval(renderOffers,1000);
window.addEventListener('pagehide',()=>{clearInterval(timer);observer.disconnect()},{once:true});
