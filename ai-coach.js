(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('coach-test') !== '1') return;

  const text = {
    nl: { button: 'Vraag Mursal AI', title: 'Mursal AI · test', badge: 'ALLEEN BEHEERDER · PROEFVERSIE', placeholder: 'Stel een vraag over deze les…', send: 'Verstuur', close: 'Sluiten', welcome: 'Salaam! Ik ben Mursal, je theoriecoach. Stel een vraag over de les die je open hebt.', loading: 'Mursal denkt na…', denied: 'Log in met het beheerdersaccount om deze privéproef te openen.', failed: 'Dat lukte niet. Probeer het opnieuw.', demo: 'Proefmodus · AI-model nog niet aangesloten', ai: 'AI-test actief · controleer antwoorden altijd met de lesstof.', lesson: 'Huidige les', progress: 'Testvoortgang wordt alleen op dit apparaat bewaard.' },
    fa: { button: 'از Mursal AI بپرسید', title: 'Mursal AI · آزمایشی', badge: 'فقط مدیر · نسخهٔ آزمایشی', placeholder: 'دربارهٔ این درس پرسش کنید…', send: 'ارسال', close: 'بستن', welcome: 'سلام! من مرسل، مربی تیوری شما هستم. دربارهٔ درس بازشده پرسش کنید.', loading: 'مرسل در حال فکر کردن است…', denied: 'برای دیدن این نسخهٔ خصوصی با حساب مدیر وارد شوید.', failed: 'انجام نشد. دوباره تلاش کنید.', demo: 'نسخهٔ آزمایشی · مدل هوش مصنوعی وصل نشده', ai: 'آزمایش هوش مصنوعی فعال است · پاسخ‌ها را با درس بررسی کنید.', lesson: 'درس فعلی', progress: 'پیشرفت آزمایشی فقط در همین دستگاه ذخیره می‌شود.' },
    ps: { button: 'له Mursal AI وپوښتئ', title: 'Mursal AI · ازموینه', badge: 'یوازې مدیر · ازمایښتي بڼه', placeholder: 'د دې درس په اړه پوښتنه وکړئ…', send: 'ولېږئ', close: 'وتړئ', welcome: 'سلام! زه مرسل، ستاسو د تیورۍ ښوونکی یم. د پرانیستي درس په اړه پوښتنه وکړئ.', loading: 'مرسل فکر کوي…', denied: 'دې خصوصي ازموینې ته د ننوتلو لپاره د مدیر حساب وکاروئ.', failed: 'دا کار ونه شو. بیا هڅه وکړئ.', demo: 'ازمایښتي بڼه · د AI ماډل لا نه دی نښلول شوی', ai: 'د AI ازموینه فعاله ده · ځوابونه له درس سره پرتله کړئ.', lesson: 'اوسنی درس', progress: 'ازمایښتي پرمختګ یوازې په همدې وسیله ساتل کېږي.' }
  };
  let language = ['nl', 'fa', 'ps'].includes(document.documentElement.lang) ? document.documentElement.lang : 'nl';
  let mode = 'demo';
  let authorized = false;
  let busy = false;
  const history = [];
  const progressKey = 'mt-ai-coach-progress-v1';
  const copy = () => text[language] || text.nl;
  const safeText = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  const style = document.createElement('style');
  style.textContent = `.mt-ai-launch{position:fixed;right:18px;bottom:92px;z-index:90;border:0;border-radius:999px;padding:13px 18px;background:linear-gradient(135deg,#6537d1,#287a9b);color:#fff;font:800 14px system-ui;box-shadow:0 12px 34px #190d3855;cursor:pointer}.mt-ai-panel{position:fixed;right:18px;bottom:150px;z-index:91;width:min(390px,calc(100vw - 24px));height:min(570px,calc(100dvh - 190px));display:none;grid-template-rows:auto auto 1fr auto auto;overflow:hidden;border:1px solid #7560a8;border-radius:22px;background:#111c43;color:#f8f7ff;box-shadow:0 24px 80px #050819bb;font:14px/1.5 system-ui}.mt-ai-panel.open{display:grid}.mt-ai-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#0b1535;border-bottom:1px solid #43558b}.mt-ai-head strong{font-size:16px}.mt-ai-close{margin-left:auto;border:1px solid #6074a8;border-radius:10px;padding:6px 10px;background:#182954;color:white;cursor:pointer}.mt-ai-badge,.mt-ai-context{padding:8px 14px;font-size:11px;font-weight:800;letter-spacing:.03em;color:#ffda7d;background:#182751}.mt-ai-context{color:#c6e9ff;background:#14224a;letter-spacing:0}.mt-ai-messages{overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.mt-ai-msg{max-width:92%;padding:10px 12px;border-radius:14px;background:#1b2c5a;white-space:pre-wrap;overflow-wrap:anywhere}.mt-ai-msg.user{align-self:flex-end;background:#5234a6}.mt-ai-form{display:flex;gap:8px;padding:12px;border-top:1px solid #43558b}.mt-ai-input{min-width:0;flex:1;border:1px solid #6074a8;border-radius:12px;padding:11px;background:#09132f;color:white;font:inherit}.mt-ai-send{border:0;border-radius:12px;padding:0 13px;background:#db3854;color:white;font-weight:850;cursor:pointer}.mt-ai-note{margin:0;padding:0 14px 10px;color:#becbe6;font-size:11px}.mt-ai-error{padding:14px;color:#ffd7d7}.mt-ai-panel[dir=rtl]{font-family:Tahoma,Arial,sans-serif}.mt-ai-panel[dir=rtl] .mt-ai-close{margin-left:0;margin-right:auto}.mt-ai-panel[dir=rtl] .mt-ai-msg.user{align-self:flex-start}.mt-ai-panel[dir=rtl] .mt-ai-msg:not(.user){align-self:flex-end}@media(max-width:560px){.mt-ai-launch{right:12px;bottom:84px;padding:12px 14px}.mt-ai-panel{right:8px;bottom:136px;width:calc(100vw - 16px);height:min(68dvh,570px)}}`;
  document.head.append(style);

  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'mt-ai-launch'; launch.hidden = true;
  const panel = document.createElement('section');
  panel.className = 'mt-ai-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-label', 'Mursal AI testcoach');
  document.body.append(launch, panel);

  function readProgress() {
    try { const value = JSON.parse(localStorage.getItem(progressKey) || '{}'); return { questions: Number(value.questions) || 0, sessions: Number(value.sessions) || 0, lastLesson: String(value.lastLesson || '') }; }
    catch { return { questions: 0, sessions: 0, lastLesson: '' }; }
  }
  function saveProgress(lesson, newSession) {
    const progress = readProgress();
    progress.questions += 1;
    if (newSession) progress.sessions += 1;
    progress.lastLesson = lesson?.title || '';
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }
  function appendMessage(content, role = 'assistant') {
    const messages = panel.querySelector('.mt-ai-messages');
    if (!messages) return;
    const item = document.createElement('div');
    item.className = `mt-ai-msg ${role}`;
    item.textContent = content;
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
  }
  function renderPanel() {
    const c = copy();
    const lesson = window.mtAiLessonContext?.();
    panel.lang = language;
    panel.dir = language === 'nl' ? 'ltr' : 'rtl';
    panel.innerHTML = `<div class="mt-ai-head"><strong>${safeText(c.title)}</strong><button class="mt-ai-close" type="button">${safeText(c.close)}</button></div><div class="mt-ai-badge">${safeText(c.badge)} · ${safeText(mode === 'ai' ? c.ai : c.demo)}</div><div class="mt-ai-context">${safeText(c.lesson)}: ${safeText(lesson?.title || '—')}</div><div class="mt-ai-messages" aria-live="polite"></div><form class="mt-ai-form"><input class="mt-ai-input" maxlength="1000" autocomplete="off" placeholder="${safeText(c.placeholder)}" aria-label="${safeText(c.placeholder)}"><button class="mt-ai-send" type="submit">${safeText(c.send)}</button></form><p class="mt-ai-note">${safeText(c.progress)}</p>`;
    panel.querySelector('.mt-ai-close').addEventListener('click', closePanel);
    panel.querySelector('.mt-ai-form').addEventListener('submit', sendMessage);
    if (!history.length) appendMessage(c.welcome);
    else history.forEach((turn) => appendMessage(turn.content, turn.role));
  }
  function openPanel() { renderPanel(); panel.classList.add('open'); panel.querySelector('.mt-ai-input')?.focus(); }
  function closePanel() { panel.classList.remove('open'); launch.focus(); }
  launch.addEventListener('click', () => panel.classList.contains('open') ? closePanel() : openPanel());
  window.addEventListener('mt-clerk-change', () => { if (!params.has('coach-test')) return; checkAccess(); });
  window.addEventListener('mt-ai-coach-language', (event) => { language = ['nl', 'fa', 'ps'].includes(event.detail?.language) ? event.detail.language : language; if (panel.classList.contains('open')) renderPanel(); });
  new MutationObserver(() => {
    const nextLanguage = ['nl', 'fa', 'ps'].includes(document.documentElement.lang) ? document.documentElement.lang : language;
    if (nextLanguage !== language) { language = nextLanguage; launch.textContent = copy().button; if (panel.classList.contains('open')) renderPanel(); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  async function requestApi(method, body) {
    const clerk = await window.mtClerkReady;
    const token = await clerk.session?.getToken();
    if (!token) throw new Error('UNAUTHORIZED');
    const response = await fetch('/api/v1/ai-coach', { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.code || 'REQUEST_FAILED');
    return payload.data;
  }
  async function checkAccess() {
    launch.hidden = true; authorized = false;
    try { const data = await requestApi('GET'); authorized = Boolean(data.enabled); mode = data.mode === 'ai' ? 'ai' : 'demo'; launch.textContent = copy().button; launch.hidden = !authorized; }
    catch (error) { if (panel.classList.contains('open')) { panel.classList.add('open'); panel.innerHTML = `<p class="mt-ai-error">${safeText(error.message === 'FORBIDDEN' ? copy().denied : copy().denied)}</p>`; } }
  }
  async function sendMessage(event) {
    event.preventDefault();
    if (!authorized || busy) return;
    const input = panel.querySelector('.mt-ai-input');
    const message = input?.value.trim();
    if (!message) return;
    const lesson = window.mtAiLessonContext?.() || null;
    busy = true;
    appendMessage(message, 'user');
    history.push({ role: 'user', content: message });
    saveProgress(lesson, history.length === 1);
    input.value = '';
    const send = panel.querySelector('.mt-ai-send');
    if (send) send.disabled = true;
    const pending = document.createElement('div'); pending.className = 'mt-ai-msg'; pending.textContent = copy().loading; panel.querySelector('.mt-ai-messages')?.append(pending);
    try {
      const data = await requestApi('POST', { message, language, lesson, history: history.slice(0, -1).slice(-8) });
      pending.remove();
      appendMessage(data.reply || copy().failed);
      history.push({ role: 'assistant', content: data.reply || copy().failed });
      mode = data.mode === 'ai' ? 'ai' : 'demo';
      const badge = panel.querySelector('.mt-ai-badge'); if (badge) badge.textContent = `${copy().badge} · ${copy()[mode === 'ai' ? 'ai' : 'demo']}`;
    } catch {
      pending.remove(); appendMessage(copy().failed);
      history.pop();
    } finally { busy = false; if (send) send.disabled = false; input?.focus(); }
  }
  if (window.mtClerkReady) window.mtClerkReady.then(checkAccess).catch(() => {});
})();

