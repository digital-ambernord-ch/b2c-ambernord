/* AmberNord cookie consent — GDPR/ePrivacy compliant.

   Contract:
   - Cookie name:   cookie_consent
   - Cookie value:  URI-encoded JSON {v, necessary, analytics, marketing, ts}
   - Lifetime:      365 days
   - Attributes:    SameSite=Lax; Secure (HTTPS only); path=/

   Bump CONSENT_VERSION when the cookie policy changes (new vendor, new purpose,
   removed vendor, etc.). All previously stored consent will be invalidated and
   the banner will re-prompt. */

(function () {
  'use strict';

  const CONSENT_VERSION = '2025-q1';
  const COOKIE_NAME     = 'cookie_consent';
  const LIFETIME_MS     = 365 * 24 * 60 * 60 * 1000;
  const SECURE_FLAG     = (typeof location !== 'undefined' && location.protocol === 'https:') ? '; Secure' : '';

  /* Documented cookies that this site or its vendors set, by category.
     This list MUST mirror the disclosure shown in the modal. When you add a
     new vendor, register its cookies here AND in common.json's
     cookie.categories.<cat>.list translations. Otherwise, withdrawal will
     leak vendor cookies and the disclosure will be incomplete. */
  const VENDOR_COOKIES = {
    necessary: [
      'cookie_consent'
    ],
    analytics: [
      '_ga',
      '_ga_VRDSSTW4HR',
      '_gid',
      '_gat',
      '_gat_gtag_G_VRDSSTW4HR'
    ],
    marketing: [
      '_ttp',
      '_tt_enable_cookie',
      '_ttp_id',
      'tt_appInfo',
      'tt_pixel_session_index',
      'tt_sessionId'
    ]
  };

  const listeners = [];
  let returnFocusTo = null;

  /* ------------------------------------------------------------------------
     Cookie I/O
     ------------------------------------------------------------------------ */

  function readRaw() {
    const m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function writeRaw(value) {
    const expires = new Date(Date.now() + LIFETIME_MS).toUTCString();
    document.cookie =
      COOKIE_NAME + '=' + encodeURIComponent(value) +
      '; expires=' + expires +
      '; path=/; SameSite=Lax' + SECURE_FLAG;
  }

  function deleteCookie(name) {
    /* Clear across path=/, bare hostname, and dot-prefixed domain — vendor
       cookies are inconsistent about which scope they used originally. */
    const variants = [
      'path=/',
      'path=/; domain=' + location.hostname,
      'path=/; domain=.' + location.hostname,
      'path=/; domain=' + parentDomain(),
      'path=/; domain=.' + parentDomain()
    ];
    variants.forEach(function (scope) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ' + scope;
    });
  }

  function parentDomain() {
    /* Best-effort eTLD+1 — good enough for most setups. For multi-suffix
       domains (.co.uk, .com.au) the registrable domain library is needed. */
    const parts = location.hostname.split('.');
    if (parts.length <= 2) return location.hostname;
    return parts.slice(-2).join('.');
  }

  /* ------------------------------------------------------------------------
     State
     ------------------------------------------------------------------------ */

  function getState() {
    const raw = readRaw();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.v !== CONSENT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function persist(state) {
    writeRaw(JSON.stringify(state));
  }

  function setState(partial) {
    const current = getState() || { necessary: true, analytics: false, marketing: false };
    const next = Object.assign({}, current, partial, {
      necessary: true,
      v: CONSENT_VERSION,
      ts: Date.now()
    });

    persist(next);
    activateGatedScripts(next);
    tearDownDenied(current, next);
    notifyListeners(next);
    hideBanner();
    closeModal();

    return next;
  }

  function acceptAll() {
    return setState({ analytics: true, marketing: true });
  }

  function rejectAll() {
    return setState({ analytics: false, marketing: false });
  }

  function withdraw() {
    /* Same effect as rejectAll, but exposed as a separate semantic verb. */
    return rejectAll();
  }

  function notifyListeners(state) {
    listeners.slice().forEach(function (fn) {
      try { fn(state); } catch (e) { console.error('[cookie-consent] listener threw', e); }
    });
  }

  /* ------------------------------------------------------------------------
     Script gating (Pattern A)

     Find <script type="text/plain" data-cookie-category="…"> placeholders and,
     if their category is now allowed, clone with type="text/javascript" so the
     browser will execute them. We only activate each placeholder once. */

  function activateGatedScripts(state) {
    const placeholders = document.querySelectorAll(
      'script[type="text/plain"][data-cookie-category]:not([data-cookie-activated])'
    );
    placeholders.forEach(function (placeholder) {
      const category = placeholder.getAttribute('data-cookie-category');
      if (!state[category]) return;

      const live = document.createElement('script');
      Array.prototype.forEach.call(placeholder.attributes, function (attr) {
        if (attr.name === 'type' || attr.name === 'data-cookie-activated') return;
        live.setAttribute(attr.name, attr.value);
      });
      live.type = 'text/javascript';
      if (placeholder.textContent && placeholder.textContent.trim()) {
        live.textContent = placeholder.textContent;
      }

      placeholder.setAttribute('data-cookie-activated', '1');
      placeholder.parentNode.insertBefore(live, placeholder);
      placeholder.parentNode.removeChild(placeholder);
    });
  }

  /* ------------------------------------------------------------------------
     Withdrawal teardown — clear vendor cookies whose category turned off. */

  function tearDownDenied(prevState, nextState) {
    Object.keys(VENDOR_COOKIES).forEach(function (category) {
      if (category === 'necessary') return;
      const wasGranted = prevState && prevState[category];
      const nowDenied  = !nextState[category];
      if (wasGranted && nowDenied) {
        VENDOR_COOKIES[category].forEach(deleteCookie);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Banner / modal visibility
     ------------------------------------------------------------------------ */

  function showBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.removeAttribute('hidden');
  }

  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.setAttribute('hidden', '');
  }

  function openModal() {
    const modal = document.getElementById('cookie-modal');
    if (!modal) return;

    /* Sync toggles with current state. */
    const state = getState() || { analytics: false, marketing: false };
    const aTog = document.getElementById('cookie-cat-analytics');
    const mTog = document.getElementById('cookie-cat-marketing');
    if (aTog) aTog.checked = !!state.analytics;
    if (mTog) mTog.checked = !!state.marketing;

    returnFocusTo = document.activeElement;
    modal.removeAttribute('hidden');
    document.body.classList.add('cookie-modal-open');

    requestAnimationFrame(function () {
      const focusable = focusableInside(modal);
      if (focusable.length) focusable[0].focus();
    });

    bindFocusTrap(modal);
  }

  function closeModal() {
    const modal = document.getElementById('cookie-modal');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.classList.remove('cookie-modal-open');
    if (returnFocusTo instanceof HTMLElement) {
      try { returnFocusTo.focus(); } catch {}
    }
    returnFocusTo = null;
  }

  function saveSelection() {
    const aTog = document.getElementById('cookie-cat-analytics');
    const mTog = document.getElementById('cookie-cat-marketing');
    setState({
      analytics: !!(aTog && aTog.checked),
      marketing: !!(mTog && mTog.checked)
    });
  }

  /* ------------------------------------------------------------------------
     Keyboard accessibility — Esc closes, Tab cycles within modal. */

  function focusableInside(el) {
    return Array.prototype.slice.call(
      el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }

  function bindFocusTrap(modal) {
    if (modal._cookieTrap) return;
    modal._cookieTrap = function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = focusableInside(modal);
      if (!f.length) return;
      const first = f[0];
      const last  = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    modal.addEventListener('keydown', modal._cookieTrap);
  }

  /* ------------------------------------------------------------------------
     Delegated click handler — single source for [data-cookie-action]. */

  document.addEventListener('click', function (e) {
    const target = e.target.closest && e.target.closest('[data-cookie-action]');
    if (!target) return;

    const action = target.getAttribute('data-cookie-action');
    switch (action) {
      case 'accept-all':     e.preventDefault(); acceptAll();      break;
      case 'reject-all':     e.preventDefault(); rejectAll();      break;
      case 'open-settings':  e.preventDefault(); hideBanner(); openModal(); break;
      case 'close-settings': e.preventDefault(); closeModal();     break;
      case 'save-selection': e.preventDefault(); saveSelection();  break;
    }
  });

  /* ------------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------------ */

  window.cookieConsent = {
    get: getState,
    set: setState,
    acceptAll: acceptAll,
    rejectAll: rejectAll,
    withdraw: withdraw,
    openSettings: function () {
      hideBanner();
      openModal();
    },
    onChange: function (fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.push(fn);
      return function () {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    version: CONSENT_VERSION
  };

  /* ------------------------------------------------------------------------
     Initial check on page load.
     - If no valid consent: show banner.
     - If valid consent: activate gated scripts for granted categories. */

  document.addEventListener('DOMContentLoaded', async function () {
    /* Wait for common i18n so banner/modal text is in the right language. */
    if (typeof window.loadCommonI18n === 'function') {
      try { await window.loadCommonI18n(); } catch {}
    }

    const state = getState();
    if (!state) {
      showBanner();
    } else {
      activateGatedScripts(state);
    }
  });
})();
