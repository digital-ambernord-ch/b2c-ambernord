/* =========================================================================
   AMBERNORD — UI ENGINE
   js/ui.js
   Mobile menu · Hamburger · Deferred analytics (GA4 + TikTok)
   ========================================================================= */

(function () {

  /* =========================================================================
     MOBILE MENU — open / close logic
     ========================================================================= */

  function setupMobileMenu() {
    const hamburger  = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeBtn   = document.getElementById('closeMenuBtn');

    if (!hamburger || !mobileMenu) return;

    function openMenu() {
      mobileMenu.classList.add('is-open');
      hamburger.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      mobileMenu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    window.closeMobileMenu = closeMenu;

    hamburger.addEventListener('click', function () {
      if (mobileMenu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  /* =========================================================================
     DROPDOWN ACCESSIBILITY — keyboard support for desktop dropdown
     ========================================================================= */

  function setupDropdown() {
    const dropbtn  = document.getElementById('dropbtn');
    const dropdown = document.querySelector('.ambernord-dropdown');

    if (!dropbtn || !dropdown) return;

    dropbtn.addEventListener('click', function () {
      const isExpanded = dropbtn.getAttribute('aria-expanded') === 'true';
      dropbtn.setAttribute('aria-expanded', String(!isExpanded));
    });

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropbtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* =========================================================================
     DEFERRED ANALYTICS
     Loads GA4 + TikTok pixel only after first user interaction.
     This avoids blocking the initial page render.
     ========================================================================= */

  function setupAnalytics() {
    let analyticsLoaded = false;

    function loadAnalytics() {
      if (analyticsLoaded) return;
      analyticsLoaded = true;

      const gtagScript   = document.createElement('script');
      gtagScript.async   = true;
      gtagScript.src     = 'https://www.googletagmanager.com/gtag/js?id=G-VRDSSTW4HR';
      document.head.appendChild(gtagScript);

      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-VRDSSTW4HR');

      (function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'];
        ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
        ttq.load = function (e, n) {
          var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
          ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
          ttq._o = ttq._o || {}; ttq._o[e] = n || {};
          var s = document.createElement('script');
          s.type = 'text/javascript'; s.async = true; s.src = r + '?sdkid=' + e + '&lib=' + t;
          var c = document.getElementsByTagName('script')[0];
          c.parentNode.insertBefore(s, c);
        };
        ttq.load('D75TCVJC77UD6SV8PER0');
        ttq.page();
      })(window, document, 'ttq');
    }

    ['scroll', 'mousemove', 'touchstart', 'click'].forEach(function (event) {
      window.addEventListener(event, loadAnalytics, { passive: true, once: true });
    });

    setTimeout(loadAnalytics, 5000);
  }

  /* =========================================================================
     INIT
     ========================================================================= */

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupDropdown();
    setupAnalytics();
  });

})();
