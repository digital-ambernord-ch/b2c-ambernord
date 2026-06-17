/* ==========================================================================
   CONTACT — window.initContact()
   Called by router.js after /pages/contact.html is injected into #app.
   ========================================================================== */

window.initContact = async function () {

  /* --------------------------------------------------------------------------
     I18N — fetch /data/[lang]/contact.json, fallback to 'de'.
     -------------------------------------------------------------------------- */

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'contact');

  /* --------------------------------------------------------------------------
     FORM — injects Web3Forms hidden config fields and handles async submission.
     -------------------------------------------------------------------------- */

  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('contact-submit');
  const submitText = document.getElementById('contact-submit-text');
  const successBox = document.getElementById('contact-success');

  if (form) {

    /* Programmatically prepend Web3Forms hidden fields so the key
       never appears as a hardcoded attribute in the HTML fragment. */
    function injectHidden(name, value) {
      const el   = document.createElement('input');
      el.type    = 'hidden';
      el.name    = name;
      el.value   = value;
      form.prepend(el);
    }

    injectHidden('from_name',  'AmberNord Website');
    injectHidden('subject',    data.form?.hiddenSubject || 'Neue Kontaktanfrage von AmberNord.ch');
    injectHidden('access_key', '3328b876-766e-4040-ab07-b989e615ade4');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const sendingLabel = data.form?.submit?.sending || '…';
      if (submitText) submitText.textContent = sendingLabel;
      submitBtn.disabled = true;

      const payload = JSON.stringify(Object.fromEntries(new FormData(form)));

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body:    payload,
        });

        if (res.ok) {
          if (successBox) successBox.hidden = false;
          form.reset();
          form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          alert(data.form?.error || 'Fehler. Bitte erneut versuchen.');
        }
      } catch {
        alert(data.form?.error || 'Fehler. Bitte erneut versuchen.');
      } finally {
        if (submitText) submitText.textContent = data.form?.submit?.label || 'SENDEN';
        submitBtn.disabled = false;
      }
    });
  }

  /* --------------------------------------------------------------------------
     INQUIRY AUTOFILL — pre-fills the textarea when ?inquiry=<key> is in the
     URL. Currently used for two flows: ?inquiry=b2b (general B2B) and
     ?inquiry=masterbox (focused 20-bottle Master Box request from /b2b/).
     -------------------------------------------------------------------------- */

  const params  = new URLSearchParams(window.location.search);
  const inquiry = params.get('inquiry');
  const prefill = inquiry && data[inquiry] && data[inquiry].message;
  if (prefill) {
    const textarea = document.getElementById('contact-message');
    if (textarea) {
      textarea.value = prefill;
      setTimeout(() => {
        const formSection = document.querySelector('.contact-form-section');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textarea.focus();
      }, 800);
    }
  }

  /* Scroll reveal + container entrance — shared helpers in js/ui.js. */
  window.revealOnScroll('.contact-intro, .contact-card-section, .contact-form-section', { delayStep: 0.12 });
  window.animateContainerEntry('.contact-page-container');

  /* --------------------------------------------------------------------------
     SECTION-NAV — in-page rail (js/section-nav.js); sections in document order,
     short labels from data.sectionNav per locale. The component skips any id
     missing from the DOM and the router tears it down on every navigation.
     -------------------------------------------------------------------------- */

  if (typeof window.initSectionNav === 'function' && data && data.sectionNav) {
    const navItems = data.sectionNav.items || {};
    window.initSectionNav({
      ariaLabel: data.sectionNav.aria || 'Sections',
      sections: [
        { id: 'contact-card',         label: navItems['contact-card'] },
        { id: 'contact-whatsapp',     label: navItems['contact-whatsapp'] },
        { id: 'contact-form-section', label: navItems['contact-form-section'] }
      ]
    });
  }
};
