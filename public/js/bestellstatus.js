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

  /* Scroll reveal — shared helper in js/ui.js. */
  window.revealOnScroll('.bestellstatus-section, .bestellstatus-card', { delayStep: 0.1, threshold: 0.15 });

};
