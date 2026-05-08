/* ==========================================================================
   AKTION 2-FÜR-1 — sales page init.
   I18N + scroll reveal + reduced-motion guard.
   ========================================================================== */

window.initAktion2Fuer1 = async function () {

  const lang = window.getLang();
  try { await window.loadI18n(lang, 'aktion-2-fuer-1'); } catch {}

  /* FAQ q4 answer is rendered via data-i18n-html and contains a <a data-link>
     to the contact form. Re-bind router handlers so the SPA intercepts it. */
  if (typeof window.attachLinkListeners === 'function') {
    window.attachLinkListeners();
  }

  const targets = [
    ...document.querySelectorAll('.aktion-hero, .aktion-why, .aktion-deal, .aktion-steps, .aktion-faq, .aktion-final')
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.classList.add('page-reveal');
    el.style.transitionDelay = `${i * 0.1}s`;
  });

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.12 }
  );
  targets.forEach((el) => observer.observe(el));
};
