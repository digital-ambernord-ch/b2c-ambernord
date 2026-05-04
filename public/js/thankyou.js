/* ==========================================================================
   THANK YOU — window.initThankyou()
   Called by router.js after /pages/thankyou.html is injected into #app.
   ========================================================================== */

window.initThankyou = async function () {

  /* --------------------------------------------------------------------------
     I18N — fetch /data/[lang]/thankyou.json, fallback to 'de'.
     -------------------------------------------------------------------------- */

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'thankyou');

  /* --------------------------------------------------------------------------
     WILL-CHANGE — set on entrance, removed once animation completes.
     -------------------------------------------------------------------------- */

  const container = document.querySelector('.thankyou-page-container');

  if (container) {
    container.classList.add('animating');
    container.addEventListener(
      'animationend',
      () => container.classList.remove('animating'),
      { once: true }
    );
  }

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — staggered IntersectionObserver, disconnects after reveal.
     -------------------------------------------------------------------------- */

  const targets = [
    ...document.querySelectorAll(
      '.thankyou-body, .thankyou-tagline, .thankyou-cta'
    ),
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.classList.add('page-reveal');
    el.style.transitionDelay = `${i * 0.12}s`;
  });

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));

};