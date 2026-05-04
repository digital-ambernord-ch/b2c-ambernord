/* ==========================================================================
   B2B — window.initB2b()
   Called by router.js after /pages/b2b.html is injected into #app.
   ========================================================================== */

window.initB2b = async function () {

  /* --------------------------------------------------------------------------
     I18N — fetch /data/[lang]/b2b.json, fallback to 'de'.
     -------------------------------------------------------------------------- */

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'b2b');

  /* --------------------------------------------------------------------------
     ENTRANCE ANIMATION — adds will-change during animation, removes after.
     -------------------------------------------------------------------------- */

  const container = document.querySelector('.b2b-page-container');
  if (container) {
    container.classList.add('animating');
    container.addEventListener('animationend', () => {
      container.classList.remove('animating');
    }, { once: true });
  }

  /* --------------------------------------------------------------------------
     RENDER PRODUCTS — builds alternating two-column product sections and
     appends them all into #b2b-products-list.
     -------------------------------------------------------------------------- */

  function buildImageBlock(product, images) {
    /* Returns the image column inner HTML for single or dual layout. */
    const base = 'https://res.cloudinary.com/dt6ksxuqf/image/upload';
    const mod  = product.imgLayout === 'dual' ? 'b2b-img-wrapper--dual' : 'b2b-img-wrapper--single';

    const imgItems = product.imageIndexes.map((idx) => {
      const img   = images[idx];
      const w     = product.imgLayout === 'dual' ? 600 : 800;
      const sizes = product.imgLayout === 'dual'
        ? '(max-width:480px) 50vw,(max-width:991px) 50vw,25vw'
        : '(max-width:480px) 100vw,(max-width:991px) 100vw,50vw';

      return `
        <div class="b2b-img-inner">
          <img class="b2b-img-inner__img"
            src="${base}/f_auto,q_auto,w_${w}/${img.cloudinaryId}"
            srcset="
              ${base}/f_auto,q_auto,w_400/${img.cloudinaryId} 400w,
              ${base}/f_auto,q_auto,w_800/${img.cloudinaryId} 800w,
              ${base}/f_auto,q_auto,w_1200/${img.cloudinaryId} 1200w,
              ${base}/f_auto,q_auto,w_1600/${img.cloudinaryId} 1600w"
            sizes="${sizes}"
            alt="${img.alt}"
            width="${w}" height="${Math.round(w * 1.25)}"
            loading="lazy" decoding="async">
        </div>
      `;
    });

    return `<div class="b2b-img-wrapper ${mod}">${imgItems.join('')}</div>`;
  }

  function renderProducts(products, images) {
    /* Builds one <section> per product with text + image columns and appends
       to #b2b-products-list. */
    const list = document.getElementById('b2b-products-list');
    if (!list) return;

    list.innerHTML = products.map((product, i) => {
      const specItems = product.specs.map((spec) => `
        <div class="b2b-spec-list__item">
          <dt class="b2b-spec-list__key">${spec.key}</dt>
          <dd class="b2b-spec-list__val">${spec.val}</dd>
        </div>
      `).join('');

      return `
        <section class="b2b-product-section page-reveal"
                 aria-labelledby="b2b-product-heading-${i}">
          <div class="b2b-container">
            <div class="b2b-product-row ${product.reverse ? 'b2b-product-row--reverse' : ''}">

              <div class="b2b-text-col">
                <span class="b2b-product-eyebrow">${product.eyebrow}</span>
                <h2 id="b2b-product-heading-${i}" class="b2b-section-heading">
                  ${product.heading}
                </h2>
                <p class="b2b-body">${product.body}</p>
                <dl class="b2b-spec-list">${specItems}</dl>
              </div>

              <div class="b2b-img-col">
                ${buildImageBlock(product, images)}
              </div>

            </div>
          </div>
        </section>
      `;
    }).join('');
  }

  renderProducts(data.products, data.images);

  /* --------------------------------------------------------------------------
     RENDER PROCESS — builds numbered step cards inside #b2b-process-grid.
     -------------------------------------------------------------------------- */

  function renderProcess(steps) {
    /* Builds one article card per process step and appends to #b2b-process-grid. */
    const grid = document.getElementById('b2b-process-grid');
    if (!grid) return;

    grid.innerHTML = steps.map((step) => `
      <article class="b2b-step-card page-reveal" role="listitem">
        <span class="b2b-step-card__num" aria-hidden="true">${step.num}</span>
        <h3 class="b2b-step-card__title">${step.title}</h3>
        <p class="b2b-step-card__text">${step.text}</p>
      </article>
    `).join('');
  }

  renderProcess(data.process.steps);

  /* --------------------------------------------------------------------------
     RENDER BENCHMARK — builds the quality comparison table inside
     #b2b-benchmark-table with scrollable wrapper for narrow viewports.
     -------------------------------------------------------------------------- */

  function renderBenchmark(benchmark) {
    /* Builds a full <table> with thead and tbody and wraps it in a scroller div. */
    const wrapper = document.getElementById('b2b-benchmark-table');
    if (!wrapper) return;

    const headerCells = benchmark.headers.map((h, i) => {
      const sub = benchmark.subheaders[i]
        ? `<span class="b2b-table__header-sub">${benchmark.subheaders[i]}</span>`
        : '';
      return `<th>${h}${sub}</th>`;
    }).join('');

    const rows = benchmark.rows.map((row) => `
      <tr>
        <td>${row.criterion}</td>
        <td class="b2b-table__col--industry">${row.industry}</td>
        <td class="b2b-table__col--ambernord">${row.ambernord}</td>
      </tr>
    `).join('');

    wrapper.innerHTML = `
      <div class="b2b-table-scroller">
        <table class="b2b-table">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  renderBenchmark(data.benchmark);

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver on all .page-reveal elements,
     with staggered delay per group; disconnects each entry after reveal.
     -------------------------------------------------------------------------- */

  document.querySelectorAll('.b2b-trust-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });

  document.querySelectorAll('.b2b-product-section').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.05}s`;
  });

  document.querySelectorAll('.b2b-step-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });

  const targets = [...document.querySelectorAll('.page-reveal')].filter(Boolean);
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