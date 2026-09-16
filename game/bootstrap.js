// Paid content is returned only after server-side Clerk and entitlement validation.
const host=document.querySelector('#app');
let loaded=false,account=null,busy=false,expiry=0;
function gate(message='Log in met je Mursaltheorie-account om je avontuur te starten.') {
  host.innerHTML=`<main id="main" class="access-gate"><a class="brand" href="/"><img src="./assets/icon.svg" alt=""><div><strong>MURSAL</strong><small>THEORY HERO</small></div></a><section class="hero"><div class="hero-copy"><span class="eyebrow">INBEGREPEN BIJ ELK DIGITAAL ABONNEMENT</span><h1>Jouw kennis.<br>Jouw superkracht.</h1><p>20 levels verkeersborden, uitdagende eindbazen en Mursal aan je zijde. Bij ieder digitaal pakket krijg je 30 dagen toegang tot de game.</p><p id="access-message" role="status"></p><div class="hero-actions"><button class="primary" id="game-login">Inloggen om te spelen →</button><a class="secondary" href="/learn5">Bekijk abonnementen</a><button class="text-button" id="game-retry">Toegang opnieuw controleren</button></div><p><small>Je bestaande abonnement telt mee. Geen losse gamebetaling.</small></p></div><div class="hero-art"><img src="./assets/mursal.jpg" alt="Mursal, jouw heldin"><div class="character-label">JOUW HELDIN<strong>MURSAL</strong></div></div></section><p class="muted">Internet is nodig om je abonnement te controleren. Je spelvoortgang blijft op dit apparaat bewaard.</p><a href="/">← Terug naar Mursaltheorie</a></main>`;
  document.querySelector('#access-message').textContent=message;
  document.querySelector('#game-login').onclick=async()=>{try{await window.mtClerkReady;await window.mtOpenAuth('signIn');}catch{gate('Inloggen laden lukt niet. Controleer je verbinding en probeer opnieuw.');}};
  document.querySelector('#game-retry').onclick=()=>verify();
}
function stop(message){if(loaded){sessionStorage.setItem('mursal-gate-message',message);location.reload();}else gate(message);}
async function verify(){
 if(busy)return;busy=true;
 try{
  await window.mtClerkReady;
  const session=window.Clerk?.session;
  if(!session){if(loaded)stop('Log opnieuw in om verder te spelen.');return;}
  const token=await session.getToken();
  const response=await fetch('/api/v1/game'+(loaded?'?check=1':''),{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
  if(!response.ok){stop(response.status===403?'Je hebt een actief digitaal abonnement nodig. Kies een pakket voor 30 dagen toegang.':'Je toegang kon niet worden gecontroleerd. Probeer opnieuw.');return;}
  const {data}=await response.json();
  if(loaded&&data.userId!==account){location.reload();return;}
  expiry=Date.parse(data.validUntil);
  if(!Number.isFinite(expiry)||expiry<=Date.now())throw Error('expired');
  if(!loaded){account=data.userId;globalThis.MURSAL_ACCOUNT=account;globalThis.MURSAL_CONTENT=data.content;await import('./app.js');loaded=true;}
 }catch{stop('Verbind met internet om je abonnement te controleren en verder te spelen.');}
 finally{busy=false;}
}
gate(sessionStorage.getItem('mursal-gate-message')||undefined);sessionStorage.removeItem('mursal-gate-message');
const script=document.createElement('script');script.src='/clerk-auth-v6.js';script.onload=()=>verify();script.onerror=()=>gate('Inloggen laden lukt niet. Controleer je verbinding en vernieuw de pagina.');document.head.append(script);
window.addEventListener('mt-clerk-change',()=>verify());
window.addEventListener('online',()=>verify());
window.addEventListener('offline',()=>{if(loaded)stop('Verbind met internet om je abonnement te controleren.');});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verify();});
setInterval(()=>{if(loaded&&expiry<=Date.now())stop('Je toegang is afgelopen. Kies een nieuw pakket om verder te spelen.');else if(!document.hidden)verify();},30000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
