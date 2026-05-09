/* ==========================================================================
   SHOP — window.initShop()
   Called by router.js after /pages/shop.html is injected into #app.
   ========================================================================== */

window.initShop = async function () {

  /* --------------------------------------------------------------------------
     I18N — fetch /data/[lang]/shop.json, fallback to 'de'.
     -------------------------------------------------------------------------- */

  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'shop');

  /* --------------------------------------------------------------------------
     RENDER BADGE — returns badge markup string or empty string if none.
     -------------------------------------------------------------------------- */

  function renderBadge(badge) {
    /* Builds bestseller ribbon HTML for the gallery overlay (only badge type
       still in use; voucher campaigns have been retired). */
    if (!badge) return '';

    if (badge.type === 'bestseller') {
      return `<span class="shop-card__badge shop-card__badge--bestseller">${badge.label}</span>`;
    }

    return '';
  }

  /* --------------------------------------------------------------------------
     RENDER SCIENCE ITEMS — maps benefit strings to accessible list items.
     -------------------------------------------------------------------------- */

  function renderScienceItems(items) {
    /* Builds the gold-bullet benefit list for each card's science box. */
    return items
      .map(
        (item) => `
        <li class="shop-card__science-item">
          <span aria-hidden="true" class="shop-card__bullet">✦</span>
          <span>${item}</span>
        </li>`
      )
      .join('');
  }

  /* --------------------------------------------------------------------------
     RENDER ABO BUTTON — returns subscription CTA markup or empty string.
     -------------------------------------------------------------------------- */

  function renderAboBtn(sub) {
    /* Builds the two-tone Abo button; returns empty string if product has no sub. */
    if (!sub) return '';

    return `<a class="shop-card__btn-abo" href="${sub.href}" target="_blank" rel="noopener noreferrer">
        <div class="shop-card__abo-top">${sub.discountLabel}</div>
        <div class="shop-card__abo-bottom">
          <div class="shop-card__abo-price-wrap">
            <span class="shop-card__abo-price">${sub.price}</span>
            <span class="shop-card__abo-subtext">${sub.subtext}</span>
          </div>
          <span class="shop-card__abo-guarantee">${sub.guarantee}</span>
        </div>
      </a>`;
  }

  /* --------------------------------------------------------------------------
     RENDER PRODUCTS — builds all product card articles into #shop-grid.
     -------------------------------------------------------------------------- */

  function renderProducts(products) {
    /* Iterates product data array and injects card markup into the grid container. */
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    const cdn = 'https://res.cloudinary.com/dt6ksxuqf/image/upload';

    grid.innerHTML = products
      .map((p) => {
        const id = p.image.cloudinaryId;

        return `
          <article class="shop-card page-reveal" role="listitem">

            <a class="shop-card__content-link shop-card__top-link" href="${p.slug}" data-link>

              <div class="shop-card__gallery">
                ${renderBadge(p.badge)}
                <div class="shop-card__image-wrap">
                  <img
                    src="${cdn}/f_auto,q_auto,w_400/${id}"
                    srcset="
                      ${cdn}/f_auto,q_auto,w_400/${id} 400w,
                      ${cdn}/f_auto,q_auto,w_800/${id} 800w,
                      ${cdn}/f_auto,q_auto,w_1200/${id} 1200w,
                      ${cdn}/f_auto,q_auto,w_1600/${id} 1600w"
                    sizes="(max-width:768px) 90vw, (max-width:991px) 45vw, 30vw"
                    alt="${p.image.alt}"
                    width="${p.image.width}"
                    height="${p.image.height}"
                    loading="lazy"
                    decoding="async">
                </div>
              </div>

              <div class="shop-card__hero">
                <h3 class="shop-card__title">${p.title}</h3>
                <p class="shop-card__quantity">${p.quantity}</p>

                <div class="shop-card__price-row">
                  <span class="shop-card__price">${p.price}</span>
                  ${p.savings ? `<span class="shop-card__savings">${p.savings}</span>` : ''}
                </div>
                ${p.daily ? `<p class="shop-card__daily">${p.daily}</p>` : ''}

                <p class="shop-card__subtitle">${p.subtitle}</p>
              </div>

            </a>

            <a class="shop-card__btn-primary shop-card__btn-primary--mobile" href="${p.buttons.primary.href}" target="_blank" rel="noopener noreferrer">${p.buttons.primary.label}</a>

            <a class="shop-card__content-link shop-card__bottom-link" href="${p.slug}" data-link>

              <p class="shop-card__desc">${p.body}</p>

              <div class="shop-card__science">
                <span class="shop-card__science-heading">${p.scienceBox.heading}</span>
                <ul class="shop-card__science-list">
                  ${renderScienceItems(p.scienceBox.items)}
                </ul>
              </div>

            </a>

            <div class="shop-card__action">
              <a class="shop-card__btn-primary shop-card__btn-primary--desktop" href="${p.buttons.primary.href}" target="_blank" rel="noopener noreferrer">${p.buttons.primary.label}</a>
              ${renderAboBtn(p.buttons.subscription)}
              <p class="shop-card__shipping">
                <span class="shop-card__shipping-highlight">${p.shipping.highlight}</span>${p.shipping.text}
              </p>
            </div>

          </article>`;
      })
      .join('');
  }

  renderProducts(data.products);

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — staggered IntersectionObserver entrance for each card.
     -------------------------------------------------------------------------- */

  const targets = [...document.querySelectorAll('.shop-card')].filter(Boolean);
  targets.forEach((el, i) => { el.style.transitionDelay = `${i * 0.12}s`; });

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.1 }
  );

  targets.forEach((el) => observer.observe(el));

  /* --------------------------------------------------------------------------
     WILL-CHANGE CLEANUP — removes property after entrance animation completes.
     -------------------------------------------------------------------------- */

  const container = document.querySelector('.shop-page-container');
  if (container) {
    container.classList.add('animating');
    container.addEventListener(
      'animationend',
      () => container.classList.remove('animating'),
      { once: true }
    );
  }

};