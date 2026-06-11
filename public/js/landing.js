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

  /* Tagline: no JS auto-fit anymore — on mobile the line wraps into two
     editorial rows (CSS in landing.css), with an 11px floor in every locale. */

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[Landing] GSAP not available yet — retrying...');
    setTimeout(window.initLanding, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Prevents full ScrollTrigger recalculation every time the iOS address bar
     hides/shows (height-only resize event). Without this, all pin positions
     jump mid-scroll in mobile Safari whenever the address bar transitions. */
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* Force 3D-promoted transforms on every animated element so heavy
     simultaneous tweens (mobile card lifts + horizontal exits + trailing
     info translateY) run on the GPU compositor instead of the CPU. Fixes
     the "raustīšanās" / stutter the user reported on slower phones. */
  gsap.config({ force3D: true });

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

  /* Fire right as the hero EU leaf finishes fading (#heroText fades within the
     first ~80px of scroll), so the topbar badge "lands" by the logo IMMEDIATELY
     instead of after a long gap. Pixel values only — % in the second token of a
     ScrollTrigger start string is ambiguous and can throw, which would abort the
     rest of initLanding and break the hero animation. */
  const isDesktop      = window.matchMedia('(min-width: 992px)').matches;
  const badgeThreshold = isDesktop ? 110 : 90;

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

  /* =========================================================================
     FLYING BOTTLE — hero product image animates to centre of the shrunk hero.
     A high-res clone is appended to .sticky-viewport (position:absolute) so
     it is NOT clipped by .scalable-hero's overflow:hidden. The original
     .hero-product-img is hidden; the clone flies from its start position to
     the hero centre and grows to fill ~80% of the shrunk hero area.
     Hero background photo fades to opacity:0 leaving the bottle on pure black.
     The bottle then rises with the hero in the final phase.
     ========================================================================= */

  function createFlyingBottle(tl, isDesktop, riseStart, riseDur, riseAmt) {
    if (reducedMotion) return null;

    const heroBottle = document.querySelector('.hero-product-img');
    const stickyVP   = document.querySelector('.sticky-viewport');
    if (!heroBottle || !stickyVP) return null;

    const heroVh = isDesktop ? 55 : 50;

    /* High-res PNG — Cloudinary h_1000 parameter gives sharp pixels even at
       the large fill size. The image has a transparent background so it
       composites cleanly over the black hero. */
    const fly = document.createElement('img');
    fly.src = 'https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto:good,h_1000/v1775476093/ambernord-bio-sanddornsaft-zelt-edition-250ml-schweiz.webp_kl6nqj.png';
    fly.alt = '';
    fly.setAttribute('aria-hidden', 'true');
    fly.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:11;object-fit:contain;filter:drop-shadow(0 0 40px rgba(237,163,35,0.25)) drop-shadow(0 0 80px rgba(237,163,35,0.12));will-change:transform,opacity;';

    const glowSize = isDesktop ? 600 : 420;
    const glow = document.createElement('div');
    glow.setAttribute('aria-hidden', 'true');
    glow.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:10;border-radius:50%;background:radial-gradient(ellipse at center,rgba(237,163,35,0.15) 0%,rgba(237,163,35,0.06) 40%,transparent 68%);will-change:transform,opacity;';

    stickyVP.appendChild(glow);
    stickyVP.appendChild(fly);

    heroBottle.style.opacity = '0';

    /* Black background: hero-bg-video fades out; the remaining shade gradient
       and the hero's background-color (#0a0a0a) create solid black. */
    gsap.set('.scalable-hero', { backgroundColor: '#0a0a0a' });

    /* Measure start position: bottle in viewport coords → convert to
       sticky-viewport coords (sticky-viewport.top = navH+aktionH+8 at scroll=0) */
    function startProps() {
      const sv = stickyVP.getBoundingClientRect();
      const b  = heroBottle.getBoundingClientRect();
      return { x: b.left - sv.left, y: b.top - sv.top, w: b.width, h: b.height };
    }

    /* End position: centre of shrunk hero in sticky-viewport coords.
       Hero centres horizontally in sticky-viewport (justify-content:center).
       Vertical centre = computeHeroCenterY offset + half hero height.
       Bottle fills 82% of hero height (1:2 aspect ratio). */
    function endProps() {
      const heroH = window.innerHeight * heroVh / 100;
      const heroW = isDesktop ? 380 : window.innerWidth * 0.85;
      let   tH    = heroH * 0.82;
      let   tW    = tH * 0.50;
      if (tW > heroW * 0.72) { tW = heroW * 0.72; tH = tW / 0.50; }
      return {
        x: window.innerWidth / 2 - tW / 2,
        y: computeHeroCenterY(heroVh) + heroH / 2 - tH / 2,
        w: tW,
        h: tH,
      };
    }

    const sp = startProps();
    gsap.set(fly, { x: sp.x, y: sp.y, width: sp.w, height: sp.h });

    function glowXY() {
      const e = endProps();
      return { x: e.x + e.w / 2 - glowSize / 2, y: e.y + e.h / 2 - glowSize / 2 };
    }
    const gp = glowXY();
    gsap.set(glow, { x: gp.x, y: gp.y, width: glowSize, height: glowSize, scale: 0, opacity: 0 });

    /* Hero photo fades to black */
    tl.to('.hero-bg-video', { opacity: 0, duration: 1.5, ease: 'power1.in' }, 0.6);

    /* Bottle position + size: travels from hero-bottle start to hero centre.
       Starts at opacity:1 (visible on page load, replacing the hidden original). */
    tl.to(fly, {
      x:      function () { return endProps().x; },
      y:      function () { return endProps().y; },
      width:  function () { return endProps().w; },
      height: function () { return endProps().h; },
      duration: 2.8,
      ease: 'power1.inOut',
    }, 0.3);

    /* Bottle follows hero rise in final phase */
    tl.to(fly, {
      y:        function () { return endProps().y - window.innerHeight * riseAmt; },
      duration: riseDur,
      ease:     'power1.in',
    }, riseStart);

    /* Golden glow: appears as bottle nears centre, grows while cards are
       visible, fades before the hero starts rising. */
    const glowIn  = isDesktop ? riseStart - 2.4 : 2.8;
    const glowOut = riseStart;
    tl.to(glow, { scale: 1, opacity: 1, duration: isDesktop ? 0.9 : 0.5, ease: 'power2.out' }, glowIn);
    tl.to(glow, { scale: 0.7, opacity: 0, duration: isDesktop ? 0.7 : 0.4, ease: 'power1.in' }, glowOut);

    /* Trust items are NO LONGER reparented into the hero animation on mobile —
       they live permanently as a static row under the product cards (CSS),
       always visible, screen-reader accessible, reduced-motion safe. */

    return function () {
      if (fly.parentNode)  fly.parentNode.removeChild(fly);
      if (glow.parentNode) glow.parentNode.removeChild(glow);
      heroBottle.style.opacity = '';
      const hero = document.querySelector('.scalable-hero');
      const bgv  = document.querySelector('.hero-bg-video');
      if (hero) hero.style.backgroundColor = '';
      if (bgv)  bgv.style.opacity = '';
    };
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

    /* Phase 3: Surrounding cards drift away upward — start TOGETHER with the
       bottle/hero rise (5.7, was 5.4) and travel a shorter distance, so they
       lift into the air at the same beat as the bottle instead of rocketing
       off ahead of it. */
      .to('.float-img',         { y: '-58vh', duration: 3.2, ease: 'power1.in' }, 5.7)

    /* Phase 4: The hero card + bottle barely rise — they stay near centre so
       the END of the hero is NOT an empty black viewport. The bottle remains
       on screen as the product section scrolls up to meet it, so the hero →
       shop handoff has almost no dead black (the old 0.55 rise lifted the
       bottle fully off the top, leaving a full black viewport to scroll past). */
      .to('.scalable-hero',     { y: function () { return computeHeroCenterY(55) - window.innerHeight * 0.12; },
                                  duration: 3.2, ease: 'power1.in' }, 5.7);

    return createFlyingBottle(tl, true, 5.7, 3.2, 0.12);
  });

  mm.add('(max-width: 991px)', function () {
    const scrollTrack = document.getElementById('scrollTrack');
    const dvhOk = (window.CSS && CSS.supports && CSS.supports('height', '1dvh'));

    /* Reduced motion: no choreography → no scrub range. Collapse the track to
       one viewport so there is no dead pinned scroll. */
    if (reducedMotion) {
      if (scrollTrack) scrollTrack.style.height = dvhOk ? '100dvh' : '100vh';
      return function () {
        if (scrollTrack) scrollTrack.style.height = '';
      };
    }

    /* 160dvh = 60dvh of scrub range for the shortened ~6-unit mobile timeline
       (shrink + bottle fly + rise — the ONLY pinned scene on mobile). The
       trust posms and the product-card pin were removed: everything after the
       hero is normal momentum scrolling. */
    if (scrollTrack) scrollTrack.style.height = dvhOk ? '160dvh' : '160vh';

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
      .to('.scalable-hero',     { y: function () { return -window.innerHeight * 0.75; },
                                  duration: 2.0, ease: 'power1.in' }, 4.0);

    const btlCleanup = createFlyingBottle(tlMobile, false, 4.0, 2.0, 0.3);

    return function () {
      if (scrollTrack) scrollTrack.style.height = '';
      if (btlCleanup) btlCleanup();
    };
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

  /* =========================================================================
     DESKTOP BRIDGE BOTTLE SCENE — a real, full-size scene in the flow AFTER
     the pinned product block. Cards (full size) fly out and collapse; payment
     + trust reflow up and hold (anchored with the card block). Once the pin
     releases, THIS bottle scene rises from below — big, glowing — and the
     "Das tägliche Ritual" usage text sits directly beneath it.
     ========================================================================= */
  function setupDesktopBridgeScene(bWrap) {
    if (reducedMotion || !bWrap) return;
    const img = bWrap.querySelector('img');
    if (!img) return;

    /* Big bottle — fills most of the viewport height. */
    img.style.width    = 'auto';
    img.style.height   = Math.round(window.innerHeight * 0.72) + 'px';
    img.style.maxWidth = '90vw';
    img.style.position = 'relative';
    img.style.zIndex   = '2';
    img.style.filter   = 'drop-shadow(0 0 60px rgba(237,163,35,0.42)) drop-shadow(0 0 140px rgba(237,163,35,0.20))';

    /* Scene wrapper is a tall stage; the bottle is centred. */
    bWrap.style.position  = 'relative';
    bWrap.style.minHeight = '88vh';
    bWrap.style.display   = 'flex';
    bWrap.style.justifyContent = 'center';
    bWrap.style.alignItems = 'center';
    bWrap.style.padding   = '0';
    bWrap.style.overflow  = 'visible';
    bWrap.style.opacity   = '1';

    /* Warm gold halo behind the bottle. */
    let glow = bWrap.querySelector('.bridge-glow');
    if (!glow) {
      glow = document.createElement('div');
      glow.className = 'bridge-glow';
      glow.setAttribute('aria-hidden', 'true');
      var glowSize = 'min(96vh, 90vw)';
      glow.style.cssText =
        'position:absolute;top:50%;left:50%;width:' + glowSize + ';height:' + glowSize + ';' +
        'transform:translate(-50%,-50%);z-index:1;pointer-events:none;border-radius:50%;' +
        'background:radial-gradient(circle at center,rgba(237,163,35,0.26) 0%,' +
        'rgba(237,163,35,0.12) 36%,rgba(237,163,35,0.04) 56%,transparent 70%);';
      bWrap.insertBefore(glow, img);
    }
  }

  function cleanupDesktopBridgeScene(bWrap) {
    if (!bWrap) return;
    const img = bWrap.querySelector('img');
    if (img) {
      img.style.width = ''; img.style.height = ''; img.style.maxWidth = '';
      img.style.position = ''; img.style.zIndex = ''; img.style.filter = '';
    }
    bWrap.style.position = ''; bWrap.style.minHeight = ''; bWrap.style.display = '';
    bWrap.style.justifyContent = ''; bWrap.style.alignItems = '';
    bWrap.style.padding = '30px 0'; bWrap.style.overflow = ''; bWrap.style.opacity = '';
    const glow = bWrap.querySelector('.bridge-glow');
    if (glow && glow.parentNode) glow.parentNode.removeChild(glow);
  }

  /* Gentle parallax — the bottle scene drifts upward as it scrolls, so it
     reads as "approaching from below" out of the product block and up into
     the "Das tägliche Ritual" text + Manifest. */
  function attachBridgeBottleRiseDesktop(bWrap) {
    if (reducedMotion || !bWrap) return;
    gsap.fromTo(bWrap,
      { yPercent: 12 },
      { yPercent: -12, ease: 'none',
        scrollTrigger: {
          trigger: bWrap,
          start: 'top bottom',
          end:   'bottom top',
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
  }

  /* =========================================================================
     GOLD CONSTELLATION — builds an abstract gold dot-and-line sketch behind
     the product cards. Returns helpers the pin timeline drives:
       drawCluster(tl, idx, at) — self-draws cluster `idx` (lines via
                                  dash-offset, dots scale in) at timeline `at`
       reset()                  — back to the pre-draw blank state
       cleanup()                — remove the layer, restore the cards group
     Pure SVG overlay (pointer-events:none, z-index 0 → behind the cards). If
     the cards group is missing it returns null and the pin runs unchanged. */
  function buildGoldConstellation(section) {
    if (reducedMotion || !section) return null;
    const cardsGroup = section.querySelector('.ritual-cards-group');
    if (!cardsGroup) return null;

    const W = cardsGroup.offsetWidth;
    const H = cardsGroup.offsetHeight;
    if (!W || !H) return null;

    const GOLD = 'rgba(237,163,35,0.9)';
    const R    = Math.max(4, Math.round(W * 0.0042));

    /* Normalised clusters (x,y in 0..1 of the cards-group box). Each later
       cluster includes one line back to the previous one so the whole thing
       reads as a single constellation, not three islands. */
    const CLUSTERS = [
      { dots: [[0.20,0.30],[0.36,0.22],[0.30,0.41]],
        lines: [[0.20,0.30,0.36,0.22],[0.20,0.30,0.30,0.41]] },
      { dots: [[0.66,0.47],[0.81,0.38],[0.73,0.57]],
        lines: [[0.66,0.47,0.81,0.38],[0.66,0.47,0.73,0.57],[0.36,0.22,0.66,0.47]] },
      { dots: [[0.31,0.74],[0.17,0.83],[0.47,0.80]],
        lines: [[0.31,0.74,0.17,0.83],[0.31,0.74,0.47,0.80],[0.73,0.57,0.47,0.80]] }
    ];

    const SVGNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;' +
      'pointer-events:none;overflow:visible;will-change:opacity;' +
      'filter:drop-shadow(0 0 5px rgba(237,163,35,0.55));';

    const clusters = CLUSTERS.map(function (c) {
      const lineEls = c.lines.map(function (l) {
        const ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', l[0] * W); ln.setAttribute('y1', l[1] * H);
        ln.setAttribute('x2', l[2] * W); ln.setAttribute('y2', l[3] * H);
        ln.setAttribute('stroke', GOLD);
        ln.setAttribute('stroke-width', '1.6');
        ln.setAttribute('stroke-linecap', 'round');
        ln.setAttribute('opacity', '0.55');
        ln.setAttribute('pathLength', '1');
        ln.setAttribute('stroke-dasharray', '1');
        ln.setAttribute('stroke-dashoffset', '1');
        svg.appendChild(ln);
        return ln;
      });
      const dotEls = c.dots.map(function (d) {
        const ci = document.createElementNS(SVGNS, 'circle');
        ci.setAttribute('cx', d[0] * W); ci.setAttribute('cy', d[1] * H);
        ci.setAttribute('r', '0');
        ci.setAttribute('fill', GOLD);
        svg.appendChild(ci);
        return ci;
      });
      return { lines: lineEls, dots: dotEls };
    });

    cardsGroup.style.position = 'relative';
    cardsGroup.insertBefore(svg, cardsGroup.firstChild);

    const allLines = clusters.reduce(function (a, c) { return a.concat(c.lines); }, []);
    const allDots  = clusters.reduce(function (a, c) { return a.concat(c.dots); }, []);

    function reset() {
      gsap.set(svg, { opacity: 1 });
      gsap.set(allLines, { attr: { 'stroke-dashoffset': 1 } });
      gsap.set(allDots,  { attr: { r: 0 }, opacity: 1 });
    }

    return {
      svg: svg,
      reset: reset,
      drawCluster: function (tl, idx, at) {
        const c = clusters[idx];
        if (!c) return;
        tl.to(c.lines, { attr: { 'stroke-dashoffset': 0 }, ease: 'none', duration: 0.10 }, at);
        tl.to(c.dots,  { attr: { r: R }, ease: 'back.out(2.2)', duration: 0.10, stagger: 0.02 }, at + 0.02);
      },
      cleanup: function () {
        if (svg.parentNode) svg.parentNode.removeChild(svg);
        cardsGroup.style.position = '';
      }
    };
  }

  /* =========================================================================
     PRODUCT CARDS — desktop pinned exit (full-size cards).
     #ritual-products (heading + 3 full-size cards + payment + trust) pins under
     the topbar; The Starter flies LEFT, The Habit RIGHT, The Protocol RIGHT
     (sequentially). Each card then COLLAPSES its height so the payment icons +
     trust badges reflow UP into view and hold — they stay anchored with the
     card block for the whole animation.

     The pin spacer is sized from the section's FULL (pre-collapse) height, so
     after the collapse the section is ~3 cards shorter than its reserved space
     → a dead black band before the next element. The caller compensates by
     pulling the following bottle scene up by `collapsedH` (returned here),
     exactly like the mobile path. Returns { cleanup, collapsedH }.
     ========================================================================= */
  function attachProductCardsExitDesktop(pinDuration) {
    if (reducedMotion) return null;

    const section = document.getElementById('ritual-products');
    if (!section) return null;

    const productCards = section.querySelectorAll('.premium-product-card');
    if (productCards.length < 3) return null;

    const [starter, habit, protocol] = productCards;
    const cards = [starter, habit, protocol];
    productCards.forEach(function (c) { c.style.transition = 'border-color var(--t-base) ease'; });

    /* The payment-icon row leaves TOGETHER with The Protocol (flies right +
       fades, then collapses), so only the trust badges remain after the exit. */
    const payment = section.querySelector('.ritual-payment-group');

    /* Height the cards (+ payment row) occupy — the spacer overshoot to absorb
       once they collapse to 0, so the editorial still follows with no gap. */
    const cs = getComputedStyle(starter);
    const cardMargin = parseFloat(cs.marginBottom) || 20;
    let collapsedH = starter.offsetHeight + habit.offsetHeight + protocol.offsetHeight + 3 * cardMargin;
    if (payment) {
      const pcs = getComputedStyle(payment);
      collapsedH += payment.offsetHeight
                  + (parseFloat(pcs.marginTop)    || 0)
                  + (parseFloat(pcs.marginBottom) || 0);
    }
    collapsedH = Math.round(collapsedH);

    /* GOLD CONSTELLATION — an abstract gold dot-and-line sketch drawn BEHIND
       the cards. As each card flies away it reveals a fresh cluster being
       "drawn" (dots scale in, connecting lines self-draw via dash-offset);
       once all three cards have left, the whole constellation fades out before
       the bottle arrives — so the vacated card area is never plain black.
       Purely additive: its own SVG layer + tweens on the SAME timeline. */
    const constellation = buildGoldConstellation(section);

    const stConfig = pinScrollTrigger(section, pinDuration);
    /* Pin a hair early so the relative→fixed switch is seamless — kills the
       tiny "drop/shuffle" the product block did the instant it locked. */
    stConfig.anticipatePin = 1;
    const PAY_PROPS = 'xPercent,opacity,height,marginTop,marginBottom,paddingTop,paddingBottom,borderTopWidth,overflow';
    stConfig.onLeaveBack = function () {
      gsap.set(cards, { clearProps: 'xPercent,opacity,height,marginBottom,paddingTop,paddingBottom,borderWidth,overflow' });
      if (payment) gsap.set(payment, { clearProps: PAY_PROPS });
      if (constellation) constellation.reset();
    };

    const tl = gsap.timeline({ scrollTrigger: stConfig });

    /* Fly out: Starter LEFT, Habit RIGHT, Protocol RIGHT — sequentially. The
       payment-icon row flies out RIGHT with The Protocol (same beat). */
    tl.to(starter,  { xPercent: -160, opacity: 0, ease: 'power2.in', duration: 0.16 }, 0.06)
      .to(habit,    { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.16 }, 0.20)
      .to(protocol, { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.16 }, 0.34);
    if (payment) {
      tl.to(payment, { xPercent: 160, opacity: 0, ease: 'power2.in', duration: 0.16 }, 0.34);
    }
    /* Then collapse height so ONLY the trust badges reflow up into view and hold. */
    tl.set(cards,   { overflow: 'hidden' }, 0.48)
      .to(cards,    { height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, borderWidth: 0,
                      ease: 'power1.inOut', duration: 0.30 }, 0.50);
    if (payment) {
      tl.set(payment, { overflow: 'hidden' }, 0.48)
        .to(payment,  { height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, borderTopWidth: 0,
                        ease: 'power1.inOut', duration: 0.30 }, 0.50);
    }

    /* Constellation draws cluster-by-cluster as each card clears, then fades. */
    if (constellation) {
      constellation.reset();
      constellation.drawCluster(tl, 0, 0.18);   /* after Starter (top) leaves   */
      constellation.drawCluster(tl, 1, 0.32);   /* after Habit  (mid) leaves    */
      constellation.drawCluster(tl, 2, 0.46);   /* after Protocol (bot) leaves  */
      tl.to(constellation.svg, { opacity: 0, ease: 'power1.in', duration: 0.16 }, 0.56);
    }

    return {
      collapsedH: collapsedH,
      cleanup: function () {
        gsap.set(cards, { clearProps: 'xPercent,opacity,height,marginBottom,paddingTop,paddingBottom,borderWidth,overflow' });
        if (payment) gsap.set(payment, { clearProps: PAY_PROPS });
        if (constellation) constellation.cleanup();
      }
    };
  }

  /* Mobile product presentation is now a STATIC premium stack — the pinned
     card-exit choreography (and the glass/spoon SVG scene, which carried
     hardcoded German copy) was removed. Cards reveal once with a calm
     fade-up and stay put so the three editions can be compared freely;
     The Habit announces itself with a single border-glow "breath" (CSS). */

  /* =========================================================================
     BRIDGE BOTTLE — appears inside #ritual-products after Protocol card exits,
     filling the empty black space left by the exited cards. Sized to match
     the flying bottle at its centred hero position. Fades in when the
     Protocol exit is complete, then scrolls up naturally with the editorial.
     Both desktop and mobile.
     ========================================================================= */

  function attachBridgeBottle() {
    if (reducedMotion) return null;
    const section     = document.getElementById('ritual-products');
    const shop        = document.getElementById('shop');
    const trailingInfo = section && section.querySelector('.shop-trailing-info');
    if (!section || !shop || !trailingInfo) return null;

    /* Bottle size: same formula as endProps() in createFlyingBottle */
    var isBrDesktop = window.matchMedia('(min-width: 992px)').matches;
    var heroVh = isBrDesktop ? 55 : 50;
    var heroH  = window.innerHeight * heroVh / 100;
    var heroW  = isBrDesktop ? 380 : window.innerWidth * 0.85;
    var tH = heroH * 0.82;
    var tW = tH * 0.50;
    if (tW > heroW * 0.72) { tW = heroW * 0.72; tH = tW / 0.50; }
    tH = Math.round(tH);
    tW = Math.round(tW);

    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'display:flex;justify-content:center;align-items:center;width:100%;padding:30px 0;opacity:0;will-change:opacity,transform,filter;';

    var btl = document.createElement('img');
    btl.src = 'https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto:good,h_1000/v1775476093/ambernord-bio-sanddornsaft-zelt-edition-250ml-schweiz.webp_kl6nqj.png';
    btl.alt = '';
    btl.setAttribute('aria-hidden', 'true');
    btl.style.cssText = 'width:' + tW + 'px;height:' + tH + 'px;object-fit:contain;filter:drop-shadow(0 0 40px rgba(237,163,35,0.25)) drop-shadow(0 0 80px rgba(237,163,35,0.12));';

    wrap.appendChild(btl);
    section.insertBefore(wrap, trailingInfo);

    return wrap;
  }

  const bridgeWrap = attachBridgeBottle();

  /* pinScrollTrigger shared with desktop editorial; not used for mobile product. */
  mm.add('(min-width: 992px)', function () {
    var section      = document.getElementById('ritual-products');
    var cardsGroup   = section && section.querySelector('.ritual-cards-group');
    var trustBand    = section && section.querySelector('.conversion-booster-wrapper');
    var payment      = section && section.querySelector('.ritual-payment-group');
    var trailing     = section && section.querySelector('.shop-trailing-info');
    var editorialWrap = document.querySelector('.dynamic-editorial-wrapper');

    /* DOM order INSIDE the pinned section: cards → payment → trust → BOTTLE
       scene → "Das tägliche Ritual". The bottle stays in NORMAL FLOW below the
       trust badges, so block layout guarantees it can never overlap them — as
       the cards collapse, payment + trust reflow UP ("pushed up") and the
       bottle sits beneath them. Das tägliche Ritual is directly under the
       bottle. The collapse leaves a pin-spacer overshoot AFTER the whole
       section; that is absorbed by pulling the editorial up (far below — no
       overlap with anything on screen), exactly like the mobile path. */
    if (cardsGroup && payment)   cardsGroup.after(payment);
    if (payment && trustBand)    payment.after(trustBand);
    if (trustBand && bridgeWrap) trustBand.after(bridgeWrap);
    if (bridgeWrap && trailing)  bridgeWrap.after(trailing);

    setupDesktopBridgeScene(bridgeWrap);
    var pin = attachProductCardsExitDesktop(1500);

    if (pin && editorialWrap) {
      editorialWrap.style.marginTop = -pin.collapsedH + 'px';
    }

    return function () {
      if (pin && pin.cleanup) pin.cleanup();
      cleanupDesktopBridgeScene(bridgeWrap);
      if (editorialWrap) editorialWrap.style.marginTop = '';
      /* Restore original mobile DOM order inside #ritual-products:
         cards → trust → bottle → trailing → payment. */
      if (section) {
        [cardsGroup, trustBand, bridgeWrap, trailing, payment].forEach(function (el) {
          if (el) section.appendChild(el);
        });
      }
      if (bridgeWrap) gsap.set(bridgeWrap, { clearProps: 'opacity,scale,filter,yPercent,y' });
    };
  });
  mm.add('(max-width: 991px)', function () {
    /* The bridge bottle scene is desktop-only; on mobile the product section
       is plain flow, so the (opacity:0) wrap would just leave a hole. */
    if (bridgeWrap) gsap.set(bridgeWrap, { display: 'none' });

    if (reducedMotion) {
      return function () {
        if (bridgeWrap) gsap.set(bridgeWrap, { clearProps: 'display' });
      };
    }

    /* Static premium stack: each card (and the trust row) fades up ONCE on
       entry, then stays put — the user compares the three editions in peace.
       The Habit gets its border-glow "breath" right after its reveal. */
    var section   = document.getElementById('ritual-products');
    var cards     = section ? Array.from(section.querySelectorAll('.premium-product-card')) : [];
    var trustWrap = section ? section.querySelector('.conversion-booster-wrapper') : null;
    var revealEls = cards.concat(trustWrap ? [trustWrap] : []);

    revealEls.forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            invalidateOnRefresh: true
          },
          onComplete: function () {
            if (el.classList && el.classList.contains('highlight-habit')) {
              el.classList.add('an-breathe');
            }
          }
        }
      );
    });

    return function () {
      revealEls.forEach(function (el) {
        if (el.classList) el.classList.remove('an-breathe');
      });
      if (bridgeWrap) gsap.set(bridgeWrap, { clearProps: 'display' });
    };
  });

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

  /* Standard pin config shared by product + desktop Manifest pins.
     scrub: 0.3 default (tight 1:1), 0.8 for mobile product exit.
     startStr lets callers override the trigger position. */
  /* scrubVal: 0.3 default for editorial pins, 0.8 for mobile product exit.
     No anticipatePin — with scrub the relative→fixed transition is already
     smoothed; anticipatePin caused a visible "magnetic pull" on mobile where
     elements started moving toward their pin position ~1s before the trigger,
     which also created the trust-badge jitter on scroll-down. */
  function pinScrollTrigger(wrapper, pinDuration, startStr, scrubVal) {
    return {
      trigger: wrapper,
      start:   startStr || function () { return 'top top+=' + pinTopOffset(); },
      end:     '+=' + pinDuration,
      pin:     true,
      pinSpacing: true,
      scrub:   scrubVal !== undefined ? scrubVal : 0.3,
      invalidateOnRefresh: true,
    };
  }

  /* Ritual block: plain scroll-reveal replacing the pinned eruption.
     Fades the block up once on viewport entry; background gets a subtle
     parallax zoom while scrolling past. Word shards from splitIntoWordShards()
     remain in the DOM but are not animated — they render as normal inline text. */
  function attachRitualReveal(block, startStr) {
    if (reducedMotion || !block.wrapper) return;
    const innerBlock = block.wrapper.querySelector('.nature-hero-block');
    if (!innerBlock) return;

    gsap.set(innerBlock, { opacity: 0, y: 40 });

    gsap.to(innerBlock, {
      opacity:  1,
      y:        0,
      duration: 1.0,
      ease:     'power2.out',
      scrollTrigger: {
        trigger: block.wrapper,
        start:   startStr || 'top 80%',
        toggleActions: 'play none none none',
        invalidateOnRefresh: true
      }
    });

    if (block.bg) {
      gsap.fromTo(block.bg,
        { scale: 1.0 },
        {
          scale: 1.06,
          ease:  'none',
          scrollTrigger: {
            trigger: block.wrapper,
            start:   'top bottom',
            end:     'bottom top',
            scrub:   1.5,
            invalidateOnRefresh: true
          }
        }
      );
    }
  }

  /* =========================================================================
     FULL-BLEED CINEMATIC EDITORIAL — desktop.
     Replaces the pinned "isolated card on black" treatment. Each block is a
     full-viewport scene (CSS makes it edge-to-edge with a top+bottom dark
     vignette so adjacent scenes fuse seamlessly). On scroll the prose slides
     in from the side — Manifest from the left, Ritual from the right — and the
     background gets a gentle parallax drift. No pin: the page never locks, so
     the section reads as one continuous cinematic flow instead of a frame that
     freezes, plays, and evaporates.
     ========================================================================= */
  function attachEditorialCinematic(block, fromLeft) {
    if (reducedMotion || !block.wrapper) return;
    const content = block.wrapper.querySelector('.nature-hero-content');
    if (!content) return;
    const items = Array.from(content.children);
    if (!items.length) return;

    const dir = fromLeft ? -1 : 1;

    /* Prose slides in from the side as the scene enters the lower viewport. */
    gsap.set(items, { opacity: 0, x: dir * 90, y: 24 });
    gsap.to(items, {
      opacity: 1, x: 0, y: 0,
      duration: 1.1, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: {
        trigger: block.wrapper,
        start: 'top 62%',
        toggleActions: 'play none none reverse',
        invalidateOnRefresh: true
      }
    });

    /* Background parallax drift (extra scale gives headroom so the translate
       never exposes an edge). Keeps the full-bleed image alive while scrolling. */
    if (block.bg) {
      gsap.fromTo(block.bg,
        { yPercent: -6, scale: 1.12 },
        { yPercent: 6, scale: 1.12, ease: 'none',
          scrollTrigger: {
            trigger: block.wrapper,
            start: 'top bottom',
            end:   'bottom top',
            scrub: 1.2,
            invalidateOnRefresh: true
          }
        });
    }
  }

  mm.add('(min-width: 992px)', function () {
    /* Manifest reads in from the left, Ritual mirrors in from the right. */
    if (editorialBlocks[0]) attachEditorialCinematic(editorialBlocks[0], true);
    if (editorialBlocks[1]) attachEditorialCinematic(editorialBlocks[1], false);
  });
  mm.add('(max-width: 991px)', function () {
    /* Mobile editorial = readable-first: no pin, no shatter. Both blocks use
       the same calm fade-up + background parallax so the user reads the
       Manifest and Ritual prose at their own pace. */
    if (editorialBlocks[0]) attachRitualReveal(editorialBlocks[0], 'top 80%');
    if (editorialBlocks[1]) attachRitualReveal(editorialBlocks[1], 'top bottom');
  });

  /* =========================================================================
     PAST-HERO STATE — one IntersectionObserver drives:
       · the bewertung chip (bottom-left social proof)
       · MOBILE ONLY: the topbar CTA swap to "Zum Ritual" (html.an-cta-ritual
         + data-scroll-products on the button, so it scrolls to the cards
         instead of navigating to /shop/). The old .landing-sticky-nav bar was
         removed — it rendered underneath the always-visible topbar.
     ========================================================================= */

  const landingBewertungChip = document.getElementById('landingBewertungChip');
  const scrollTrack          = document.getElementById('scrollTrack');
  const navBtnGlobal         = document.querySelector('.nav-btn--global');

  /* Chip visibility with mobile context zones: past the hero, but QUIET while
     the product cards or the closing CTA are on screen — social proof steps
     back at the decision moments. Desktop keeps the simple past-hero rule. */
  function updateChipVisibility() {
    const chip = document.getElementById('landingBewertungChip');
    if (!chip) return;
    let visible = !!window._anPastHero;
    if (visible && window.matchMedia('(max-width: 991px)').matches) {
      const vh   = window.innerHeight;
      const shop = document.getElementById('shop');
      if (shop) {
        const r = shop.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) visible = false;
      }
      const ccta = document.querySelector('.landing-closing-cta');
      if (visible && ccta && ccta.getBoundingClientRect().top < vh) visible = false;
    }
    chip.classList.toggle('is-visible', visible);
  }
  window._anUpdateChip = updateChipVisibility;

  if (!window._anChipZonesBound) {
    window._anChipZonesBound = true;
    let chipTick = false;
    window.addEventListener('scroll', function () {
      if (chipTick || window.innerWidth > 991) return;
      chipTick = true;
      requestAnimationFrame(function () {
        chipTick = false;
        if (typeof window._anUpdateChip === 'function') window._anUpdateChip();
      });
    }, { passive: true });
  }

  if (scrollTrack && (landingBewertungChip || navBtnGlobal)) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        window._anPastHero = past;
        updateChipVisibility();

        if (window.matchMedia('(max-width: 991px)').matches) {
          document.documentElement.classList.toggle('an-cta-ritual', past);
          if (navBtnGlobal) {
            if (past) navBtnGlobal.setAttribute('data-scroll-products', '');
            else      navBtnGlobal.removeAttribute('data-scroll-products');
          }
        } else {
          document.documentElement.classList.remove('an-cta-ritual');
          if (navBtnGlobal) navBtnGlobal.removeAttribute('data-scroll-products');
        }
      });
    }, { threshold: 0 });
    observer.observe(scrollTrack);
  }

  /* Land precisely at the product block's PIN-START — the exact framing the
     user gets scrolling top-to-bottom (heading + 3 cards under the topbar,
     before the cards animate out). Same target for the hero CTA, the closing
     CTA and the sticky-nav button so every "go to the shop" action lands
     identically. The position is the product pin's own trigger offset
     (nav + aktion + 40), read live so it's correct whether the aktion bar is
     visible or not. */
  function scrollToProductsStart() {
    /* Reference #shop (the wrapper), NOT #ritual-products: the inner section is
       GSAP-pinned, so its getBoundingClientRect shifts by the pin distance
       depending on where you click from (top vs bottom) — using it made the
       hero CTA and the closing CTA land 1500px apart. #shop is never pinned, so
       its top is a stable anchor from any scroll position. The pin engages when
       #ritual-products' top reaches nav+aktion+40 (its pinScrollTrigger start),
       and #ritual-products' natural top = #shop top + #shop padding-top. */
    const shop = document.getElementById('shop');
    if (!shop || typeof window.smoothScrollTo !== 'function') return;
    const cs       = getComputedStyle(document.documentElement);
    const navH     = parseFloat(cs.getPropertyValue('--nav-height'))    || 80;
    const aktionH  = parseFloat(cs.getPropertyValue('--aktion-height')) || 0;
    const shopPad  = parseFloat(getComputedStyle(shop).paddingTop) || 0;
    const shopTop  = shop.getBoundingClientRect().top + window.scrollY;
    const targetY  = shopTop + shopPad - (navH + aktionH + 40);
    window.smoothScrollTo(Math.max(0, targetY));
  }

  /* Intercept the CTAs in the CAPTURE phase (before the router's per-link
     handler), so they use the precise scroll above instead of the generic
     hash offset. Bound once per page-load; it looks up the target fresh each
     click, so it survives SPA re-inits. */
  if (!window._anScrollProductsBound) {
    window._anScrollProductsBound = true;
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-scroll-products]') : null;
      if (!btn) return;
      /* Only hijack the click while the landing shop section actually exists —
         a stale data-scroll-products attribute on another page must fall
         through to normal navigation instead of dead-ending. */
      if (!document.getElementById('shop')) return;
      e.preventDefault();
      e.stopPropagation();
      scrollToProductsStart();
      if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
    }, true);
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

  const galleryImgs   = Array.from(document.querySelectorAll('.mini-gallery-item img'));
  const lightbox      = document.getElementById('gallery-lightbox');
  const lightboxClose = document.getElementById('lightbox-close');

  if (galleryImgs.length && lightbox) {

    /* Current gallery + helpers are stashed on the lightbox element so the
       arrow/keyboard handlers (bound ONCE below) always act on the latest
       SPA-rendered gallery, while the per-image click listeners are rebound
       fresh on every initLanding. */
    lightbox._lbItems = galleryImgs;

    function lbHiRes(src) {
      return src.replace(/w_\d+/, 'w_1200').replace(/w_320/, 'w_1200').replace(/w_400/, 'w_1200');
    }
    function lbEnsureImg() {
      var img = document.getElementById('lightbox-img');
      if (!img) {
        img = document.createElement('img');
        img.id = 'lightbox-img';
        img.className = 'lightbox-image';
        img.alt = 'Vergrössertes Bild';
        lightbox.appendChild(img);
      }
      return img;
    }
    function lbShow(index) {
      var items = lightbox._lbItems || [];
      if (!items.length) return;
      var i = (index + items.length) % items.length;
      lightbox._lbIndex = i;
      lbEnsureImg().src = lbHiRes(items[i].src);
    }
    function lbOpen(index) { lbShow(index); lightbox.classList.add('is-active', 'has-nav'); }
    function lbClose() {
      lightbox.classList.remove('is-active', 'has-nav');
      var img = document.getElementById('lightbox-img');
      if (img) setTimeout(function () { img.src = ''; }, 300);
    }
    /* Re-point the once-bound handlers at this init's functions/state. */
    lightbox._lbShow  = lbShow;
    lightbox._lbClose = lbClose;

    /* Prev / next arrows + global handlers — created and bound a single time.
       Gated by .has-nav so the shared dossier lightbox is unaffected. */
    if (!lightbox._lbBound) {
      lightbox._lbBound = true;

      var mkArrow = function (id, cls, label, path) {
        var b = document.createElement('button');
        b.id = id; b.type = 'button';
        b.className = 'lightbox-nav ' + cls;
        b.setAttribute('aria-label', label);
        b.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" ' +
                      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
        lightbox.appendChild(b);
        return b;
      };
      var prevBtn = mkArrow('landing-lb-prev', 'lightbox-nav--prev', 'Vorheriges Bild', 'M15 18l-6-6 6-6');
      var nextBtn = mkArrow('landing-lb-next', 'lightbox-nav--next', 'Nächstes Bild',   'M9 18l6-6-6-6');

      prevBtn.addEventListener('click', function (e) { e.stopPropagation(); if (lightbox._lbShow) lightbox._lbShow((lightbox._lbIndex || 0) - 1); });
      nextBtn.addEventListener('click', function (e) { e.stopPropagation(); if (lightbox._lbShow) lightbox._lbShow((lightbox._lbIndex || 0) + 1); });

      if (lightboxClose) lightboxClose.addEventListener('click', function () { if (lightbox._lbClose) lightbox._lbClose(); });
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox && lightbox._lbClose) lightbox._lbClose(); });
      document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('is-active') || !lightbox.classList.contains('has-nav')) return;
        if (e.key === 'Escape')          { if (lightbox._lbClose) lightbox._lbClose(); }
        else if (e.key === 'ArrowLeft')  { if (lightbox._lbShow) lightbox._lbShow((lightbox._lbIndex || 0) - 1); }
        else if (e.key === 'ArrowRight') { if (lightbox._lbShow) lightbox._lbShow((lightbox._lbIndex || 0) + 1); }
      });
    }

    /* Per-init: bind click on each (freshly rendered) gallery image. */
    galleryImgs.forEach(function (img, i) {
      img.addEventListener('click', function (e) {
        if (window.innerWidth < 992) return;
        e.preventDefault();
        lbOpen(i);
      });
    });
  }

};
