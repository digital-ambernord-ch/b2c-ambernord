/* ==========================================================================
   AKTION 2-FÜR-1 — Stripe success page init.
   I18N + scroll reveal.
   ========================================================================== */

window.initAktion2Fuer1Danke = async function () {

  const lang = window.getLang();
  let data = null;
  try { data = await window.loadI18n(lang, 'aktion-2-fuer-1-danke'); } catch {}

  const targets = [
    ...document.querySelectorAll('.aktion-danke-confirm, .aktion-danke-next, .aktion-danke-actions')
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.classList.add('page-reveal');
    el.style.transitionDelay = `${Math.min(i * 0.12, 0.3)}s`;
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

  /* Section-nav rail (js/section-nav.js) — short labels per locale from
     data.sectionNav. The component skips missing ids and the router tears
     the rail down on every nav. */
  if (typeof window.initSectionNav === 'function' && data && data.sectionNav) {
    const navItems = data.sectionNav.items || {};
    window.initSectionNav({
      ariaLabel: data.sectionNav.aria || 'Sections',
      sections: [
        { id: 'aktion-danke-confirm', label: navItems['aktion-danke-confirm'] },
        { id: 'aktion-danke-next',    label: navItems['aktion-danke-next'] }
      ]
    });
  }
};
