(function () {
  'use strict';

  if (window.__mtPaywallGateInstalled) return;
  window.__mtPaywallGateInstalled = true;

  const originalRender = render;
  const originalGo = go;
  const originalOpenLesson = openLesson;
  const originalStartExam = startExam;

  function hasPaidAccess() {
    return Boolean(S.access && S.access.hasAccess);
  }

  function paywallView() {
    if (S.user && !S.access) {
      return `<main class="wrap"><section class="card pad" style="max-width:760px;margin:48px auto;text-align:center"><span class=pill>EVEN GEDULD</span><h1>Je account wordt gecontroleerd</h1><p class=mut>We controleren je toegang. Dit duurt meestal maar een paar seconden.</p></section></main>`;
    }

    const accountAction = S.user
      ? `<button class=primary onclick="openAuth()">Bekijk pakketten</button>`
      : `<button class=primary onclick="openAuth('register')">Maak een account</button><button class=ghost onclick="openAuth('login')">Inloggen</button>`;

    const packages = S.user && S.access && !S.access.hasAccess ? purchaseOptions() : '';

    return `<main class="wrap"><section class="card pad" style="max-width:860px;margin:32px auto">
      <span class=pill>30 DAGEN TOEGANG</span>
      <h1>Ontgrendel de volledige Mursaltheorie</h1>
      <p class=mut>Alle 150 lessen, verkeersborden, woorden, trainingen en 30 oefenexamens zijn beschikbaar met betaalde toegang. Alleen het gratis proefexamen met 10 vragen op de homepage is zonder betaling te gebruiken.</p>
      <div class=boxes>
        <div class=box><b>Nederlands</b><h2>€29,99</h2><p class=mut>Eenmalig · 30 dagen</p></div>
        <div class=box><b>Nederlands + Dari/Farsi</b><h2>€49,99</h2><p class=mut>Introductieprijs gedurende de eerste 3 maanden; daarna €64,99 · eenmalig 30 dagen</p></div>
      </div>
      <div class=acts>${accountAction}<a class=ghost href="/#gratis-proefexamen">Probeer 10 vragen gratis</a></div>
      ${packages}
    </section></main>`;
  }

  go = function (view) {
    if (!hasPaidAccess()) {
      S.auth = Boolean(S.user);
      render();
      if (!S.user) openAuth('login');
      scrollTo(0, 0);
      return;
    }
    return originalGo(view);
  };

  openLesson = function (id) {
    if (!hasPaidAccess()) {
      S.auth = Boolean(S.user);
      render();
      if (!S.user) openAuth('login');
      return;
    }
    return originalOpenLesson(id);
  };

  startExam = async function (number) {
    if (!hasPaidAccess()) {
      S.auth = Boolean(S.user);
      render();
      if (!S.user) openAuth('login');
      return;
    }
    return originalStartExam(number);
  };

  render = function () {
    if (hasPaidAccess()) return originalRender();
    document.documentElement.lang = S.lang;
    document.documentElement.dir = isRtl() ? 'rtl' : 'ltr';
    document.documentElement.dataset.textSize = localStorage.getItem('mt-text-size') || 'normal';
    root.innerHTML = nav() + psNotice() + paywallView() + legal() + accessibilityTools() + authView();
  };

  Object.assign(window, { go, openLesson, startExam, render });
  render();
}());
