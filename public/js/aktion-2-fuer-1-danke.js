/* ==========================================================================
   AKTION 2-FÜR-1 — Stripe success page init.
   I18N + scroll reveal.
   ========================================================================== */

window.initAktion2Fuer1Danke = async function () {

  const lang = window.getLang();
  try { await window.loadI18n(lang, 'aktion-2-fuer-1-danke'); } catch {}

  const targets = [
    ...document.querySelectorAll('.aktion-danke-confirm, .aktion-danke-next, .aktion-danke-actions')
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.classList.add('page-reveal');
    el.style.transitionDelay = `${i * 0.12}s`;
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
