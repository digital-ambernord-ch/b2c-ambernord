/* ==========================================================================
   AGB — window.initAgb()
   Renders sections from /data/<lang>/agb.json into the agb page.
   Reuses .returns-* CSS class for visual styling.
   ========================================================================== */

window.initAgb = async function () {

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'agb');

  window.animateContainerEntry('.returns-page-container');

  function renderSections(sections) {
    const wrapper = document.getElementById('agb-sections');
    if (!wrapper || !Array.isArray(sections)) return;

    wrapper.innerHTML = sections.map((section) => {
      const headingId = `agb-${section.id}-heading`;
      const paragraphsHtml = Array.isArray(section.paragraphs)
        ? section.paragraphs.map((para) => `<p>${para}</p>`).join('')
        : '';
      return `
        <section class="returns-section page-reveal" id="sec-${section.id}" aria-labelledby="${headingId}">
          <h2 class="returns-section__heading" id="${headingId}">${section.heading}</h2>
          <div class="returns-section__body">${paragraphsHtml}</div>
        </section>
      `;
    }).join('');
  }

  renderSections(data.sections);

  /* Scroll reveal — shared helper in js/ui.js; .page-reveal is rendered in the
     section markup above, so addClass is off. */
  window.revealOnScroll('.returns-section.page-reveal, .returns-footer.page-reveal', { addClass: false });

  if (typeof window.initSectionNav === 'function' && data && data.sectionNav) {
    window.initSectionNav({
      ariaLabel: data.sectionNav.aria || 'Sections',
      sections: data.sections.map((s) => ({ id: 'sec-' + s.id, label: (data.sectionNav.items || {})['sec-' + s.id] }))
    });
  }
};
