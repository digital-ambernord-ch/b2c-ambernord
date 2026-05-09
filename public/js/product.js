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

  if (!mainImage || !thumbnails.length) return;

  let currentIndex = 0;
  let touchStartX  = 0;
  let touchEndX    = 0;

  function updateMainImage(index) {
    if (index < 0) index = thumbnails.length - 1;
    if (index >= thumbnails.length) index = 0;

    currentIndex = index;

    const thumb = thumbnails[currentIndex];

    mainImage.style.opacity = '0';

    setTimeout(function () {
      if (thumb.dataset.mainSrc)    mainImage.src    = thumb.dataset.mainSrc;
      if (thumb.dataset.mainSrcset) mainImage.srcset = thumb.dataset.mainSrcset;
      mainImage.style.opacity = '1';
    }, 150);

    thumbnails.forEach(function (t) {
      t.classList.remove('active-thumb');
      t.style.borderColor = 'rgba(255,255,255,0.1)';
    });

    thumb.classList.add('active-thumb');
    thumb.style.borderColor = '#EDA323';

    if (window.innerWidth <= 991) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  thumbnails.forEach(function (thumb, index) {
    thumb.addEventListener('click', function () {
      updateMainImage(index);
    });
  });

  if (swipeContainer) {
    swipeContainer.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    swipeContainer.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      const delta = touchEndX - touchStartX;

      if (Math.abs(delta) > 50) {
        updateMainImage(currentIndex + (delta < 0 ? 1 : -1));
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
