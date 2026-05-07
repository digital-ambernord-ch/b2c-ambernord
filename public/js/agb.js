/* ==========================================================================
   AGB — window.initAgb()
   Renders sections from /data/<lang>/agb.json into the agb page.
   Reuses .returns-* CSS class for visual styling.
   ========================================================================== */

window.initAgb = async function () {

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'agb');

  const container = document.querySelector('.returns-page-container');
  if (container) {
    container.classList.add('animating');
    container.addEventListener('animationend', () => {
      container.classList.remove('animating');
    }, { once: true });
  }

  function renderSections(sections) {
    const wrapper = document.getElementById('agb-sections');
    if (!wrapper || !Array.isArray(sections)) return;

    wrapper.innerHTML = sections.map((section) => {
      const headingId = `agb-${section.id}-heading`;
      const paragraphsHtml = Array.isArray(section.paragraphs)
        ? section.paragraphs.map((para) => `<p>${para}</p>`).join('')
        : '';
      return `
        <section class="returns-section page-reveal" aria-labelledby="${headingId}">
          <h2 class="returns-section__heading" id="${headingId}">${section.heading}</h2>
          <div class="returns-section__body">${paragraphsHtml}</div>
        </section>
      `;
    }).join('');
  }

  renderSections(data.sections);

  const targets = [
    ...document.querySelectorAll('.returns-section.page-reveal'),
    ...document.querySelectorAll('.returns-footer.page-reveal'),
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
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
