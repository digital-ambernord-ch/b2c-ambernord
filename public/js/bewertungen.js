/* ==========================================================================
   BEWERTUNGEN — window.initBewertungen()
   Renders /data/reviews.json + handles submission form (Web3Forms).
   ========================================================================== */

window.initBewertungen = async function () {

  /* I18N — fallback to hardcoded German if /data/<lang>/bewertungen.json missing. */
  const lang = window.getLang();
  let i18n = {};
  try { i18n = await window.loadI18n(lang, 'bewertungen'); } catch {}

  /* loadI18n injects HTML via data-i18n-html, which can introduce new
     <a data-link> elements (e.g. the secretNote at the page bottom). Re-bind
     the SPA router so those links don't fall through to a hard reload. */
  if (typeof window.attachLinkListeners === 'function') {
    window.attachLinkListeners();
  }

  /* ------------------------------------------------------------------------
     RENDER REVIEWS LIST + AGGREGATE from /data/reviews.json
     ------------------------------------------------------------------------ */

  const listEl       = document.getElementById('bewertungen-list');
  const emptyEl      = document.getElementById('bewertungen-empty');
  const aggSection   = document.getElementById('bewertungen-aggregate');
  const aggStarsEl   = document.getElementById('bewertungen-aggregate-stars');
  const aggAvgEl     = document.getElementById('bewertungen-aggregate-avg');
  const aggCountEl   = document.getElementById('bewertungen-aggregate-count');

  function renderStars(n) {
    const full = Math.round(Math.max(0, Math.min(5, Number(n) || 0)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(lang === 'de' ? 'de-CH' : lang, { year: 'numeric', month: 'long' });
  }

  /* Pick the right text variant. Customer submissions arrive as a plain string;
     curated reviews (e.g. the founder note) ship as a {de,en,fr,it} object so
     they can be translated. Falls back through the requested lang → de → en. */
  function pickText(raw) {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') return raw[lang] || raw.de || raw.en || '';
    return '';
  }

  /* Multi-paragraph rendering — split on blank lines so a long founder story
     reads as paragraphs instead of one wall of italic text. The opening and
     closing typographic quotes wrap the FIRST/LAST paragraph only. */
  function renderText(raw) {
    const text     = pickText(raw);
    const escaped  = escapeHtml(text);
    const parts    = escaped.split(/\n\s*\n/);
    if (parts.length <= 1) {
      return `<p class="bewertungen-card-text">&bdquo;${escaped}&ldquo;</p>`;
    }
    return parts.map((p, i) => {
      const open  = i === 0 ? '&bdquo;' : '';
      const close = i === parts.length - 1 ? '&ldquo;' : '';
      return `<p class="bewertungen-card-text">${open}${p}${close}</p>`;
    }).join('');
  }

  try {
    const res = await fetch('/data/reviews.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];

    if (reviews.length > 0 && listEl) {
      if (emptyEl) emptyEl.remove();

      const verifiedLabel = (i18n.list && i18n.list.verified) || 'Verifizierte Bestellung';
      const roles         = (i18n.roles) || {};

      const html = reviews.map((r) => {
        const roleLabel = r.roleKey && roles[r.roleKey];
        return `
        <article class="bewertungen-card${roleLabel ? ' bewertungen-card--featured' : ''}" role="listitem">
          <div class="bewertungen-card-stars" aria-label="${escapeHtml(r.stars)} von 5 Sternen">${renderStars(r.stars)}</div>
          ${renderText(r.text)}
          <footer class="bewertungen-card-meta">
            <span class="bewertungen-card-author">${escapeHtml(r.author)}${roleLabel ? ` <span class="bewertungen-card-role">· ${escapeHtml(roleLabel)}</span>` : ''}</span>
            <span class="bewertungen-card-context">
              ${escapeHtml(r.city || '')}${r.city && r.date ? ' &middot; ' : ''}${escapeHtml(formatDate(r.date))}
              ${r.verified ? ` &middot; <span class="bewertungen-verified">${escapeHtml(verifiedLabel)}</span>` : ''}
            </span>
          </footer>
        </article>
        `;
      }).join('');

      listEl.insertAdjacentHTML('beforeend', html);

      if (data.aggregate && aggSection && Number(data.aggregate.count) > 0) {
        aggSection.hidden = false;
        if (aggStarsEl) aggStarsEl.textContent = renderStars(data.aggregate.average);
        if (aggAvgEl)   aggAvgEl.textContent   = Number(data.aggregate.average).toFixed(1);
        if (aggCountEl) {
          const tmpl = (i18n.aggregate && i18n.aggregate.countTemplate) || '{n} Bewertungen';
          aggCountEl.textContent = tmpl.replace('{n}', data.aggregate.count);
        }
      }
    }
  } catch {
    /* leave empty state visible */
  }

  /* ------------------------------------------------------------------------
     FORM — Web3Forms submission (same access key as contact form).
     ------------------------------------------------------------------------ */

  const form        = document.getElementById('bewertung-form');
  const submitBtn   = document.getElementById('bw-submit');
  const submitText  = document.getElementById('bw-submit-text');
  const successBox  = document.getElementById('bw-success');
  const textArea    = document.getElementById('bw-text');
  const textCounter = document.getElementById('bw-text-count');

  if (textArea && textCounter) {
    textArea.addEventListener('input', () => {
      textCounter.textContent = textArea.value.length;
    });
  }

  if (form) {
    function injectHidden(name, value) {
      const el = document.createElement('input');
      el.type  = 'hidden';
      el.name  = name;
      el.value = value;
      form.prepend(el);
    }

    injectHidden('from_name',  'AmberNord Website (Bewertungen)');
    injectHidden('subject',    (i18n.form && i18n.form.hiddenSubject) || 'Neue Bewertung von AmberNord.ch');
    injectHidden('access_key', '3328b876-766e-4040-ab07-b989e615ade4');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!form.reportValidity()) return;

      const sendingLabel = (i18n.form && i18n.form.submit && i18n.form.submit.sending) || 'Wird gesendet…';
      const labelDefault = (i18n.form && i18n.form.submit && i18n.form.submit.label)   || 'Bewertung absenden';
      if (submitText) submitText.textContent = sendingLabel;
      submitBtn.disabled = true;

      const payload = JSON.stringify(Object.fromEntries(new FormData(form)));

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body:    payload
        });

        if (res.ok) {
          if (successBox) successBox.hidden = false;
          form.reset();
          if (textCounter) textCounter.textContent = '0';
          (successBox || form).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          alert((i18n.form && i18n.form.error) || 'Fehler. Bitte erneut versuchen.');
        }
      } catch {
        alert((i18n.form && i18n.form.error) || 'Fehler. Bitte erneut versuchen.');
      } finally {
        if (submitText) submitText.textContent = labelDefault;
        submitBtn.disabled = false;
      }
    });
  }

  /* ------------------------------------------------------------------------
     SCROLL REVEAL — same pattern as other pages.
     ------------------------------------------------------------------------ */

  const targets = [
    ...document.querySelectorAll('.bewertungen-intro, .bewertungen-aggregate-section, .bewertungen-list-section, .bewertungen-form-section')
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
