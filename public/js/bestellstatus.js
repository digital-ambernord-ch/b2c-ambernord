/* ==========================================================================
   BESTELLSTATUS — window.initBestellstatus()
   Called by router.js after /pages/bestellstatus.html is injected into #app.
   ========================================================================== */

window.initBestellstatus = async function () {

  /* --------------------------------------------------------------------------
     I18N — fetch /data/[lang]/bestellstatus.json, fallback to 'de'.
     -------------------------------------------------------------------------- */

  const lang = window.getLang();
  await window.loadI18n(lang, 'bestellstatus');

  /* --------------------------------------------------------------------------
     FORM — intercepts submit, validates input, reveals the fallback message.
     -------------------------------------------------------------------------- */

  const form  = document.getElementById('bestellstatus-form');
  const msg   = document.getElementById('bestellstatus-msg');
  const input = document.getElementById('order-input');

  if (form && msg && input) {
    form.addEventListener('submit', function (e) {
      /* Prevent default browser submission and show the status panel. */
      e.preventDefault();
      if (!input.value.trim()) return;
      msg.hidden = false;
      msg.focus();
    });
  }

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver, disconnects after each reveal.
     -------------------------------------------------------------------------- */

  const targets = [
    ...document.querySelectorAll('.bestellstatus-section, .bestellstatus-card'),
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.classList.add('page-reveal');
    el.style.transitionDelay = `${i * 0.1}s`;
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
