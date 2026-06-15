/* =========================================================================
   AMBERNORD — PRODUCT PAGE JS
   js/product.js
   Gallery thumbnails · Swipe gestures · Image switching
   Shared across The Starter, The Habit, The Protocol
   ========================================================================= */

window.initProduct = async function () {

  const container = document.querySelector('.product-page-container');
  const productKey = container ? container.getAttribute('data-product') : null;
  let i18nData = null;
  if (productKey && typeof window.loadI18n === 'function') {
    try { i18nData = await window.loadI18n(window.getLang(), productKey); } catch {}
  }

  /* =========================================================================
     SECTION-NAV — kinetic scroll-spy rail (js/section-nav.js). Sections listed
     in document order; short single-word labels come from i18nData.sectionNav
     per locale. The component skips any id absent from the DOM, so this stays
     safe even on pages without a gallery (it runs before the early return
     below). The router tears the rail down on every nav.
     ========================================================================= */

  if (typeof window.initSectionNav === 'function' && i18nData && i18nData.sectionNav) {
    const navItems = i18nData.sectionNav.items || {};
    window.initSectionNav({
      ariaLabel: i18nData.sectionNav.aria || 'Sections',
      sections: [
        { id: 'product-overview', label: navItems['product-overview'] },
        { id: 'product-details',  label: navItems['product-details'] },
        { id: 'related',          label: navItems['related'] }
      ]
    });
  }

  /* =========================================================================
     PURCHASE TOGGLE — Einmalkauf ↔ Abo (The Habit + The Protocol)
     One CTA switches label and Stripe href with the selected mode.
     Default is the one-time purchase.
     ========================================================================= */

  const purchaseToggle = document.querySelector('[data-purchase-toggle]');
  const buyCta         = document.querySelector('[data-buy-cta]');

  if (purchaseToggle && buyCta) {
    const purchase = (i18nData && i18nData.info && i18nData.info.purchase) || {};

    function applyMode(mode) {
      const isAbo = mode === 'abo';
      const href  = isAbo ? (purchase.aboHref || buyCta.dataset.aboHref)
                          : (purchase.oneTimeHref || buyCta.dataset.onceHref);
      const label = isAbo ? purchase.ctaAbo : purchase.ctaOneTime;
      if (href)  buyCta.setAttribute('href', href);
      if (label) buyCta.textContent = label;
    }

    purchaseToggle.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'purchase-mode') applyMode(e.target.value);
    });

    const checked = purchaseToggle.querySelector('input[name="purchase-mode"]:checked');
    applyMode(checked ? checked.value : 'once');
  }

  /* =========================================================================
     GALLERY — thumbnail click + mobile swipe
     ========================================================================= */

  const mainImage      = document.getElementById('main-product-image');
  const swipeContainer = document.getElementById('swipe-container');
  const thumbnails     = document.querySelectorAll('.thumb-container img');

  if (!mainImage || !thumbnails.length) return;

  /* Bestseller badge (only present on The Habit) lives inside the image box and
     must show on the FIRST image (the bottle) only — it's hidden on every
     other gallery shot. */
  const galleryBadge = swipeContainer ? swipeContainer.querySelector('.product-badge') : null;

  let currentIndex = 0;
  let touchStartX  = 0;
  let swapToken    = 0;     /* guards against stale swaps when swiping fast */

  /* Scroll the active thumbnail to the centre of the THUMB STRIP only (mobile),
     scrolling that element horizontally — never the page — so switching images
     no longer makes the viewport jump. */
  function centerThumb(thumb) {
    const strip = thumb.parentElement;
    if (!strip || strip.scrollWidth <= strip.clientWidth) return;
    const target = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }

  function setMainImage(index, dir) {
    const prev = currentIndex;
    if (index < 0) index = thumbnails.length - 1;
    if (index >= thumbnails.length) index = 0;
    if (dir === undefined) dir = index === prev ? 0 : (index > prev ? 1 : -1);

    currentIndex = index;
    const thumb     = thumbnails[currentIndex];
    const newSrc    = thumb.dataset.mainSrc || thumb.src;
    const newSrcset = thumb.dataset.mainSrcset || '';

    if (galleryBadge) galleryBadge.classList.toggle('badge-hidden', currentIndex !== 0);

    thumbnails.forEach(function (t) {
      t.classList.remove('active-thumb');
      t.style.borderColor = 'rgba(255,255,255,0.1)';
    });
    thumb.classList.add('active-thumb');
    thumb.style.borderColor = '#EDA323';
    centerThumb(thumb);

    /* Decode-synced crossfade: fade the current image out while the next one is
       preloaded + decoded off-screen, then swap (no blank flash) and slide it
       in from the swipe direction. */
    const token = ++swapToken;
    mainImage.style.opacity = '0';

    const decoded = (function () {
      const pre = new Image();
      if (newSrcset) pre.srcset = newSrcset;
      pre.src = newSrc;
      if (pre.decode) return pre.decode().catch(function () {});
      return new Promise(function (res) {
        if (pre.complete) res();
        else { pre.onload = res; pre.onerror = res; }
      });
    })();
    const faded = new Promise(function (res) { setTimeout(res, 170); });

    Promise.all([decoded, faded]).then(function () {
      if (token !== swapToken) return;            /* a newer swap won — bail */
      if (newSrcset) mainImage.srcset = newSrcset;
      else mainImage.removeAttribute('srcset');
      mainImage.src = newSrc;

      mainImage.style.transition = 'none';
      mainImage.style.transform  = 'translateX(' + (dir * 18) + 'px)';
      void mainImage.offsetWidth;                 /* commit the start offset */
      mainImage.style.transition = '';
      requestAnimationFrame(function () {
        mainImage.style.opacity   = '1';
        mainImage.style.transform = 'translateX(0)';
      });
    });
  }

  thumbnails.forEach(function (thumb, index) {
    thumb.addEventListener('click', function () { setMainImage(index); });
  });

  if (swipeContainer) {
    swipeContainer.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    swipeContainer.addEventListener('touchend', function (e) {
      const delta = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(delta) > 40) {
        const dir = delta < 0 ? 1 : -1;
        setMainImage(currentIndex + dir, dir);
      }
    }, { passive: true });
  }

  /* =========================================================================
     RELATED PRODUCTS — update hrefs to use internal router
     (dashnexpages.net URLs in the HTML are replaced here)
     ========================================================================= */

  document.querySelectorAll('.ambernord-related-grid a, .ambernord-product-card').forEach(function (el) {
    const href = el.getAttribute('href') || '';

    if (href.includes('starter')) {
      el.setAttribute('href', '/shop/starter/');
      el.setAttribute('data-link', '');
    } else if (href.includes('habit')) {
      el.setAttribute('href', '/shop/habit/');
      el.setAttribute('data-link', '');
    } else if (href.includes('protocol')) {
      el.setAttribute('href', '/shop/protocol/');
      el.setAttribute('data-link', '');
    }
  });

  if (typeof window.attachLinkListeners === 'function') {
    window.attachLinkListeners();
  }

};
