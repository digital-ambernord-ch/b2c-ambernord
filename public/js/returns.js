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

  /* --------------------------------------------------------------------------
     ANIMATION — mark container as animating, remove will-change after paint.
     -------------------------------------------------------------------------- */

  const container = document.querySelector('.returns-page-container');
  if (container) {
    container.classList.add('animating');
    container.addEventListener('animationend', () => {
      container.classList.remove('animating');
    }, { once: true });
  }

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

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver fades in sections and footer;
     disconnects each observer entry after first reveal to save resources.
     -------------------------------------------------------------------------- */

  const targets = [
    ...document.querySelectorAll('.returns-section.page-reveal'),
    ...document.querySelectorAll('.returns-footer.page-reveal'),
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));

};
