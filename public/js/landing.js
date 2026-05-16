/* =========================================================================
   AMBERNORD — LANDING PAGE JS
   js/landing.js
   GSAP hero · Floating cards · Scroll reveals · Exclusive bg · Lightbox · Accordion
   ========================================================================= */

window.initLanding = async function () {

  if (typeof window.loadI18n === 'function') {
    try { await window.loadI18n(window.getLang(), 'home'); } catch {}
  }

  /* =========================================================================
     LQIP IMAGE SWAP — for the Manifest + Ritual bg images.
     The tiny placeholder paints instantly via the browser's normal img
     fetch (sync decode + high priority); the full-quality image is also
     fetched immediately (loading=eager) but takes longer to arrive. When
     it's ready we flip the `.is-loaded` class and CSS fades it in over
     the placeholder. If the full image is already in cache (back-nav),
     img.complete is true and we add the class straight away.
     ========================================================================= */
  document.querySelectorAll('.nature-hero-bg__full').forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', function () { img.classList.add('is-loaded'); }, { once: true });
    }
  });

  /* =========================================================================
     TAGLINE AUTO-FIT — never wrap on mobile.
     "100% RACCOLTO A MANO | SPREMUTO A FREDDO | CERTIFICATO BIO" (IT, longest)
     overflows the hero column on narrow phones. Rather than letting the line
     wrap, we shrink the font + letter-spacing until everything fits on a
     single line. Runs once on init (after i18n applies the localized text)
     and on viewport resize. Reverts to default sizing on desktop.
     ========================================================================= */

  function fitTagline() {
    const tagline = document.querySelector('.tagline-part-1');
    const heroContent = document.getElementById('ambernord-hero-content');
    if (!tagline || !heroContent) return;

    /* Desktop: clear inline styles so the stylesheet's 11px / 4px takes over */
    if (window.innerWidth > 991) {
      tagline.style.fontSize = '';
      tagline.style.letterSpacing = '';
      return;
    }

    /* Reset to mobile default before measuring; iterate down 0.5px at a time
       until the inline content (white-space:nowrap) no longer overflows the
       hero content area. Floor at 6px so it never becomes unreadable. */
    let fontPx = 10;
    let lsPx   = 1.5;
    tagline.style.fontSize      = fontPx + 'px';
    tagline.style.letterSpacing = lsPx   + 'px';

    const cs = getComputedStyle(heroContent);
    const padX = (parseFloat(cs.paddingLeft)  || 0)
               + (parseFloat(cs.paddingRight) || 0);
    const available = heroContent.clientWidth - padX - 4;

    while (tagline.scrollWidth > available && fontPx > 6) {
      fontPx -= 0.5;
      lsPx    = Math.max(0.2, lsPx - 0.15);
      tagline.style.fontSize      = fontPx + 'px';
      tagline.style.letterSpacing = lsPx   + 'px';
    }
  }

  fitTagline();
  let _taglineResizeT;
  window.addEventListener('resize', function () {
    clearTimeout(_taglineResizeT);
    _taglineResizeT = setTimeout(fitTagline, 100);
  });

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
     PRODUCT CARDS — pinned exit animation
     Desktop: all three cards fit in the viewport, so we pin the WHOLE
     #ritual-products section and animate them out sequentially, then
     evaporate the frame.
     Mobile: cards are tall (vertical stack), so all three never fit at
     once. We pin EACH CARD individually — it locks at the top, plays its
     fly-out, releases, and the next card scrolls up into the same spot.
     CSS transform-transition is cleared so GSAP scrub isn't smoothed twice
     (hover translateY becomes instant — minor cost).
     ========================================================================= */

  function attachProductCardsExitDesktop(pinDuration) {
    if (reducedMotion) return;

    const section = document.getElementById('ritual-products');
    if (!section) return;

    const productCards = section.querySelectorAll('.premium-product-card');
    if (productCards.length < 3) return;

    const [starter, habit, protocol] = productCards;
    productCards.forEach(function (c) { c.style.transition = 'border-color var(--t-base) ease'; });

    const tl = gsap.timeline({ scrollTrigger: pinScrollTrigger(section, pinDuration) });

    /* Timeline phases (positions in the 0..1 pin range):
         0.00 → 0.12  settle pause  (block locks, brief beat, no motion)
         0.12 → 0.78  card exits     (staggered fly-outs)
         0.78 → 0.95  evaporate      (whole section fades + scales down)
         0.95 → 1.00  empty hold     (clean handoff to Manifest below)         */

    tl.to(starter,  { xPercent: -160, opacity: 0, ease: 'power2.in', duration: 0.30 }, 0.12)
      .to(habit,    { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.30 }, 0.30)
      .to(protocol, { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.30 }, 0.48)
      .to(section,  { opacity:  0, scale: 0.95, ease: 'power1.in', duration: 0.17 }, 0.78);
  }

  function attachProductCardsExitMobile(pinDuration) {
    if (reducedMotion) return;

    const section = document.getElementById('ritual-products');
    if (!section) return;

    const productCards = section.querySelectorAll('.premium-product-card');
    if (productCards.length < 3) return;

    const [starter, habit, protocol] = productCards;
    productCards.forEach(function (c) { c.style.transition = 'border-color var(--t-base) ease'; });

    /* Whole #ritual-products section pins (heading "Wählen Sie Ihr Protokoll"
       stays visible the entire time). Inside, the cards are tall and only
       one fits at a time — so as each card exits, the cards below it
       translateY up to fill the freed position INSTANTLY. No black gap
       between cards. */
    const margin = function () {
      return parseFloat(getComputedStyle(starter).marginBottom) || 40;
    };
    const card1Lift = function () { return -(starter.offsetHeight + margin()); };
    const card2Lift = function () { return -(starter.offsetHeight + habit.offsetHeight + 2 * margin()); };

    const tl = gsap.timeline({ scrollTrigger: pinScrollTrigger(section, pinDuration) });

    /* Timeline (positions in 0..1):
         0.00 → 0.06  settle pause
         0.06 → 0.30  Card 1 (Starter) exits LEFT  + Cards 2-3 translate up
         0.30 → 0.55  Card 2 (Habit) exits RIGHT   + Card 3 translates up
         0.55 → 0.80  Card 3 (Protocol) exits RIGHT
         0.80 → 0.95  whole section evaporates (heading + payment row fade)
         0.95 → 1.00  empty hold (clean handoff to "Das tägliche Ritual") */

    tl.to(starter,            { xPercent: -160, opacity: 0, ease: 'power2.in', duration: 0.22 }, 0.06)
      .to([habit, protocol],  { y: card1Lift, ease: 'power2.out', duration: 0.22 }, 0.06)

      .to(habit,              { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.22 }, 0.32)
      .to(protocol,           { y: card2Lift, ease: 'power2.out', duration: 0.22 }, 0.32)

      .to(protocol,           { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.22 }, 0.57)

      .to(section,            { opacity: 0, scale: 0.95, ease: 'power1.in', duration: 0.15 }, 0.80);
  }

  /* pinScrollTrigger is defined further down (shared with editorial blocks);
     we call it via runtime closure, so the order works fine. */
  mm.add('(min-width: 992px)', function () { attachProductCardsExitDesktop(1000); });
  mm.add('(max-width: 991px)', function () { attachProductCardsExitMobile(700); });

  /* =========================================================================
     EDITORIAL BLOCKS — Manifest + Ritual.
     Both blocks pin to the viewport while their content animation plays out,
     so the user reads the effect in place; the pin only releases once the
     animation is essentially complete, then scrolling continues to the next
     block. Scrub 0.5 keeps both forward AND reverse responsive (the latter
     was the explicit ask — scrolling back snaps cleanly to original state).

     - Manifest:  radial word-shatter (golden-angle vectors) + bg blur/darken
     - Ritual:    "gold eruption" — words glow + grow, then burst upward
                  like a volcano, on the "Ein Teil Gold, Zehn Teile Leben" beat
     ========================================================================= */

  function splitIntoWordShards(rootEl) {
    /* Walk text nodes only — preserves <br> and child tags like
       <span class="ambernord-text-gold">. Each non-whitespace word is wrapped
       in an inline-block span tagged .manifest-shard; whitespace stays as
       plain text nodes so wrapping looks natural. */
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    const nodes  = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    const shards = [];
    nodes.forEach(function (node) {
      if (!node.textContent.trim()) return;
      const parts = node.textContent.split(/(\s+)/);
      const frag  = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) {
          frag.appendChild(document.createTextNode(p));
        } else {
          const span = document.createElement('span');
          span.className   = 'manifest-shard';
          span.textContent = p;
          frag.appendChild(span);
          shards.push(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    return shards;
  }

  const editorialBlocks = (!reducedMotion
    ? Array.from(document.querySelectorAll('.editorial-bento-grid > .nature-hero-wrapper'))
    : []
  ).map(function (wrapper) {
    const content = wrapper.querySelector('.nature-hero-content');
    return {
      wrapper: wrapper,
      bg:      wrapper.querySelector('.nature-hero-bg'),
      shards:  content ? splitIntoWordShards(content) : []
    };
  });

  /* Dynamic pin offset: read the live --nav-height / --aktion-height tokens
     so the block lands cleanly UNDER the topbar (with a 40px breathing gap),
     regardless of whether the aktion bar is currently visible. */
  function pinTopOffset() {
    const cs      = getComputedStyle(document.documentElement);
    const navH    = parseFloat(cs.getPropertyValue('--nav-height'))    || 80;
    const aktionH = parseFloat(cs.getPropertyValue('--aktion-height')) || 0;
    return navH + aktionH + 40;
  }

  /* Standard pin config shared by both effects.
     scrub: 0.5 → forward feels smooth, reverse snaps back quickly.
     `startStr` lets a caller override the trigger position (used by editorial
     blocks which pin VISUALLY CENTERED in the viewport, vs. products which pin
     just below the topbar). */
  function pinScrollTrigger(wrapper, pinDuration, startStr) {
    return {
      trigger: wrapper,
      start:   startStr || function () { return 'top top+=' + pinTopOffset(); },
      end:     '+=' + pinDuration,
      pin:     true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub:   0.5,
      invalidateOnRefresh: true
    };
  }

  /* Shared timeline phases for both editorial blocks (positions in 0..1):
       0.00 → 0.12   settle pause       (block locks in, brief beat)
       0.12 → 0.83   main animation     (shatter / eruption)
       0.83 → 1.00   evaporate frame    (block fades + scales down, NOTHING left)
     The evaporation animates .nature-hero-block so its border, box-shadow,
     bg image and overlay ALL fade together — no leftover empty rectangle. */

  function attachManifestShatter(block, maxDist, pinDuration, startStr) {
    if (reducedMotion || !block.wrapper || !block.shards.length) return;

    const vectors = block.shards.map(function (_, i) {
      const angle = (i * 137.508) * Math.PI / 180;
      const dist  = (maxDist * 0.55) + (i * 31) % (maxDist * 0.45);
      return {
        x:   Math.cos(angle) * dist,
        y:   Math.sin(angle) * dist * 0.55,
        rot: ((i * 23) % 90) - 45
      };
    });

    const tl = gsap.timeline({ scrollTrigger: pinScrollTrigger(block.wrapper, pinDuration, startStr) });

    block.shards.forEach(function (shard, i) {
      const v = vectors[i];
      tl.to(shard, {
        x: v.x, y: v.y,
        rotation: v.rot,
        opacity:  0,
        filter:  'blur(6px)',
        ease:    'power2.in',
        duration: 0.45
      }, 0.12 + i * 0.006);
    });

    if (block.bg) {
      /* Mild blur only — keep image clearly recognisable. Heavy blur on a
         heavily-blurred LQIP placeholder used to make the bg read as a flat
         "gray rectangle"; 3px is a soft haze without destroying detail. */
      tl.to(block.bg, {
        filter: 'blur(3px) brightness(0.8) contrast(1.05)',
        scale:  1.04,
        ease:  'power1.in',
        duration: 0.65
      }, 0.12);
    }

    const innerBlock = block.wrapper.querySelector('.nature-hero-block');
    if (innerBlock) {
      tl.to(innerBlock, {
        opacity: 0,
        scale:   0.94,
        ease:   'power1.in',
        duration: 0.17
      }, 0.83);
    }
  }

  function attachRitualEruption(block, maxDist, pinDuration, startStr) {
    if (reducedMotion || !block.wrapper || !block.shards.length) return;

    /* Volcano vectors: angles distributed in the UPPER hemisphere only
       (-150° to -30°, where -90° is straight up), so all shards erupt
       skyward with horizontal spread. */
    const vectors = block.shards.map(function (_, i) {
      const angleDeg = -150 + ((i * 47) % 121); /* -150 .. -30 inclusive */
      const rad      = angleDeg * Math.PI / 180;
      const dist     = (maxDist * 0.5) + (i * 37) % (maxDist * 0.5);
      return {
        x:   Math.cos(rad) * dist,
        y:   Math.sin(rad) * dist,  /* sin in [-1, -0.5] → always upward */
        rot: ((i * 29) % 120) - 60
      };
    });

    const tl = gsap.timeline({ scrollTrigger: pinScrollTrigger(block.wrapper, pinDuration, startStr) });

    /* Phase 1 (0.12 → 0.40): GLOW + SWELL.
       Words turn bright gold, scale up, and gain a luminous shadow — the
       "energy charging" moment before the eruption. */
    tl.to(block.shards, {
      color: '#FFD56B',
      scale: 1.28,
      textShadow: '0 0 18px rgba(255, 213, 107, 0.85), 0 0 36px rgba(237, 163, 35, 0.55)',
      ease: 'power1.inOut',
      duration: 0.28,
      stagger: { each: 0.004, from: 'random' }
    }, 0.12);

    /* Background mirrors the glow — saturation + brightness up, slight zoom.
       No blur in the glow phase: image stays sharp during the swell-up. */
    if (block.bg) {
      tl.to(block.bg, {
        filter: 'brightness(1.15) saturate(1.4) contrast(1.05)',
        scale:  1.03,
        ease:  'power1.inOut',
        duration: 0.28
      }, 0.12);
    }

    /* Phase 2 (0.40 → 0.83): ERUPT.
       Words shoot upward + outward, pinch to small scale, spin, fade out. */
    block.shards.forEach(function (shard, i) {
      const v = vectors[i];
      tl.to(shard, {
        x: v.x, y: v.y,
        rotation: v.rot,
        scale: 0.25,
        opacity: 0,
        filter: 'blur(5px)',
        ease: 'power2.in',
        duration: 0.40
      }, 0.40 + i * 0.005);
    });

    /* Background after the eruption — mild blur + retained warm glow. Image
       stays readable as the bridge to the Exclusive Sourcing image peeking
       up from below. */
    if (block.bg) {
      tl.to(block.bg, {
        filter: 'blur(3px) brightness(1.15) saturate(1.4) contrast(1.0)',
        scale:  1.06,
        ease:  'power1.in',
        duration: 0.43
      }, 0.40);
    }

    /* Phase 3 (0.83 → 1.00): EVAPORATE the frame entirely */
    const innerBlock = block.wrapper.querySelector('.nature-hero-block');
    if (innerBlock) {
      tl.to(innerBlock, {
        opacity: 0,
        scale:   0.94,
        ease:   'power1.in',
        duration: 0.17
      }, 0.83);
    }
  }

  /* Editorial blocks pin VISUALLY CENTERED below the topbar.
     'center 55%' = block's vertical center at 55% down viewport → balanced
     padding between topbar and the block (and below the block). */
  mm.add('(min-width: 992px)', function () {
    if (editorialBlocks[0]) attachManifestShatter (editorialBlocks[0], 550, 1000, 'center 55%');
    if (editorialBlocks[1]) attachRitualEruption  (editorialBlocks[1], 480, 1000, 'center 55%');
  });
  mm.add('(max-width: 991px)', function () {
    if (editorialBlocks[0]) attachManifestShatter (editorialBlocks[0], 280, 800,  'center 55%');
    if (editorialBlocks[1]) attachRitualEruption  (editorialBlocks[1], 240, 800,  'center 55%');
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
     Desktop: bg fades in WHILE the Ritual block is still pinned and
     evaporating (the section is pulled up via CSS margin-top: -240px so
     it physically peeks into viewport bottom during Ritual's last beats).
     Mobile: the editorial blocks are so much taller that the negative
     margin was either eaten by pin spacers or pushed the bg out of view
     entirely — so on mobile we drop the scrub and keep the bg simply
     opacity:1 from the start. It shows up in normal flow after Ritual.
     ========================================================================= */

  const exclusiveBg = document.getElementById('exclusiveBg');

  if (exclusiveBg && !reducedMotion) {
    mm.add('(min-width: 992px)', function () {
      gsap.set(exclusiveBg, { opacity: 0 });

      const bgTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#exclusiveSection',
          start:   'top 95%',
          end:     'bottom 55%',
          scrub:   1
        }
      });

      bgTl
        .to(exclusiveBg, { opacity: 1, ease: 'power1.inOut', duration: 2 })
        .to(exclusiveBg, { opacity: 1, duration: 6 })
        .to(exclusiveBg, { opacity: 0, ease: 'power1.inOut', duration: 2 });
    });

    mm.add('(max-width: 991px)', function () {
      gsap.set(exclusiveBg, { opacity: 1 });
    });
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
