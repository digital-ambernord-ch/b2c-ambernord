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
     RENDER PURCHASE TOGGLE — Einmalkauf ↔ Abo radio group above the CTA.
     Returns empty string for products without a subscription option.
     -------------------------------------------------------------------------- */

  function renderPurchaseToggle(purchase, productId) {
    if (!purchase) return '';

    return `<fieldset class="purchase-toggle" data-purchase-toggle>
        <legend class="purchase-toggle__legend">${purchase.legend}</legend>
        <label class="purchase-option">
          <input type="radio" name="purchase-mode-${productId}" value="once" checked>
          <span class="purchase-option__label">${purchase.oneTimeLabel}</span>
        </label>
        <label class="purchase-option">
          <input type="radio" name="purchase-mode-${productId}" value="abo">
          <span class="purchase-option__label">${purchase.aboLabel}</span>
        </label>
      </fieldset>`;
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
        const featured = (p.badge && p.badge.type === 'bestseller')
          ? ' shop-card--featured'
          : '';

        return `
          <article class="shop-card${featured} page-reveal" role="listitem">

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
              ${renderPurchaseToggle(p.buttons.purchase, p.id)}
              <a class="shop-card__btn-primary" data-buy-cta href="${p.buttons.primary.href}" target="_blank" rel="noopener noreferrer">${p.buttons.primary.label}</a>
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
     PURCHASE TOGGLE WIRING — one delegated listener per grid. Switching the
     radio updates BOTH buy CTAs of the card (mobile + desktop) to the
     matching label and Stripe link. Default stays the one-time purchase.
     -------------------------------------------------------------------------- */

  const grid = document.getElementById('shop-grid');
  if (grid) {
    const productById = {};
    (data.products || []).forEach((p) => { productById[p.id] = p; });

    grid.addEventListener('change', (e) => {
      const input = e.target;
      if (!input || !input.name || input.name.indexOf('purchase-mode-') !== 0) return;

      const id = input.name.replace('purchase-mode-', '');
      const p  = productById[id];
      if (!p || !p.buttons.purchase) return;

      const isAbo = input.value === 'abo';
      const href  = isAbo ? p.buttons.purchase.aboHref : p.buttons.primary.href;
      const label = isAbo ? p.buttons.purchase.ctaAbo  : p.buttons.purchase.ctaOneTime;

      const card = input.closest('.shop-card');
      if (!card) return;
      card.querySelectorAll('[data-buy-cta]').forEach((cta) => {
        cta.setAttribute('href', href);
        cta.textContent = label;
      });

      // Update the price / savings / daily display under the product title.
      const pur = p.buttons.purchase;
      const priceEl   = card.querySelector('.shop-card__price');
      const savingsEl = card.querySelector('.shop-card__savings');
      const dailyEl   = card.querySelector('.shop-card__daily');
      if (priceEl)   priceEl.textContent   = isAbo ? (pur.aboPrice   || p.price)       : p.price;
      if (savingsEl) savingsEl.textContent = isAbo ? (pur.aboSavings || '')             : (p.savings || '');
      if (dailyEl)   dailyEl.textContent   = isAbo ? (pur.aboDaily   || p.daily || '') : (p.daily   || '');
    });
  }

  /* --------------------------------------------------------------------------
     SCROLL REVEAL — staggered IntersectionObserver entrance for each card.
     -------------------------------------------------------------------------- */

  const targets = [...document.querySelectorAll('.shop-card')].filter(Boolean);
  targets.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i * 0.12, 0.3)}s`; });

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

  /* --------------------------------------------------------------------------
     MOBILE PRODUCT CAROUSEL (≤768px) — infinite, finger-driven gallery.

     The three product cards become absolutely-positioned slides. A continuous
     `pos` (a virtual, unbounded card index) is wrapped modulo N when each card
     is placed, so the deck loops endlessly in both directions with only the
     real cards — no clones, no duplicate radio names / links. Drag scrubs
     `pos`; a flick adds velocity that decays with friction and then snaps onto
     the nearest card, so you can spin the deck and stop wherever you like.
     Habit (the featured card) starts centred, Starter peeks left, Protocol
     right. Tablet/desktop never get the carousel class, so their grid is
     untouched.
     -------------------------------------------------------------------------- */
  setupShopCarousel();

  function setupShopCarousel() {
    const grid  = document.getElementById('shop-grid');
    const cards = grid ? Array.from(grid.querySelectorAll('.shop-card')) : [];
    const N = cards.length;
    if (!grid || N < 2) return;

    /* Drop any carousel wired by a previous /shop/ visit so SPA re-inits don't
       stack window listeners / rAF loops on stale, detached cards. */
    if (window._shopCarouselTeardown) window._shopCarouselTeardown();

    const mq = window.matchMedia('(max-width: 768px)');

    let active = false, raf = null;
    let pos = 0, vel = 0, step = 1, snapTarget = null, lastFrame = 0;
    let dragging = false, moved = false, captured = false, suppressClick = false;
    let startX = 0, startPos = 0, lastX = 0, lastT = 0;

    let centerIndex = cards.findIndex((c) => c.classList.contains('shop-card--featured'));
    if (centerIndex < 0) centerIndex = Math.floor(N / 2);

    const FRICTION = 3.4;    /* velocity decay per second (exponential) */
    const SNAP_VEL = 0.55;   /* |vel| below which we lock onto a card     */
    const SNAP_EASE = 13;    /* how fast pos eases onto the snap target   */

    /* Map any raw offset onto the symmetric range (-N/2, N/2] so each card is
       always drawn on its nearest side of centre — the source of the loop. */
    function wrapSlot(raw) {
      let s = ((raw % N) + N) % N;
      if (s > N / 2) s -= N;
      return s;
    }

    function layout() {
      /* Cards are sized to their (now compacted) CONTENT, not the viewport, so
         the deck stays embedded in the page — the "Wählen Sie Ihr Elixier"
         heading and surrounding page show around it. All slides share the
         tallest card's height so the deck is even. The step is kept a touch
         SMALLER than the card width so each neighbour fills the gutter beside
         the centre card and peeks clearly from the moment the page loads —
         a wider gap pushed them almost fully off-screen (~8px), so they only
         became visible once the deck was dragged. */
      step = cards[0].getBoundingClientRect().width - window.innerWidth * 0.08;
      let max = 0;
      cards.forEach((c) => { c.style.height = 'auto'; });
      cards.forEach((c) => { if (c.offsetHeight > max) max = c.offsetHeight; });
      grid.style.height = max + 'px';
      cards.forEach((c) => { c.style.height = max + 'px'; });
    }

    function render() {
      for (let i = 0; i < N; i++) {
        const slot = wrapSlot(i - pos);
        const dist = Math.abs(slot);
        const card = cards[i];
        card.style.transform =
          'translateX(calc(-50% + ' + (slot * step) + 'px)) scale(' + (1 - dist * 0.13) + ')';
        card.style.opacity = String(Math.max(0, 1 - dist * 0.45));
        card.style.filter = dist > 0.02 ? 'blur(' + (dist * 2) + 'px)' : '';
        card.style.zIndex = String(Math.round(100 - dist * 10));
        card.style.pointerEvents = dist > 1.2 ? 'none' : '';
        card.classList.toggle('is-center', dist < 0.5);
        if (dist > 0.5) card.setAttribute('aria-hidden', 'true');
        else card.removeAttribute('aria-hidden');
      }
    }

    function loop(now) {
      if (!lastFrame) lastFrame = now;
      let dt = (now - lastFrame) / 1000;
      lastFrame = now;
      if (dt > 0.05) dt = 0.05;

      if (!dragging) {
        if (snapTarget === null) {
          pos += vel * dt;
          vel *= Math.exp(-FRICTION * dt);
          if (Math.abs(vel) < SNAP_VEL) snapTarget = Math.round(pos);
        }
        if (snapTarget !== null) {
          pos += (snapTarget - pos) * Math.min(1, SNAP_EASE * dt);
          if (Math.abs(snapTarget - pos) < 0.001) {
            pos = snapTarget; snapTarget = null; vel = 0;
            render(); raf = null; lastFrame = 0;
            return;
          }
        }
      }
      render();
      raf = requestAnimationFrame(loop);
    }

    function startLoop() {
      if (raf == null) { lastFrame = 0; raf = requestAnimationFrame(loop); }
    }

    function onDown(e) {
      if (!active) return;
      dragging = true; moved = false; captured = false;
      startX = lastX = e.clientX; startPos = pos;
      lastT = performance.now(); vel = 0; snapTarget = null;
      if (raf != null) { cancelAnimationFrame(raf); raf = null; }
    }

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 8) {
        moved = true;
        /* Capture only once a horizontal intent is clear, so a vertical page
           scroll (which never sets `moved`) is never hijacked. */
        if (!captured) { try { grid.setPointerCapture(e.pointerId); } catch (_) {} captured = true; }
      }
      pos = startPos - dx / step;
      const t = performance.now();
      const dtt = (t - lastT) / 1000;
      if (dtt > 0) {
        let v = -((e.clientX - lastX) / step) / dtt;
        if (v > 30) v = 30; else if (v < -30) v = -30;
        vel = v;
      }
      lastX = e.clientX; lastT = t;
      render();
    }

    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      if (captured) { try { grid.releasePointerCapture(e.pointerId); } catch (_) {} captured = false; }

      if (moved) {                 /* a drag/flick — coast then snap, swallow the click */
        suppressClick = true;
        startLoop();
        return;
      }
      /* A tap: centre a tapped neighbour; let the centre card click through. */
      const card = e.target && e.target.closest ? e.target.closest('.shop-card') : null;
      const idx = card ? cards.indexOf(card) : -1;
      if (idx >= 0) {
        const slot = wrapSlot(idx - pos);
        if (Math.abs(slot) > 0.01) {
          suppressClick = true;
          snapTarget = pos + slot;
          vel = 0;
          startLoop();
        }
      }
    }

    function onClickCapture(e) {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }

    function onResize() { if (active) { layout(); render(); } }

    function activate() {
      if (active) return;
      active = true;
      grid.classList.add('shop-grid--carousel');
      layout();
      pos = centerIndex; vel = 0; snapTarget = null;
      render();
      grid.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      grid.addEventListener('click', onClickCapture, true);
    }

    function deactivate() {
      if (!active) return;
      active = false;
      if (raf != null) { cancelAnimationFrame(raf); raf = null; }
      grid.classList.remove('shop-grid--carousel');
      grid.style.height = '';
      cards.forEach((c) => {
        c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = '';
        c.style.height = ''; c.style.pointerEvents = ''; c.style.filter = '';
        c.classList.remove('is-center');
        c.removeAttribute('aria-hidden');
      });
      grid.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      grid.removeEventListener('click', onClickCapture, true);
    }

    function onMqChange() { if (mq.matches) activate(); else deactivate(); }

    if (mq.addEventListener) mq.addEventListener('change', onMqChange);
    else mq.addListener(onMqChange);                 /* legacy Safari */
    window.addEventListener('resize', onResize);

    window._shopCarouselTeardown = function () {
      deactivate();
      if (mq.removeEventListener) mq.removeEventListener('change', onMqChange);
      else mq.removeListener(onMqChange);
      window.removeEventListener('resize', onResize);
      window._shopCarouselTeardown = null;
    };

    if (mq.matches) activate();
  }

};