/* =========================================================================
   AMBERNORD — LANDING PAGE JS
   js/landing.js
   GSAP hero · Floating cards · Scroll reveals · Exclusive bg · Lightbox · Accordion
   ========================================================================= */

window.initLanding = function () {

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
     HERO SCROLL ANIMATION
     Desktop: hero card scales down while floating image cards appear,
     then everything exits upward.
     Mobile: simplified version, no floating cards.
     ========================================================================= */

  const mm = gsap.matchMedia();

  mm.add('(min-width: 992px)', function () {
    if (reducedMotion) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.scroll-track',
        start:   'top top',
        end:     'bottom bottom',
        scrub:   1.5
      }
    });

    /* Phase 1: Hero shrinks to center — y:0 explicitly keeps it pinned in place */
    tl.to('.scalable-hero',     { width: '380px', height: '55vh', borderRadius: '28px', y: 0, duration: 3, ease: 'power2.inOut' }, 0)
      .to('#heroText',          { opacity: 0, duration: 1, ease: 'power1.in' }, 0.3)
      .to('#ambernordHeroShade',{ opacity: 0, duration: 1, ease: 'none' }, 0.8)

    /* Phase 2: 6 cards pop in around the shrunk hero */
      .fromTo('.float-img',     { scale: 0.1, opacity: 0 },
                                { scale: 1, opacity: 1, duration: 1.5, stagger: 0.12, ease: 'back.out(1.4)' }, 3.2)

    /* Phase 3: Cards exit upward fast */
      .to('.float-img',         { y: '-140vh', duration: 2.5, ease: 'power2.in' }, 5.2)

    /* Phase 4: Hero starts rising when bottom cards reach its lower edge — cards still visible */
      .to('.scalable-hero',     { y: '-70vh', duration: 2.0, ease: 'power2.in' }, 5.0);
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
        scrub:   1
      }
    });

    tlMobile
      .to('.scalable-hero',     { width: '85vw', height: '50vh', borderRadius: '20px', duration: 3 }, 0)
      .to('#heroText',          { opacity: 0, duration: 1 }, 1)
      .to('#ambernordHeroShade',{ opacity: 0, duration: 1.5 }, 1.5)
      .to('.scalable-hero',     { y: '-10vh', duration: 1.5, ease: 'power1.in' }, 3);
  });

  /* =========================================================================
     LANDING-PAGE STICKY NAV
     Appears after the hero section has scrolled past the viewport.
     ========================================================================= */

  const landingStickyNav = document.getElementById('landingStickyNav');
  const scrollTrack      = document.getElementById('scrollTrack');

  if (landingStickyNav && scrollTrack) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          landingStickyNav.classList.add('is-visible');
        } else {
          landingStickyNav.classList.remove('is-visible');
        }
      });
    }, { threshold: 0 });
    observer.observe(scrollTrack);
  }

  const stickyNavBtn = document.getElementById('landingStickyNavBtn');
  if (stickyNavBtn) {
    stickyNavBtn.addEventListener('click', function () {
      const shopSection = document.getElementById('shop');
      if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
     ACCORDION — editorial bento cards
     ========================================================================= */

  window.toggleEditorialCard = function (triggerEl) {
    const isActive  = triggerEl.classList.contains('is-active');
    const content   = triggerEl.nextElementSibling;

    triggerEl.classList.toggle('is-active', !isActive);
    content.classList.toggle('is-open', !isActive);
  };

  /* =========================================================================
     YOUTUBE FACADE — lazy-load iframe on thumbnail click
     ========================================================================= */

  const ytFacade = document.getElementById('ytFacade');
  if (ytFacade) {
    ytFacade.addEventListener('click', function () {
      const iframe = document.createElement('iframe');
      iframe.src         = 'https://www.youtube.com/embed/j8lfT9kNGK0?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1';
      iframe.frameBorder = '0';
      iframe.allow       = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.position = 'absolute';
      iframe.style.top  = '0';
      iframe.style.left = '0';
      iframe.style.width  = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
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
