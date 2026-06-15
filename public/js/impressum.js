/* ==========================================================================
   IMPRESSUM — window.initImpressum()
   Renders sections from /data/<lang>/impressum.json.
   Reuses .returns-* CSS classes for visual styling (same as AGB).
   ========================================================================== */

window.initImpressum = async function () {

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'impressum');

  function renderSections(sections) {
    const wrapper = document.getElementById('impressum-sections');
    if (!wrapper || !Array.isArray(sections)) return;

    wrapper.innerHTML = sections.map((section) => {
      const headingId = `impressum-${section.id}-heading`;
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

  if (typeof window.attachLinkListeners === 'function') {
    window.attachLinkListeners();
  }

  const targets = [...document.querySelectorAll('#impressum-sections .returns-section.page-reveal')];
  targets.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i * 0.08, 0.3)}s`; });

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

  if (typeof window.initSectionNav === 'function' && data && data.sectionNav) {
    window.initSectionNav({
      ariaLabel: data.sectionNav.aria || 'Sections',
      sections: data.sections.map((s) => ({ id: 'sec-' + s.id, label: (data.sectionNav.items || {})['sec-' + s.id] }))
    });
  }
};
