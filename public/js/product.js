/* =========================================================================
   AMBERNORD — PRODUCT PAGE JS
   js/product.js
   Gallery thumbnails · Swipe gestures · Image switching
   Shared across The Starter, The Habit, The Protocol
   ========================================================================= */

window.initProduct = async function () {

  const container = document.querySelector('.product-page-container');
  const productKey = container ? container.getAttribute('data-product') : null;
  if (productKey && typeof window.loadI18n === 'function') {
    try { await window.loadI18n(window.getLang(), productKey); } catch {}
  }

  /* =========================================================================
     GALLERY — thumbnail click + mobile swipe
     ========================================================================= */

  const mainImage     = document.getElementById('main-product-image');
  const swipeContainer = document.getElementById('swipe-container');
  const thumbnails    = document.querySelectorAll('.thumb-container img');
  const voucherBadge  = document.getElementById('voucher-badge');

  if (!mainImage || !thumbnails.length) return;

  let currentIndex = 0;
  let touchStartX  = 0;
  let touchEndX    = 0;

  /* Ensure smooth opacity + transform on image transitions. */
  mainImage.style.transition = 'opacity 0.32s var(--ease-smooth, ease-out), transform 0.32s var(--ease-smooth, ease-out)';
  mainImage.style.willChange = 'opacity, transform';

  function updateMainImage(index, slideFrom) {
    if (index < 0) index = thumbnails.length - 1;
    if (index >= thumbnails.length) index = 0;

    currentIndex = index;

    const thumb = thumbnails[currentIndex];
    const direction = slideFrom === 'right' ? 24 : slideFrom === 'left' ? -24 : 0;

    mainImage.style.opacity   = '0';
    mainImage.style.transform = `translateX(${direction}px)`;

    /* Swap src after a single frame so the fade-out is visible. */
    requestAnimationFrame(function () {
      if (thumb.dataset.mainSrc)    mainImage.src    = thumb.dataset.mainSrc;
      if (thumb.dataset.mainSrcset) mainImage.srcset = thumb.dataset.mainSrcset;

      const fadeIn = function () {
        mainImage.style.transform = `translateX(${-direction * 0.5}px)`;
        requestAnimationFrame(function () {
          mainImage.style.opacity   = '1';
          mainImage.style.transform = 'translateX(0)';
        });
      };

      if (mainImage.complete && mainImage.naturalWidth > 0) {
        fadeIn();
      } else {
        mainImage.addEventListener('load', fadeIn, { once: true });
      }
    });

    thumbnails.forEach(function (t) {
      t.classList.remove('active-thumb');
      t.style.borderColor = 'rgba(255,255,255,0.1)';
    });

    thumb.classList.add('active-thumb');
    thumb.style.borderColor = '#EDA323';

    if (voucherBadge) {
      voucherBadge.style.display = index === 0 ? 'block' : 'none';
    }

    if (window.innerWidth <= 991) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  thumbnails.forEach(function (thumb, index) {
    thumb.addEventListener('click', function () {
      const dir = index > currentIndex ? 'right' : index < currentIndex ? 'left' : null;
      updateMainImage(index, dir);
    });
  });

  /* =========================================================================
     SWIPE — finger follows image during touchmove for premium fluidity, then
     snaps to next/prev or springs back on release.
     ========================================================================= */
  if (swipeContainer) {
    let isDragging = false;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 60;        /* px to commit to next image */
    const RESISTANCE = 0.45;           /* dampen translation for premium feel */

    swipeContainer.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      isDragging  = true;
      mainImage.style.transition = 'none';
      mainImage.style.willChange = 'transform';
    }, { passive: true });

    swipeContainer.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      /* If user is scrolling vertically, abort horizontal drag. */
      if (Math.abs(dy) > Math.abs(dx) * 1.4) {
        isDragging = false;
        mainImage.style.transition = '';
        mainImage.style.transform  = 'translateX(0)';
        return;
      }
      mainImage.style.transform = 'translateX(' + (dx * RESISTANCE) + 'px)';
    }, { passive: true });

    swipeContainer.addEventListener('touchend', function (e) {
      if (!isDragging) return;
      isDragging = false;
      touchEndX  = e.changedTouches[0].screenX;
      const delta = touchEndX - touchStartX;

      mainImage.style.transition = 'opacity 0.32s var(--ease-smooth, ease-out), transform 0.32s var(--ease-smooth, ease-out)';

      if (Math.abs(delta) > SWIPE_THRESHOLD) {
        updateMainImage(currentIndex + (delta < 0 ? 1 : -1), delta < 0 ? 'right' : 'left');
      } else {
        /* Spring back to centre. */
        mainImage.style.transform = 'translateX(0)';
      }
    }, { passive: true });

    swipeContainer.addEventListener('touchcancel', function () {
      isDragging = false;
      mainImage.style.transition = 'transform 0.32s var(--ease-smooth, ease-out)';
      mainImage.style.transform  = 'translateX(0)';
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
