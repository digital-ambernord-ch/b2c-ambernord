/* ==========================================================================
   THE MASTER BOX — window.initTheMasterBox()
   Called by router.js after /pages/the-master-box.html is injected into #app.
   ========================================================================== */

window.initTheMasterBox = async function () {

  /* ------------------------------------------------------------------------
     I18N — fetch /data/[lang]/the-master-box.json, fallback to 'de'.
     ------------------------------------------------------------------------ */
  const lang = window.getLang();
  const data = await window.loadI18n(lang, 'the-master-box');

  /* ------------------------------------------------------------------------
     RENDER INCLUDED LIST — bullet list inside the glass card.
     Each item is HTML so innerHTML is intentional.
     ------------------------------------------------------------------------ */
  function renderIncludedList(items) {
    const container = document.getElementById('master-box-included-list');
    if (!container || !Array.isArray(items)) return;
    container.innerHTML = items.map((item) => `
      <li class="master-box-list__item">
        <span class="master-box-list__bullet" aria-hidden="true">&bull;</span>
        <span class="master-box-list__text">${item}</span>
      </li>
    `).join('');
  }

  /* ------------------------------------------------------------------------
     RENDER THUMBNAILS — buttons that swap the main image source.
     First thumbnail starts active; alt text comes from JSON.
     ------------------------------------------------------------------------ */
  function renderThumbnails(images) {
    const container = document.getElementById('master-box-thumbs');
    if (!container || !Array.isArray(images)) return;

    const base = 'https://res.cloudinary.com/dt6ksxuqf/image/upload';
    const tx = (id, w) => `${base}/f_auto,q_auto,w_${w}/${id}`;
    const buildSrcset = (id) => [
      `${tx(id, 400)} 400w`,
      `${tx(id, 800)} 800w`,
      `${tx(id, 1200)} 1200w`,
      `${tx(id, 1600)} 1600w`
    ].join(', ');

    container.innerHTML = images.map((img, i) => `
      <button
        type="button"
        class="master-box-thumb${i === 0 ? ' master-box-thumb--active' : ''}"
        role="tab"
        aria-selected="${i === 0 ? 'true' : 'false'}"
        data-main-src="${tx(img.cloudinaryId, 800)}"
        data-main-srcset="${buildSrcset(img.cloudinaryId)}"
        data-main-alt="${img.alt || ''}">
        <img
          src="${tx(img.cloudinaryId, 150)}"
          alt="${img.thumbAlt || img.alt || ''}"
          width="75" height="75"
          loading="lazy" decoding="async">
      </button>
    `).join('');
  }

  /* ------------------------------------------------------------------------
     GALLERY INTERACTIVITY — click a thumb, swap main image, mark active.
     Single delegated click handler on the thumbs container.
     ------------------------------------------------------------------------ */
  function initGallery() {
    const main = document.getElementById('master-box-main-img');
    const thumbs = document.getElementById('master-box-thumbs');
    if (!main || !thumbs) return;

    thumbs.addEventListener('click', (e) => {
      const btn = e.target.closest('.master-box-thumb');
      if (!btn) return;

      const newSrc = btn.getAttribute('data-main-src');
      const newSrcset = btn.getAttribute('data-main-srcset');
      const newAlt = btn.getAttribute('data-main-alt');

      if (newSrc) main.src = newSrc;
      if (newSrcset) main.srcset = newSrcset;
      if (newAlt) main.alt = newAlt;

      thumbs.querySelectorAll('.master-box-thumb').forEach((t) => {
        t.classList.remove('master-box-thumb--active');
        t.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('master-box-thumb--active');
      btn.setAttribute('aria-selected', 'true');
    });
  }

  /* ------------------------------------------------------------------------
     ENTRANCE WILL-CHANGE — added during animation, removed after 1200ms.
     ------------------------------------------------------------------------ */
  function initEntranceWillChange() {
    const root = document.querySelector('.master-box-page-container');
    if (!root) return;
    root.classList.add('animating');
    setTimeout(() => root.classList.remove('animating'), 1300);
  }

  /* ------------------------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver, disconnects each target on reveal.
     ------------------------------------------------------------------------ */
  function initScrollReveal() {
    const targets = [...document.querySelectorAll(
      '.master-box-info__heading, .master-box-info__intro, .master-box-info__subheading, .master-box-info__body, .master-box-card, .master-box-cta, .master-box-abo, .master-box-shipping'
    )].filter(Boolean);

    targets.forEach((el, i) => {
      el.classList.add('page-reveal');
      el.style.transitionDelay = `${i * 0.06}s`;
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    targets.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     BOOT — order matters: render before observing, gallery after thumbs.
     ------------------------------------------------------------------------ */
  renderIncludedList(data?.product?.included);
  renderThumbnails(data?.images);
  initGallery();
  initEntranceWillChange();
  initScrollReveal();
};
