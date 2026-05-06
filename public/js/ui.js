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
      const content = dropdown.querySelector('.ambernord-dropdown-content');
      if (!dropbtn) return;

      dropbtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isExpanded = dropbtn.getAttribute('aria-expanded') === 'true';
        dropbtn.setAttribute('aria-expanded', String(!isExpanded));
      });

      dropbtn.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          dropbtn.setAttribute('aria-expanded', 'false');
          dropbtn.blur();
        }
      });

      /* Close immediately on any menu-item click, both for hover-only and
         keyboard/click-opened states. blur() drops :focus-within so CSS hides. */
      if (content) {
        content.addEventListener('click', function () {
          dropbtn.setAttribute('aria-expanded', 'false');
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        });
      }

      /* Cursor leaving dropdown collapses aria-expanded so a re-open is fresh. */
      dropdown.addEventListener('mouseleave', function () {
        dropbtn.setAttribute('aria-expanded', 'false');
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

  /* GA4 + TikTok Pixel are no longer auto-loaded here. They are gated by the
     consent module (cookie-consent.js) via <script type="text/plain"
     data-cookie-category="..."> placeholders in index.html. The placeholders
     are activated only after the user grants the matching category. */

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupDropdowns();
    setupLangButtons();
  });

})();
