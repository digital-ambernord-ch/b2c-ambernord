/* ==========================================================================
   RETURNS — window.initReturns()
   Called by router.js after /pages/returns.html is injected into #app.
   ========================================================================== */

window.initReturns = async function () {

  /* --------------------------------------------------------------------------
     I18N — fetch /data/[lang]/returns.json, fallback to 'de'.
     -------------------------------------------------------------------------- */

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'returns');

  /* Container entrance — shared helper in js/ui.js. */
  window.animateContainerEntry('.returns-page-container');

  /* --------------------------------------------------------------------------
     RENDER SECTIONS — builds one <section> per entry in data.sections and
     appends the full set to #returns-sections.
     -------------------------------------------------------------------------- */

  function renderSections(sections) {
    /* Builds labelled <section> blocks, each with an h2 and paragraph body,
       and appends them all to the #returns-sections container. */

    const wrapper = document.getElementById('returns-sections');
    if (!wrapper || !Array.isArray(sections)) return;

    wrapper.innerHTML = sections.map((section) => {
      const headingId = `returns-${section.id}-heading`;

      const paragraphsHtml = Array.isArray(section.paragraphs)
        ? section.paragraphs
            .map((para) => `<p>${para}</p>`)
            .join('')
        : '';

      return `
        <section
          class="returns-section page-reveal"
          id="sec-${section.id}"
          aria-labelledby="${headingId}"
        >
          <h2
            class="returns-section__heading"
            id="${headingId}"
          >${section.heading}</h2>
          <div class="returns-section__body">
            ${paragraphsHtml}
          </div>
        </section>
      `;
    }).join('');
  }

  renderSections(data.sections);

  /* Scroll reveal — shared helper in js/ui.js; .page-reveal is already in the
     rendered markup, so addClass is off. */
  window.revealOnScroll('.returns-section.page-reveal, .returns-footer.page-reveal', { addClass: false });

  if (typeof window.initSectionNav === 'function' && data && data.sectionNav) {
    window.initSectionNav({
      ariaLabel: data.sectionNav.aria || 'Sections',
      sections: data.sections.map((s) => ({ id: 'sec-' + s.id, label: (data.sectionNav.items || {})['sec-' + s.id] }))
    });
  }

};
