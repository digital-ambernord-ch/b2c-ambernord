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

  /* --------------------------------------------------------------------------
     ENTRANCE ANIMATION — marks the container with .animating during the CSS
     keyframe, then removes will-change to free compositor resources.
     -------------------------------------------------------------------------- */

  const container = document.querySelector('.datenschutz-page-container');
  if (container) {
    container.classList.add('animating');
    container.addEventListener('animationend', () => {
      container.classList.remove('animating');
    }, { once: true });
  }

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver adds .is-visible to each section
     and the footer note as they enter the viewport; disconnects after reveal.
     -------------------------------------------------------------------------- */

  const targets = [
    ...document.querySelectorAll('.datenschutz-section-item, .datenschutz-footer-note'),
  ].filter(Boolean);

  targets.forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.06}s`;
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
