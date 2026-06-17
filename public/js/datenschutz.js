/* ==========================================================================
   DATENSCHUTZ — window.initDatenschutz()
   Called by router.js after /pages/datenschutz.html is injected into #app.
   ========================================================================== */

window.initDatenschutz = async function () {

  /* --------------------------------------------------------------------------
     I18N — fetch /data/[lang]/datenschutz.json, fallback to 'de'.
     -------------------------------------------------------------------------- */

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'datenschutz');

  /* --------------------------------------------------------------------------
     RENDER SECTIONS — builds one <section> per legal article from the
     sections array and appends all to #datenschutz-sections.
     -------------------------------------------------------------------------- */

  function renderSections(sections) {

    /* Builds a complete <section> element per legal article, handling three
       block types — paragraph, list and address — in declared order. */

    const container = document.getElementById('datenschutz-sections');
    if (!container) return;

    container.innerHTML = sections.map((section) => {

      const blocksHtml = section.blocks.map((block) => {

        if (block.type === 'paragraph') {
          return `<p class="datenschutz-body">${block.text}</p>`;
        }

        if (block.type === 'list') {
          const itemsHtml = block.items.map((item) => `
            <li class="datenschutz-list__item">
              ${item.term ? `<strong class="datenschutz-list__term">${item.term}</strong> ` : ''}${item.desc}
            </li>
          `).join('');
          return `<ul class="datenschutz-list" role="list">${itemsHtml}</ul>`;
        }

        if (block.type === 'address') {
          const linesHtml = block.lines
            .map((line) => `<span class="datenschutz-address__line">${line}</span>`)
            .join('');
          return `
            <address class="datenschutz-address">
              ${linesHtml}
              <a href="${block.emailHref}" class="datenschutz-address__link"
                 target="_blank" rel="noopener noreferrer">${block.emailLabel}</a>
            </address>
          `;
        }

        return '';

      }).join('');

      return `
        <section
          class="datenschutz-section-item page-reveal"
          id="sec-${section.id}"
          aria-labelledby="${section.id}-heading"
        >
          <h2 class="datenschutz-section-heading" id="${section.id}-heading">
            ${section.heading}
          </h2>
          <div class="datenschutz-section-body">
            ${blocksHtml}
          </div>
        </section>
      `;

    }).join('');
  }

  /* --------------------------------------------------------------------------
     RENDER FOOTER NOTE — populates the last-updated timestamp paragraph
     from the footer.lastUpdated key in the JSON data.
     -------------------------------------------------------------------------- */

  function renderFooterNote(footer) {

    /* Writes the localised last-updated text into #datenschutz-footer-note. */

    const el = document.getElementById('datenschutz-footer-note');
    if (!el) return;
    el.textContent = footer.lastUpdated;
  }

  renderSections(data.sections);
  renderFooterNote(data.footer);

  /* Container entrance + scroll reveal — shared helpers in js/ui.js; the reveal
     class is already on the rendered items, so addClass is off. */
  window.animateContainerEntry('.datenschutz-page-container');
  window.revealOnScroll('.datenschutz-section-item, .datenschutz-footer-note', { delayStep: 0.06, addClass: false });

  if (typeof window.initSectionNav === 'function' && data && data.sectionNav) {
    window.initSectionNav({
      ariaLabel: data.sectionNav.aria || 'Sections',
      sections: data.sections.map((s) => ({ id: 'sec-' + s.id, label: (data.sectionNav.items || {})['sec-' + s.id] }))
    });
  }

};
