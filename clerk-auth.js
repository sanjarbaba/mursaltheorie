(function () {
  'use strict';

  const publishableKey = 'pk_live_Y2xlcmsubXVyc2FsdGhlb3JpZS5ubCQ';
  const frontendApi = 'https://clerk.mursaltheorie.nl';

  function loadScript(src, attributes) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') resolve();
        else {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      Object.entries(attributes || {}).forEach(([key, value]) => script.setAttribute(key, value));
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  function userDetails(user) {
    if (!user) return null;
    const email = user.primaryEmailAddress?.emailAddress || '';
    return {
      id: user.id,
      name: user.fullName || user.firstName || email.split('@')[0] || 'Gebruiker',
      email
    };
  }

  function announceAuthState(snapshot) {
    const activeSession = snapshot?.session || window.Clerk?.session || null;
    const activeUser = snapshot?.user || activeSession?.user || window.Clerk?.user || null;
    const signedIn = Boolean(activeUser || activeSession || window.Clerk?.isSignedIn);
    window.dispatchEvent(new CustomEvent('mt-clerk-change', {
      detail: {
        signedIn,
        user: userDetails(activeUser)
      }
    }));
  }

  window.mtClerkReady = (async () => {
    await loadScript(`${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`${frontendApi}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, {
      'data-clerk-publishable-key': publishableKey
    });
    await window.Clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor }
    });
    window.Clerk.addListener((snapshot) => announceAuthState(snapshot));
    announceAuthState();
    return window.Clerk;
  })().catch((error) => {
    console.error('Clerk kon niet worden geladen.', error);
    throw error;
  });

  window.mtOpenAuth = async function (mode) {
    try {
      const clerk = await window.mtClerkReady;
      if (clerk.isSignedIn) {
        return clerk.openUserProfile();
      }
      const result = mode === 'register' ? await clerk.openSignUp() : await clerk.openSignIn();
      announceAuthState();
      return result;
    } catch (error) {
      alert('Inloggen kon niet worden geladen. Vernieuw de pagina en probeer het opnieuw.');
    }
  };

  window.mtSignOut = async function () {
    try {
      const clerk = await window.mtClerkReady;
      await clerk.signOut();
      announceAuthState();
    } catch (error) {
      alert('Uitloggen is niet gelukt. Probeer het opnieuw.');
    }
  };
}());
