/* =========================================================================
   AMBERNORD — PREMIUM FX (JS)
   js/premium-fx.js
   Count-up for the active-ingredient stats. Site-wide, route-agnostic.

   Any element marked  data-countup="190" data-countup-suffix="+"  ticks its
   number up from zero the first time it scrolls into view. The markup keeps
   the FINAL value as its text (so it is correct with JS disabled, for crawlers
   and under reduced motion); JS only takes over once the element is genuinely
   on screen, then animates 0 → target once and never again.

   SPA-safe: a MutationObserver on #app re-scans after every route swap, so
   the home stats re-arm when the user navigates back to the landing page.
   ========================================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* easeOutCubic — fast start, gentle settle: reads as a confident "tally". */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCount(el, target, suffix, prefix) {
    var duration = 1400;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / duration);
      var val = Math.round(easeOutCubic(p) * target);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target + suffix;   /* exact final value */
    }
    requestAnimationFrame(frame);
  }

  /* One shared observer for the whole document — elements register into it as
     they are discovered. threshold 0.6 so the count only starts once the stat
     is clearly in view (not while it is a sliver at the fold edge). */
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);
          if (el._cuRun) return;
          el._cuRun = true;
          var target = parseInt(el.getAttribute('data-countup'), 10);
          if (isNaN(target)) return;
          var suffix = el.getAttribute('data-countup-suffix') || '';
          var prefix = el.getAttribute('data-countup-prefix') || '';
          animateCount(el, target, suffix, prefix);
        });
      }, { threshold: 0.6 })
    : null;

  function scan(root) {
    var els = (root || document).querySelectorAll('[data-countup]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el._cuSeen) continue;
      el._cuSeen = true;
      /* Reduced motion (or no IO support): leave the final value in place. */
      if (reduced || !io) continue;
      io.observe(el);
    }
  }

  function boot() {
    scan(document);

    /* Re-scan after SPA route swaps. The router replaces the contents of
       #app on every navigation, so freshly-rendered stats get re-armed.
       rAF-debounced — one scan per animation frame no matter how many
       mutations the swap fired. */
    var app = document.getElementById('app');
    if (app && 'MutationObserver' in window) {
      var queued = false;
      new MutationObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          scan(app);
        });
      }).observe(app, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
