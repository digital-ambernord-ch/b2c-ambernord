/* AmberNord UI engine — mobile menu, dropdown a11y, language switch, deferred analytics. */

(function () {

  function setupMobileMenu() {
    const hamburger  = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeBtn   = document.getElementById('closeMenuBtn');

    if (!hamburger || !mobileMenu) return;

    function openMenu() {
      mobileMenu.classList.add('is-open');
      hamburger.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Menü schließen');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      mobileMenu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Menü öffnen');
      document.body.style.overflow = '';
    }

    window.closeMobileMenu = closeMenu;

    hamburger.addEventListener('click', function () {
      mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
    });
  }

  function setupDropdowns() {
    document.querySelectorAll('.ambernord-dropdown').forEach(function (dropdown) {
      const dropbtn = dropdown.querySelector('.ambernord-dropbtn');
      if (!dropbtn) return;

      dropbtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isExpanded = dropbtn.getAttribute('aria-expanded') === 'true';
        dropbtn.setAttribute('aria-expanded', String(!isExpanded));
      });

      dropbtn.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') dropbtn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (e) {
      document.querySelectorAll('.ambernord-dropdown').forEach(function (dropdown) {
        if (!dropdown.contains(e.target)) {
          const btn = dropdown.querySelector('.ambernord-dropbtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function setupLangButtons() {
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const lang = btn.getAttribute('data-lang');
        if (lang && typeof window.setLang === 'function') {
          window.setLang(lang);
        }
      });
    });

    const current = (typeof window.getLang === 'function') ? window.getLang() : 'de';
    const activeBtn = document.querySelector('[data-lang="' + current + '"]');
    if (activeBtn) activeBtn.setAttribute('aria-current', 'true');
  }

  function setupAnalytics() {
    let loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;

      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src   = 'https://www.googletagmanager.com/gtag/js?id=G-VRDSSTW4HR';
      document.head.appendChild(gtagScript);

      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-VRDSSTW4HR', { anonymize_ip: true });

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
      window.addEventListener(event, load, { passive: true, once: true });
    });

    setTimeout(load, 5000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupDropdowns();
    setupLangButtons();
    setupAnalytics();
  });

})();
