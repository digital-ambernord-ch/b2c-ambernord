/* AmberNord exit-intent offer
   ---------------------------------------------------------------------------
   Shows the 2-für-1 promo modal ONCE per visitor when they signal intent to
   leave, on home / shop overview / product pages only.

   Triggers:
     • Desktop — the cursor exits through the TOP edge of the viewport
       (heading for the tab bar / address bar / close button).
     • Mobile  — a single Back-button trap: we push one history entry while the
       user is on a qualifying page; their first Back press pops it and we show
       the modal instead of leaving.

   This file is loaded BEFORE router.js so its `popstate` listener is registered
   first and can stopImmediatePropagation() on the trap pop — keeping the SPA
   router from also handling it. The guard state always carries a valid `path`,
   so if the router ever does handle the pop it merely re-renders the current
   route (never navigate(undefined)).

   "Seen" is persisted in localStorage, so a visitor never sees it twice.
   ========================================================================== */
(function () {
  'use strict';

  var SEEN_KEY  = 'an_exit_offer_seen_v1';
  var MOBILE_MQ = '(max-width: 768px)';
  /* Locale-less canonical paths where the offer is allowed. */
  var QUALIFY = ['/', '/shop/', '/shop/starter/', '/shop/habit/', '/shop/protocol/', '/shop/master-box/'];

  var shown     = false;  // modal already shown this page-load
  var guardLive = false;  // a Back-trap entry is the current top of history
  var ready     = false;  // desktop trigger armed after a short grace delay
  var overlay   = null;

  function seen()     { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (_) { return false; } }
  function markSeen() { try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {} }

  /* Strip a leading /en|/fr|/it prefix and normalise to a trailing slash. */
  function cleanPath() {
    var p = window.location.pathname.replace(/^\/(en|fr|it)(?=\/|$)/, '');
    if (!p) p = '/';
    if (p !== '/' && p.charAt(p.length - 1) !== '/') p += '/';
    return p;
  }
  function qualifies() { return QUALIFY.indexOf(cleanPath()) !== -1; }
  function isMobile()  { return window.matchMedia(MOBILE_MQ).matches; }

  /* The aktion bar (top promo banner) is its own time-boxed offer that shows
     for up to 90s. While it's on screen, this exit-intent promo must stay
     suppressed — two competing offers at once read as spam and collide
     visually. `html.aktion-active` is set synchronously in <head> and removed
     when the bar is dismissed (X / swipe / 90s auto-timeout); aktion-bar.js
     fires `an:aktion-dismissed` at that moment so the mobile back-trap re-arms. */
  function aktionActive() {
    return document.documentElement.classList.contains('aktion-active');
  }

  function lockScroll(on) {
    document.documentElement.classList.toggle('exit-offer-open', on);
    document.body.classList.toggle('exit-offer-open', on);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') closeModal();
  }

  function openModal() {
    if (shown || seen() || !qualifies() || aktionActive()) return;
    overlay = overlay || document.getElementById('exit-offer');
    if (!overlay) return;

    shown = true;
    markSeen();

    overlay.hidden = false;
    void overlay.offsetHeight;            // reflow so the transition runs from hidden → is-open
    overlay.classList.add('is-open');
    lockScroll(true);

    var closeBtn = overlay.querySelector('.exit-offer__close');
    if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (_) { closeBtn.focus(); } }
    document.addEventListener('keydown', onKey);
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    lockScroll(false);
    document.removeEventListener('keydown', onKey);
    var ov = overlay;
    window.setTimeout(function () { ov.hidden = true; }, 320);
  }

  /* ---- Desktop trigger: cursor leaves through the top edge ---------------- */
  function onMouseOut(e) {
    if (!ready || isMobile()) return;
    if (e.relatedTarget) return;          // moved onto another element, still on the page
    if (e.clientY > 0) return;            // left via a side/bottom edge, not the top
    openModal();
  }

  /* ---- Mobile trigger: Back-button trap ---------------------------------- */
  function armBackGuard() {
    if (guardLive || !isMobile() || !qualifies() || aktionActive()) return;
    guardLive = true;
    try {
      history.pushState({ path: cleanPath(), anExitGuard: true }, '', window.location.href);
    } catch (_) {
      guardLive = false;
    }
  }

  /* Runs before router.js's popstate handler (load order). On the trap pop we
     show the modal and stop the router from also navigating. */
  window.addEventListener('popstate', function (e) {
    if (!guardLive || shown || seen()) return;
    guardLive = false;
    e.stopImmediatePropagation();
    openModal();
  });

  function bindControls() {
    overlay = document.getElementById('exit-offer');
    if (!overlay) return;
    overlay.querySelectorAll('[data-exit-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    /* The promo image is a normal data-link → the router navigates to /2-fuer-1/.
       Just hide the overlay so it doesn't linger over the destination page. */
    var link = overlay.querySelector('.exit-offer__link');
    if (link) link.addEventListener('click', closeModal);
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindControls();
    document.addEventListener('mouseout', onMouseOut);
    window.setTimeout(function () { ready = true; }, 1500);
  });

  /* Router fires this after the initial hydrate and every SPA navigation. The
     just-pushed real entry is now the history top, so we re-arm the guard on
     top of the CURRENT page — keeping the trap URL consistent with what's on
     screen. A prior guard for an earlier page becomes harmless buried history. */
  window.addEventListener('an:navigated', function () {
    guardLive = false;
    if (seen() || shown) return;
    armBackGuard();
  });

  /* The aktion bar suppressed us while it was up; once it's gone we re-arm the
     mobile back-trap so the exit offer is available for the rest of the visit.
     (Desktop needs no re-arm — onMouseOut re-checks aktionActive() each move.) */
  window.addEventListener('an:aktion-dismissed', function () {
    if (seen() || shown) return;
    armBackGuard();
  });
})();
