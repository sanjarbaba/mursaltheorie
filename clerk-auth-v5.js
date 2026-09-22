(function () {
  'use strict';
  const publishableKey = 'pk_live_Y2xlcmsubXVyc2FsdGhlb3JpZS5ubCQ';
  const frontendApi = 'https://clerk.mursaltheorie.nl';
  function loadScript(src, attributes) { return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') return resolve(); existing.remove(); }
    const script = document.createElement('script'); script.src = src; script.async = true;
    Object.entries(attributes || {}).forEach(([key, value]) => script.setAttribute(key, value));
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); }, { once: true });
    script.addEventListener('error', reject, { once: true }); document.head.appendChild(script);
  }); }
  function userDetails(user) { if (!user) return null; const email = user.primaryEmailAddress?.emailAddress || ''; return { id:user.id, name:user.fullName || user.firstName || email.split('@')[0] || 'Gebruiker', email, publicMetadata:user.publicMetadata || {} }; }
  function announceAuthState(snapshot) {
    const activeSession = snapshot?.session || window.Clerk?.session || null;
    const activeUser = snapshot?.user || activeSession?.user || window.Clerk?.user || null;
    const signedIn = Boolean(activeSession || window.Clerk?.isSignedIn);
    window.dispatchEvent(new CustomEvent('mt-clerk-change', { detail:{ signedIn, user:signedIn ? userDetails(activeUser) : null } }));
    // Re-check after Clerk finishes session hydration to clear stale user-only snapshots.
    if (!snapshot) setTimeout(() => announceAuthState({ session: window.Clerk?.session || null, user: window.Clerk?.user || null }), 500);
  }
  window.mtClerkReady = (async () => {
    await loadScript(`${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, {'data-clerk-publishable-key':publishableKey});
    await window.Clerk.load({ui:{ClerkUI:window.__internal_ClerkUICtor}}); window.Clerk.addListener(announceAuthState); announceAuthState(); return window.Clerk;
  })().catch(error => { console.error('Clerk kon niet worden geladen.', error); throw error; });
  window.mtOpenAuth = async function(mode) { try { const clerk=await window.mtClerkReady; if (clerk.session) return clerk.openUserProfile(); const result=mode==='register'?await clerk.openSignUp():await clerk.openSignIn(); announceAuthState(); return result; } catch(error) { alert('Inloggen kon niet worden geladen. Vernieuw de pagina en probeer het opnieuw.'); } };

  const activitySessionKey = 'mt-activity-session';
  function activitySessionId() {
    try {
      let value = localStorage.getItem(activitySessionKey);
      if (!value) { value = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()); localStorage.setItem(activitySessionKey, value); }
      return value;
    } catch { return Math.random().toString(36).slice(2) + Date.now(); }
  }
  window.mtTrackActivity = async function(eventType, details) {
    if (location.pathname === '/admin') return;
    try {
      const clerk = await window.mtClerkReady;
      if (!clerk || !clerk.session) return;
      const token = await clerk.session.getToken();
      await fetch('/api/v1/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          eventType,
          sessionId: activitySessionId(),
          path: location.pathname,
          language: document.documentElement.lang || 'nl',
          viewName: details && details.viewName ? details.viewName : (localStorage.getItem('mt-view') || '')
        })
      });
    } catch { /* Activiteit mag de leeromgeving nooit onderbreken. */ }
  };
  window.addEventListener('mt-clerk-change', event => {
    if (!event.detail || !event.detail.signedIn) return;
    window.mtTrackActivity('page_view');
    if (!window.__mtActivityTimer) window.__mtActivityTimer = setInterval(() => window.mtTrackActivity('heartbeat'), 300000);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') window.mtTrackActivity('heartbeat');
  });

  window.mtSignOut = async function() { try { const clerk=await window.mtClerkReady; await clerk.signOut(); announceAuthState(); } catch(error) { alert('Uitloggen is niet gelukt. Probeer het opnieuw.'); } };  async function checkoutRequest(path, body, authenticated) {
    const headers = { 'Content-Type': 'application/json' };
    if (authenticated) {
      const clerk = await window.mtClerkReady;
      if (!clerk?.session) throw new Error('AUTH_REQUIRED');
      headers.Authorization = `Bearer ${await clerk.session.getToken()}`;
    }
    const response = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || payload.error || 'De betaalpagina kon niet worden geopend.');
    return payload.data ?? payload;
  }
  window.mtCheckout = async function(productKey, immediateAccessConsent) {
    const result = await checkoutRequest('/api/v1/access?resource=checkout', { productKey, immediateAccessConsent }, true);
    if (!result.checkoutUrl) throw new Error('CHECKOUT_URL_MISSING');
    window.location.assign(result.checkoutUrl);
  };
  window.mtGuestCheckout = async function(email, productKey, immediateAccessConsent) {
    const result = await checkoutRequest('/api/v1/access?resource=guest-checkout', { email, productKey, immediateAccessConsent }, false);
    if (!result.checkoutUrl) throw new Error('CHECKOUT_URL_MISSING');
    window.location.assign(result.checkoutUrl);
  };

}());

