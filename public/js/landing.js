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

    /* Mobile only: reparent real .trust-item elements into sticky-viewport for
       the scroll animation. They stagger in below the bottle, then exit upward
       with it. .conversion-booster-wrapper is display:none on mobile via CSS,
       so these items only live in the animation — they never return. */
    let trustContainer = null;
    if (!isDesktop) {
      const trustRibbonEl = document.querySelector('.trust-ribbon');
      if (trustRibbonEl) {
        const trustItemEls = Array.from(trustRibbonEl.querySelectorAll('.trust-item'));
        if (trustItemEls.length) {
          trustContainer = document.createElement('div');
          trustContainer.setAttribute('aria-hidden', 'true');
          trustContainer.style.cssText = 'position:absolute;top:0;left:0;right:0;pointer-events:none;z-index:12;display:flex;flex-direction:column;align-items:center;gap:18px;padding:0 20px;will-change:transform,opacity;';

          trustItemEls.forEach(function (item) {
            gsap.set(item, { opacity: 0, y: 15 });
            trustContainer.appendChild(item);
          });
          stickyVP.appendChild(trustContainer);

          function trustContainerY() {
            var e = endProps();
            return e.y + e.h + 24;
          }
          gsap.set(trustContainer, { y: function () { return trustContainerY(); } });

          /* Staggered entrance after bottle arrives at centre */
          tl.to(trustItemEls, {
            opacity:  1,
            y:        0,
            duration: 0.6,
            stagger:  0.15,
            ease:     'power2.out',
          }, 3.2);

          /* Exit upward with bottle — no opacity fade, clips naturally through
             sticky-viewport overflow:hidden when it reaches y < 0. */
          tl.to(trustContainer, {
            y:        function () { return trustContainerY() - window.innerHeight * riseAmt; },
            duration: riseDur,
            ease:     'power1.in',
          }, riseStart);
        }
      }
    }

    return function () {
      if (fly.parentNode)  fly.parentNode.removeChild(fly);
      if (glow.parentNode) glow.parentNode.removeChild(glow);
      if (trustContainer && trustContainer.parentNode) trustContainer.parentNode.removeChild(trustContainer);
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

    /* Phase 3: Cards drift upward — shorter distance + gentler ease so the
       exit reads as ONE unified rise together with the bottle (which trails
       just slightly behind), instead of the cards rocketing off ahead. */
      .to('.float-img',         { y: '-75vh', duration: 3.2, ease: 'power1.in' }, 5.4)

    /* Phase 4: Hero + bottle rise WITH the cards, lagging only slightly. */
      .to('.scalable-hero',     { y: function () { return computeHeroCenterY(55) - window.innerHeight * 0.55; },
                                  duration: 3.2, ease: 'power1.in' }, 5.7);

    return createFlyingBottle(tl, true, 5.7, 3.2, 0.55);
  });

  mm.add('(max-width: 991px)', function () {
    if (reducedMotion) return;

    /* 210dvh = 110dvh of scrub range for the 9.5-unit mobile timeline; at the
       CSS fallback height the whole choreography flashed past in ~40dvh. */
    const scrollTrack = document.getElementById('scrollTrack');
    if (scrollTrack) scrollTrack.style.height = '210dvh';

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
                                  duration: 3.0, ease: 'power1.in' }, 5.0);

    const btlCleanup = createFlyingBottle(tlMobile, false, 5.0, 4.5, 0.3);

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
     DESKTOP BRIDGE BOTTLE SCENE — big, glowing, screen-filling.
     The product section is STATIC (cards + payment + trust always visible).
     After it, this bottle scene fills the viewport with a large bottle wrapped
     in a warm gold halo to grab attention, then rises with the scroll into the
     Manifest. ("Das tägliche Ritual" usage text sits directly beneath it.)
     ========================================================================= */
  function setupDesktopBridge(bWrap) {
    if (reducedMotion || !bWrap) return;
    const img = bWrap.querySelector('img');
    if (!img) return;

    /* Big bottle — fills most of the viewport height. */
    img.style.width    = 'auto';
    img.style.height   = Math.round(window.innerHeight * 0.74) + 'px';
    img.style.maxWidth = '90vw';
    img.style.position = 'relative';
    img.style.zIndex   = '2';
    img.style.filter   = 'drop-shadow(0 0 60px rgba(237,163,35,0.42)) drop-shadow(0 0 140px rgba(237,163,35,0.20))';

    /* Scene wrapper becomes a (near) full-height stage. 80vh, not 92vh —
       combined with the parallax drift the taller stage left a black hole
       between the bottle and the "Das tägliche Ritual" trailing text. */
    bWrap.style.position  = 'relative';
    bWrap.style.minHeight = '80vh';
    bWrap.style.padding   = '0';
    bWrap.style.overflow  = 'visible';

    /* Warm gold halo behind the bottle. */
    let glow = bWrap.querySelector('.bridge-glow');
    if (!glow) {
      glow = document.createElement('div');
      glow.className = 'bridge-glow';
      glow.setAttribute('aria-hidden', 'true');
      var glowSize = 'min(100vh, 92vw)';
      glow.style.cssText =
        'position:absolute;top:50%;left:50%;width:' + glowSize + ';height:' + glowSize + ';' +
        'transform:translate(-50%,-50%);z-index:1;pointer-events:none;border-radius:50%;' +
        'background:radial-gradient(circle at center,rgba(237,163,35,0.26) 0%,' +
        'rgba(237,163,35,0.12) 36%,rgba(237,163,35,0.04) 56%,transparent 70%);';
      bWrap.insertBefore(glow, img);
    }
  }

  function cleanupDesktopBridge(bWrap) {
    if (!bWrap) return;
    const img = bWrap.querySelector('img');
    if (img) {
      img.style.width = ''; img.style.height = ''; img.style.maxWidth = '';
      img.style.position = ''; img.style.zIndex = ''; img.style.filter = '';
    }
    bWrap.style.position = ''; bWrap.style.minHeight = ''; bWrap.style.padding = '30px 0'; bWrap.style.overflow = '';
    const glow = bWrap.querySelector('.bridge-glow');
    if (glow && glow.parentNode) glow.parentNode.removeChild(glow);
  }

  /* Gentle parallax — the whole bottle scene drifts upward as it scrolls,
     leading the eye out of the product block and up into the Manifest. */
  function attachBridgeBottleRiseDesktop(bWrap) {
    if (reducedMotion || !bWrap) return;
    /* Drift kept gentle (6 → -12): the old -30 endpoint pulled the bottle a
       quarter-viewport up and opened a black gap before the trailing text. */
    gsap.fromTo(bWrap,
      { yPercent: 6 },
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

  function attachProductCardsExitMobile(pinDuration, bridgeWrap, glassEls) {
    if (reducedMotion) return null;

    const section = document.getElementById('ritual-products');
    if (!section) return null;

    const productCards = section.querySelectorAll('.premium-product-card');
    if (productCards.length < 3) return null;

    const [starter, habit, protocol] = productCards;
    productCards.forEach(function (c) { c.style.transition = 'border-color var(--t-base) ease'; });

    const trailingInfo = section.querySelector('.shop-trailing-info');
    const paymentGroup = section.querySelector('.ritual-payment-group');
    const trailUnit    = [trailingInfo, paymentGroup].filter(Boolean);

    const margin    = function () { return parseFloat(getComputedStyle(starter).marginBottom) || 40; };
    const card1Lift = function () { return -(starter.offsetHeight + margin()); };
    const card2Lift = function () { return -(starter.offsetHeight + habit.offsetHeight + 2 * margin()); };

    /* The pin spacer reserves the section's FULL height (3 visible cards),
       but at pin end the cards are display:none — without compensation the
       user scrolls through ~2 viewports of dead black between the payment
       icons and the Manifest. Pull the editorial wrapper up by the height
       the hidden cards used to occupy. Static (set before the editorial
       ScrollTriggers are created) so all downstream trigger positions are
       computed against the corrected layout. */
    const editorialWrap = document.querySelector('.dynamic-editorial-wrapper');
    if (editorialWrap) {
      const collapsed = Math.round(
        starter.offsetHeight + habit.offsetHeight + protocol.offsetHeight + 3 * margin()
      );
      editorialWrap.style.marginTop = -Math.max(0, collapsed) + 'px';
    }

    const stConfig = pinScrollTrigger(section, pinDuration, undefined, 0.8);
    stConfig.onLeave = function () {
      tl.progress(1, false);
      gsap.set([starter, habit, protocol], { display: 'none' });
      gsap.set(trailUnit, { y: 0 });
    };
    stConfig.onLeaveBack = function () {
      gsap.set([starter, habit, protocol], { clearProps: 'display' });
      gsap.set(trailUnit, { clearProps: 'y' });
    };

    const tl = gsap.timeline({ scrollTrigger: stConfig });

    if (bridgeWrap) {
      gsap.set(bridgeWrap, { opacity: 0 });
      if (glassEls) gsap.set(glassEls.glassWrap, { opacity: 0, y: 20 });
      tl.set([starter, habit, protocol], { display: 'none' }, 0.78);
      tl.set(trailUnit, { y: 0 }, 0.78);
      /* bridgeWrap (bottle + glass container) snaps visible */
      tl.to(bridgeWrap, { opacity: 1, duration: 0.02, ease: 'none' }, 0.79);
    }

    /* Timeline (pinDuration 3000px → each 0.01 = 30px of scroll):
         0.05 → 0.29   Starter exits  + lift Habit/Protocol/trail (~720px)
         0.30 → 0.53   Habit   exits  + lift Protocol/trail       (~690px)
         0.54 → 0.77   Protocol exits                             (~690px)
         0.76           cards display:none + trailUnit y:0
         0.77           bridgeWrap snaps visible
         0.78 → 0.95   glass animation                            (~510px)
         0.95 → 1.00   bridgeWrap exits upward → Manifest follows (~150px) */
    const liftAll1 = [habit, protocol].concat(trailUnit);
    const liftAll2 = [protocol].concat(trailUnit);

    tl.to(starter,   { xPercent: -160, opacity: 0, ease: 'power2.in',    duration: 0.24 }, 0.05)
      .to(liftAll1,  { y: card1Lift,               ease: 'power1.inOut', duration: 0.24 }, 0.05)
      .to(habit,     { xPercent:  160, opacity: 0, ease: 'power2.in',    duration: 0.24 }, 0.30)
      .to(liftAll2,  { y: card2Lift,               ease: 'power1.inOut', duration: 0.24 }, 0.30)
      .to(protocol,  { xPercent:  160, opacity: 0, ease: 'power2.in',    duration: 0.24 }, 0.54);

    if (glassEls) {
      const { glassWrap, juice, spoon, d1, d2, d3, lbl } = glassEls;
      /* glass slides up into view */
      tl.to(glassWrap, { opacity: 1, y: 0, duration: 0.07, ease: 'power2.out' }, 0.78);
      /* amber juice pours in */
      tl.to(juice, { attr: { y: 60 }, duration: 0.22, ease: 'power1.inOut' }, 0.80);
      /* water drops fall in (staggered) */
      tl.set(d1, { opacity: 1 }, 0.860); tl.to(d1, { attr: { cy: 100 }, opacity: 0, duration: 0.04, ease: 'power2.in' }, 0.860);
      tl.set(d2, { opacity: 1 }, 0.876); tl.to(d2, { attr: { cy:  90 }, opacity: 0, duration: 0.04, ease: 'power2.in' }, 0.876);
      tl.set(d3, { opacity: 1 }, 0.890); tl.to(d3, { attr: { cy:  96 }, opacity: 0, duration: 0.03, ease: 'power2.in' }, 0.890);
      /* juice rises a touch as water is added */
      tl.to(juice, { attr: { y: 50 }, duration: 0.03, ease: 'power2.out' }, 0.874);
      /* spoon + label appear */
      tl.to(spoon, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0.900);
      tl.to(lbl,   { opacity: 1, duration: 0.05, ease: 'power2.out' }, 0.902);
      /* spoon stirs — 3 oscillations */
      tl.to(spoon, { rotation:  12, duration: 0.022, ease: 'power1.inOut' }, 0.912);
      tl.to(spoon, { rotation: -11, duration: 0.025, ease: 'power1.inOut' }, 0.922);
      tl.to(spoon, { rotation:   9, duration: 0.022, ease: 'power1.inOut' }, 0.934);
      tl.to(spoon, { rotation:   0, duration: 0.018, ease: 'power1.out'   }, 0.944);
    }

    /* Exit upward — bottle + glass fly off screen, Manifest follows immediately */
    if (bridgeWrap) {
      tl.to(bridgeWrap, { y: -80, opacity: 0, duration: 0.05, ease: 'power2.in' }, 0.95);
    }

    return function () {
      gsap.set(Array.from(productCards), { clearProps: 'display,xPercent,opacity' });
      gsap.set(trailUnit, { clearProps: 'y' });
      if (editorialWrap) editorialWrap.style.marginTop = '';
    };
  }

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

  /* =========================================================================
     GLASS RITUAL — injected INTO the existing bridgeWrap (mobile only).
     Bottle (already in bridgeWrap) shrinks to sit left; SVG glass appears
     to its right. Juice pours in, water drops fall, spoon stirs, "1:10"
     label fades in — all as part of the product-cards-exit timeline.
     No new section, no new ScrollTrigger.
     ========================================================================= */

  function injectGlassIntoBridge(bWrap) {
    if (!bWrap) return null;
    const btl = bWrap.querySelector('img');
    if (!btl) return null;

    /* Resize bottle — larger than before, fits side-by-side with the glass */
    btl.style.width  = '110px';
    btl.style.height = '220px';

    /* Wrap bottle + glass in a horizontal pair row, then make bWrap a column
       so the "1:10" label can sit fixed at the screen bottom via absolute pos */
    const pairWrap = document.createElement('div');
    pairWrap.style.cssText = 'display:flex;align-items:center;gap:36px;';
    bWrap.insertBefore(pairWrap, btl);
    pairWrap.appendChild(btl);

    /* Glass (90×155) — proportionally larger than before */
    const glassWrap = document.createElement('div');
    glassWrap.style.cssText = 'position:relative;width:90px;height:155px;flex-shrink:0;opacity:0;will-change:opacity,transform;';

    glassWrap.innerHTML =
      '<svg viewBox="0 0 90 155" width="90" height="155" overflow="visible" style="display:block;">' +
        '<defs>' +
          '<clipPath id="grb-clip">' +
            '<path d="M11,6 L79,6 L71,148 Q70,153 63,153 L27,153 Q20,153 19,148 Z"/>' +
          '</clipPath>' +
        '</defs>' +
        '<rect id="grb-juice" x="0" y="153" width="90" height="153" fill="rgba(237,163,35,0.82)" clip-path="url(#grb-clip)"/>' +
        '<path d="M11,6 L79,6 L71,148 Q70,153 63,153 L27,153 Q20,153 19,148 Z" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<ellipse cx="45" cy="6" rx="34" ry="6" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>' +
        '<path d="M23,24 Q25,70 23,116" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" stroke-linecap="round"/>' +
        '<ellipse id="grb-d1" cx="45" cy="-14" rx="4.5" ry="6.2" fill="rgba(160,210,255,0.75)" opacity="0"/>' +
        '<ellipse id="grb-d2" cx="36" cy="-24" rx="3.5" ry="5"   fill="rgba(160,210,255,0.7)"  opacity="0"/>' +
        '<ellipse id="grb-d3" cx="55" cy="-19" rx="3"   ry="4.5" fill="rgba(160,210,255,0.7)"  opacity="0"/>' +
      '</svg>' +
      '<div id="grb-spoon" style="position:absolute;top:2px;right:-14px;width:22px;height:120px;opacity:0;transform-origin:50% 18%;will-change:transform,opacity;">' +
        '<svg viewBox="0 0 22 120" width="22" height="120">' +
          '<ellipse cx="11" cy="12" rx="9" ry="11" fill="rgba(237,163,35,0.5)" stroke="rgba(237,163,35,0.75)" stroke-width="1.5"/>' +
          '<line x1="11" y1="23" x2="11" y2="116" stroke="rgba(237,163,35,0.65)" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>' +
      '</div>';

    pairWrap.appendChild(glassWrap);

    /* bWrap becomes a column: pair centred, label pinned to the screen bottom */
    bWrap.style.flexDirection  = 'column';
    bWrap.style.justifyContent = 'center';
    bWrap.style.minHeight      = '68vh';
    bWrap.style.padding        = '32px 20px 88px';
    bWrap.style.position       = 'relative';

    /* "1:10" label — absolute to bWrap, visually at the screen bottom */
    const lbl = document.createElement('div');
    lbl.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);text-align:center;opacity:0;white-space:nowrap;will-change:opacity;';
    lbl.innerHTML =
      '<div style="font-family:var(--font-heading,\'Playfair Display\',serif);font-size:26px;font-weight:700;color:rgba(237,163,35,0.92);letter-spacing:5px;">1 : 10</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.52);letter-spacing:4px;margin-top:6px;text-transform:uppercase;">Das tägliche Ritual</div>';
    bWrap.appendChild(lbl);

    const juice = glassWrap.querySelector('#grb-juice');
    const spoon = glassWrap.querySelector('#grb-spoon');
    const d1    = glassWrap.querySelector('#grb-d1');
    const d2    = glassWrap.querySelector('#grb-d2');
    const d3    = glassWrap.querySelector('#grb-d3');

    return {
      glassWrap: glassWrap,
      juice: juice, spoon: spoon,
      d1: d1, d2: d2, d3: d3,
      lbl: lbl,
      cleanup: function () {
        btl.style.width  = '';
        btl.style.height = '';
        /* Move bottle back to bWrap, then remove pairWrap */
        bWrap.insertBefore(btl, pairWrap);
        if (pairWrap.parentNode) pairWrap.parentNode.removeChild(pairWrap);
        if (lbl.parentNode)      lbl.parentNode.removeChild(lbl);
        bWrap.style.flexDirection  = '';
        bWrap.style.minHeight      = '';
        bWrap.style.padding        = '30px 0';
        bWrap.style.position       = '';
      }
    };
  }

  /* pinScrollTrigger shared with desktop editorial; not used for mobile product. */
  mm.add('(min-width: 992px)', function () {
    var section    = document.getElementById('ritual-products');
    var cardsGroup = section && section.querySelector('.ritual-cards-group');
    var trustBand  = section && section.querySelector('.conversion-booster-wrapper');
    var payment    = section && section.querySelector('.ritual-payment-group');
    var trailing   = section && section.querySelector('.shop-trailing-info');

    /* Desktop STATIC order: cards → payment → (breathing gap) trust →
       big bottle scene → "Das tägliche Ritual" trailing. Payment + trust are
       permanent parts of the product block (always visible, never revealed at
       the end). The cards compact via CSS so it all fits the viewport. */
    if (cardsGroup && payment)   cardsGroup.after(payment);
    if (payment && trustBand)    payment.after(trustBand);
    if (trustBand && bridgeWrap) trustBand.after(bridgeWrap);
    if (bridgeWrap && trailing)  bridgeWrap.after(trailing);

    if (bridgeWrap) gsap.set(bridgeWrap, { opacity: 1, clearProps: 'scale,filter,y' });
    setupDesktopBridge(bridgeWrap);
    attachBridgeBottleRiseDesktop(bridgeWrap);

    return function () {
      cleanupDesktopBridge(bridgeWrap);
      /* Restore mobile DOM order: cards, trust, bottle(before trailing), trailing, payment. */
      if (cardsGroup && trustBand) cardsGroup.after(trustBand);
      if (trustBand && trailing)   trustBand.after(trailing);
      if (trailing && payment)     trailing.after(payment);
      if (bridgeWrap && trailing)  trailing.before(bridgeWrap);
      if (bridgeWrap) gsap.set(bridgeWrap, { clearProps: 'opacity,scale,filter,yPercent,y' });
    };
  });
  mm.add('(max-width: 991px)', function () {
    var glassEls          = injectGlassIntoBridge(bridgeWrap);
    var mobileProdCleanup = attachProductCardsExitMobile(3000, bridgeWrap, glassEls);
    return function () {
      if (mobileProdCleanup) mobileProdCleanup();
      if (glassEls)          glassEls.cleanup();
      if (bridgeWrap) gsap.set(bridgeWrap, { clearProps: 'opacity,y' });
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
      /* NO filter transition — every transition between filter states caused
         a brief gray flash (the browser re-rasterises the layer, blending
         the placeholder + dark overlay through whatever intermediate filter
         state is mid-interpolation). Only scale the bg; keep it at the CSS
         default filter the entire animation — user explicitly asked for
         "100% original image" during the animation. */
      tl.to(block.bg, {
        scale:  1.04,
        ease:  'power1.in',
        duration: 0.65
      }, 0.12);
    }

    const innerBlock = block.wrapper.querySelector('.nature-hero-block');
    if (innerBlock) {
      /* Slow evaporation — spans last 30% of pin (was 17%) so the Manifest
         block stays visible longer while user scrolls past the shatter. The
         visual overlap with the approaching Ritual block (positioned 100px
         below in flow on mobile) makes the section handoff feel quicker.
         Opacity-only — NO scale tween (would clobber mobile fit-to-viewport). */
      tl.to(innerBlock, {
        opacity: 0,
        ease:   'power1.in',
        duration: 0.30
      }, 0.70);
    }
  }

  function attachRitualEruption(block, maxDist, pinDuration, startStr) {
    if (reducedMotion || !block.wrapper || !block.shards.length) return;

    /* On mobile we MUST skip the expensive per-shard effects (textShadow,
       filter blur, rotation, scale up + scale down) — running them on 50-80
       shards simultaneously was overheating the phone. Mobile gets a lean
       version: color tint for the gold mood + outward/upward translate +
       opacity fade. Desktop keeps the full eruption choreography. */
    const isLight = window.matchMedia('(max-width: 991px)').matches;

    /* Volcano vectors: angles distributed in the UPPER hemisphere only
       (-150° to -30°, where -90° is straight up), so all shards erupt
       skyward with horizontal spread. */
    const vectors = block.shards.map(function (_, i) {
      const angleDeg = -150 + ((i * 47) % 121); /* -150 .. -30 inclusive */
      const rad      = angleDeg * Math.PI / 180;
      const dist     = (maxDist * 0.5) + (i * 37) % (maxDist * 0.5);
      return {
        x:   Math.cos(rad) * dist,
        y:   Math.sin(rad) * dist,
        rot: isLight ? 0 : (((i * 29) % 120) - 60)
      };
    });

    const tl = gsap.timeline({ scrollTrigger: pinScrollTrigger(block.wrapper, pinDuration, startStr) });

    /* Phase 1 (0.12 → 0.40): GLOW. Words tint gold.
       Desktop adds scale + textShadow for the "energy charging" feel. */
    const glowProps = { color: '#FFD56B', ease: 'power1.inOut', duration: 0.28 };
    if (!isLight) {
      glowProps.scale = 1.28;
      glowProps.textShadow = '0 0 18px rgba(255, 213, 107, 0.85), 0 0 36px rgba(237, 163, 35, 0.55)';
      glowProps.stagger = { each: 0.004, from: 'random' };
    }
    tl.to(block.shards, glowProps, 0.12);

    if (block.bg) {
      tl.to(block.bg, { scale: 1.03, ease: 'power1.inOut', duration: 0.28 }, 0.12);
    }

    /* Phase 2 (0.40 → 0.83): ERUPT.
       Mobile: just translate + opacity. Desktop also rotates, scales down,
       and blurs each shard. */
    block.shards.forEach(function (shard, i) {
      const v = vectors[i];
      const eruptProps = {
        x: v.x, y: v.y,
        opacity: 0,
        ease: 'power2.in',
        duration: 0.40
      };
      if (!isLight) {
        eruptProps.rotation = v.rot;
        eruptProps.scale    = 0.25;
        eruptProps.filter   = 'blur(5px)';
      }
      tl.to(shard, eruptProps, 0.40 + i * 0.005);
    });

    if (block.bg) {
      tl.to(block.bg, { scale: 1.06, ease: 'power1.in', duration: 0.43 }, 0.40);
    }

    /* Phase 3 (0.70 → 1.00): SLOW EVAPORATE. Extended from 0.17 → 0.30 duration
       so the Ritual block stays visible while user scrolls toward Exclusive
       Sourcing — the visual overlap with the approaching next section makes
       the handoff feel quicker, not draggy. Opacity-only so the mobile
       fit-to-viewport inline transform on .nature-hero-block survives. */
    const innerBlock = block.wrapper.querySelector('.nature-hero-block');
    if (innerBlock) {
      tl.to(innerBlock, { opacity: 0, ease: 'power1.in', duration: 0.30 }, 0.70);
    }
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

  /* Editorial pin position — visually centered in the area BELOW the
     topbar. Returns a function so ScrollTrigger.invalidateOnRefresh
     re-measures on resize (block content height varies with localized
     text and viewport width). Guarantees min 40px gap from topbar so the
     block never tucks under nav/aktion-bar. */
  function editorialPinStart(wrapper) {
    return function () {
      const cs      = getComputedStyle(document.documentElement);
      const navH    = parseFloat(cs.getPropertyValue('--nav-height'))    || 80;
      const aktionH = parseFloat(cs.getPropertyValue('--aktion-height')) || 0;
      const topBar  = navH + aktionH;
      const availV  = window.innerHeight - topBar;
      const blockH  = wrapper.offsetHeight;
      const buffer  = Math.max(40, Math.round((availV - blockH) / 2));
      return 'top top+=' + (topBar + buffer);
    };
  }

  /* On mobile, if a block is too tall to fit under the topbar with
     breathing room, scale it down via CSS transform on .nature-hero-block.
     GSAP animates ONLY the .nature-hero-bg / shards / wrapper opacity, so
     setting a base scale on the block itself does NOT conflict with the
     timeline (different targets). */
  function fitBlockToViewport(block) {
    const inner = block.wrapper.querySelector('.nature-hero-block');
    if (!inner) return;
    inner.style.transform = '';
    inner.style.transformOrigin = '';

    const cs      = getComputedStyle(document.documentElement);
    const navH    = parseFloat(cs.getPropertyValue('--nav-height'))    || 80;
    const aktionH = parseFloat(cs.getPropertyValue('--aktion-height')) || 0;
    const availV  = window.innerHeight - navH - aktionH - 80; /* 80px total breathing room */
    const naturalH = inner.offsetHeight;
    if (naturalH > availV) {
      const scale = availV / naturalH;
      inner.style.transformOrigin = 'top center';
      inner.style.transform = 'scale(' + scale + ')';
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
    if (editorialBlocks[0]) {
      fitBlockToViewport(editorialBlocks[0]);
      attachManifestShatter(editorialBlocks[0], 220, 800, editorialPinStart(editorialBlocks[0].wrapper));
    }
    /* 'top bottom' fires as soon as Das Ritual enters the viewport from below,
       so there is no black gap between Manifest pin end and Ritual fade-in. */
    if (editorialBlocks[1]) attachRitualReveal(editorialBlocks[1], 'top bottom');
    return function () {
      if (editorialBlocks[0]) {
        var inner = editorialBlocks[0].wrapper.querySelector('.nature-hero-block');
        if (inner) { inner.style.transform = ''; inner.style.transformOrigin = ''; }
      }
    };
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
