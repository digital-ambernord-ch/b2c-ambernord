/* =========================================================================
   AMBERNORD — LANDING PAGE JS
   js/landing.js
   GSAP hero · Floating cards · Scroll reveals · Exclusive bg · Lightbox · Accordion
   ========================================================================= */

window.initLanding = async function () {

  if (typeof window.loadI18n === 'function') {
    try { await window.loadI18n(window.getLang(), 'home'); } catch {}
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[Landing] GSAP not available yet — retrying...');
    setTimeout(window.initLanding, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* =========================================================================
     RESPECT REDUCED MOTION — skip all animations if user prefers it
     ========================================================================= */

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     TOPBAR BIO BADGE — landing-only swap
     While the hero EU bio leaf is on screen we hide the small badge that
     normally sits on the logo, so only ONE bio mark is visible. Once the user
     scrolls past the hero (and the hero leaf has faded), we remove the class
     and the topbar badge "lands" with a bouncy pop-in (CSS transition).
     The router clears `landing-hero-active` on every navigation, so on every
     other page the badge is always present.
     ========================================================================= */

  document.documentElement.classList.add('landing-hero-active');

  /* Mobile: 80px works perfectly — kept as-is. Desktop fires a little later so
     the hero EU leaf has had time to fade. Pixel values only — % in the second
     token of a ScrollTrigger start string is ambiguous and can throw, which
     would abort the rest of initLanding and break the hero animation. */
  const isDesktop      = window.matchMedia('(min-width: 992px)').matches;
  const badgeThreshold = isDesktop ? 220 : 80;

  ScrollTrigger.create({
    trigger: '.scroll-track',
    start:   'top top-=' + badgeThreshold,
    onEnter:     function () { document.documentElement.classList.remove('landing-hero-active'); },
    onLeaveBack: function () { document.documentElement.classList.add('landing-hero-active'); }
  });

  /* Hard reload at non-zero scroll: ScrollTrigger callbacks only fire on
     transitions, so sync the initial state once. */
  if (window.scrollY > badgeThreshold) {
    document.documentElement.classList.remove('landing-hero-active');
  }

  /* =========================================================================
     HERO SCROLL ANIMATION
     Desktop: hero card scales down while floating image cards appear,
     then everything exits upward.
     Mobile: simplified version, no floating cards.
     ========================================================================= */

  const mm = gsap.matchMedia();

  /* Vertical-center offset for the shrunk hero. .sticky-viewport keeps
     align-items: flex-start (so the full-size hero matches the 8px gap that
     subpages use under the topbar), but the SHRUNK rectangle should sit in
     the middle of the pinned area with equal space top & bottom. We compute
     the y translation from the live --nav-height / --aktion-height tokens so
     it stays correct whether the aktion bar is visible or dismissed. */
  function computeHeroCenterY(heroVh) {
    const rootStyle = getComputedStyle(document.documentElement);
    const navH    = parseFloat(rootStyle.getPropertyValue('--nav-height'))    || 80;
    const aktionH = parseFloat(rootStyle.getPropertyValue('--aktion-height')) || 0;
    const stickyH = window.innerHeight - navH - aktionH - 8;
    const heroH   = window.innerHeight * (heroVh / 100);
    return Math.max(0, (stickyH - heroH) / 2);
  }

  mm.add('(min-width: 992px)', function () {
    if (reducedMotion) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.scroll-track',
        start:   'top top',
        end:     'bottom bottom',
        scrub:   1.5,
        invalidateOnRefresh: true
      }
    });

    /* Phase 1: Hero shrinks AND drops to vertical centre of the pinned area. */
    tl.to('.scalable-hero',     { width: '380px', height: '55vh', borderRadius: '28px',
                                  y: function () { return computeHeroCenterY(55); },
                                  duration: 3, ease: 'power2.inOut' }, 0)
      .to('#heroText',          { opacity: 0, duration: 1, ease: 'power1.in' }, 0.3)
      .to('#ambernordHeroShade',{ opacity: 0, duration: 1, ease: 'none' }, 0.8)

    /* Phase 2: 6 cards pop in around the shrunk hero */
      .fromTo('.float-img',     { scale: 0.1, opacity: 0 },
                                { scale: 1, opacity: 1, duration: 1.5, stagger: 0.12, ease: 'back.out(1.4)' }, 3.2)

    /* Phase 3: Cards exit upward fast */
      .to('.float-img',         { y: '-100vh', duration: 2.5, ease: 'power2.in' }, 5.2)

    /* Phase 4: Hero rises another 20vh from its centred resting point */
      .to('.scalable-hero',     { y: function () { return computeHeroCenterY(55) - window.innerHeight * 0.2; },
                                  duration: 2.5, ease: 'power2.in' }, 5.0);
  });

  mm.add('(max-width: 991px)', function () {
    if (reducedMotion) return;

    const scrollTrack = document.getElementById('scrollTrack');
    if (scrollTrack) scrollTrack.style.height = '120vh';

    const tlMobile = gsap.timeline({
      scrollTrigger: {
        trigger: '.scroll-track',
        start:   'top top',
        end:     'bottom bottom',
        scrub:   1,
        invalidateOnRefresh: true
      }
    });

    tlMobile
      .to('.scalable-hero',     { width: '85vw', height: '50vh', borderRadius: '20px',
                                  y: function () { return computeHeroCenterY(50); },
                                  duration: 3 }, 0)
      .to('#heroText',          { opacity: 0, duration: 1 }, 1)
      .to('#ambernordHeroShade',{ opacity: 0, duration: 1.5 }, 1.5)
      .to('.scalable-hero',     { y: function () { return computeHeroCenterY(50) - window.innerHeight * 0.1; },
                                  duration: 1.5, ease: 'power1.in' }, 3);
  });

  /* =========================================================================
     LANDING-PAGE STICKY NAV
     Appears after the hero section has scrolled past the viewport.
     ========================================================================= */

  const landingStickyNav     = document.getElementById('landingStickyNav');
  const landingBewertungChip = document.getElementById('landingBewertungChip');
  const scrollTrack          = document.getElementById('scrollTrack');

  /* Sticky nav (top) and the bewertung chip (bottom-left) share the same
     trigger — both appear once the hero has scrolled out of view. One observer
     toggles both so we don't waste an extra IntersectionObserver. */
  if (scrollTrack && (landingStickyNav || landingBewertungChip)) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const visible = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        if (landingStickyNav)     landingStickyNav.classList.toggle('is-visible', visible);
        if (landingBewertungChip) landingBewertungChip.classList.toggle('is-visible', visible);
      });
    }, { threshold: 0 });
    observer.observe(scrollTrack);
  }

  const stickyNavBtn = document.getElementById('landingStickyNavBtn');
  if (stickyNavBtn) {
    stickyNavBtn.addEventListener('click', function () {
      const shopSection = document.getElementById('shop');
      if (!shopSection) return;
      const navHeight = document.getElementById('siteNav')?.offsetHeight || 80;
      const targetY   = shopSection.getBoundingClientRect().top + window.scrollY - navHeight - 160;
      if (typeof window.smoothScrollTo === 'function') {
        window.smoothScrollTo(targetY);
      } else {
        shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* =========================================================================
     EXCLUSIVE SECTION BACKGROUND FADE
     Background image fades in/out as the section enters and leaves.
     ========================================================================= */

  const exclusiveBg = document.getElementById('exclusiveBg');

  if (exclusiveBg && !reducedMotion) {
    gsap.set(exclusiveBg, { opacity: 0 });

    const bgTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#exclusiveSection',
        start:   'top 75%',
        end:     'bottom 55%',
        scrub:   1
      }
    });

    bgTl
      .to(exclusiveBg, { opacity: 1, ease: 'power1.inOut', duration: 2 })
      .to(exclusiveBg, { opacity: 1, duration: 6 })
      .to(exclusiveBg, { opacity: 0, ease: 'power1.inOut', duration: 2 });
  }

  /* =========================================================================
     GSAP SCROLL REVEALS
     Elements with .gsap-reveal fade up on scroll entry.
     ========================================================================= */

  if (!reducedMotion) {
    document.querySelectorAll('.gsap-reveal').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger:      el,
            start:        'top 85%',
            toggleActions: 'play none none reverse'
          },
          opacity:  1,
          y:        0,
          duration: 1,
          ease:     'power2.out'
        }
      );
    });
  }

  /* =========================================================================
     YOUTUBE FACADE — lazy-load iframe on thumbnail click
     ========================================================================= */

  const ytFacade = document.getElementById('ytFacade');
  if (ytFacade) {
    ytFacade.addEventListener('click', function () {
      const iframe = document.createElement('iframe');
      iframe.src             = 'https://www.youtube-nocookie.com/embed/j8lfT9kNGK0?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1';
      iframe.title           = 'AmberNord Sanddorn-Ritual Video';
      iframe.loading         = 'lazy';
      iframe.allow           = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy  = 'strict-origin-when-cross-origin';
      iframe.style.cssText   = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
      ytFacade.parentNode.replaceChild(iframe, ytFacade);
    });
  }

  /* =========================================================================
     LIGHTBOX — desktop gallery image viewer
     ========================================================================= */

  const galleryImgs   = document.querySelectorAll('.mini-gallery-item img');
  const lightbox      = document.getElementById('gallery-lightbox');
  const lightboxClose = document.getElementById('lightbox-close');

  if (galleryImgs.length && lightbox) {

    galleryImgs.forEach(function (img) {
      img.addEventListener('click', function (e) {
        if (window.innerWidth < 992) return;
        e.preventDefault();

        const highResSrc = img.src
          .replace(/w_\d+/, 'w_1200')
          .replace(/w_320/, 'w_1200')
          .replace(/w_400/, 'w_1200');

        let lightboxImg = document.getElementById('lightbox-img');
        if (!lightboxImg) {
          lightboxImg    = document.createElement('img');
          lightboxImg.id = 'lightbox-img';
          lightboxImg.className = 'lightbox-image';
          lightboxImg.alt = 'Vergössertes Bild';
          lightbox.appendChild(lightboxImg);
        }

        lightboxImg.src = highResSrc;
        lightbox.classList.add('is-active');
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('is-active');
      const img = document.getElementById('lightbox-img');
      if (img) setTimeout(function () { img.src = ''; }, 300);
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-active')) closeLightbox();
    });
  }

};
