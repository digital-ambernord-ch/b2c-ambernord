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

    /* Phase 3: Cards exit upward fast */
      .to('.float-img',         { y: '-100vh', duration: 2.5, ease: 'power2.in' }, 5.2)

    /* Phase 4: Hero rises another 20vh from its centred resting point */
      .to('.scalable-hero',     { y: function () { return computeHeroCenterY(55) - window.innerHeight * 0.2; },
                                  duration: 2.5, ease: 'power2.in' }, 5.0);

    return createFlyingBottle(tl, true, 5.0, 2.5, 0.2);
  });

  mm.add('(max-width: 991px)', function () {
    if (reducedMotion) return;

    const scrollTrack = document.getElementById('scrollTrack');
    if (scrollTrack) scrollTrack.style.height = '140dvh';

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

  function attachProductCardsExitDesktop(pinDuration, bridgeWrap) {
    if (reducedMotion) return;

    const section = document.getElementById('ritual-products');
    if (!section) return;

    const productCards = section.querySelectorAll('.premium-product-card');
    if (productCards.length < 3) return;

    const [starter, habit, protocol] = productCards;
    productCards.forEach(function (c) { c.style.transition = 'border-color var(--t-base) ease'; });

    const trailingInfo = section.querySelector('.shop-trailing-info');
    const paymentGroup = section.querySelector('.ritual-payment-group');
    const trailUnit    = [trailingInfo, paymentGroup].filter(Boolean);

    const stConfig = pinScrollTrigger(section, pinDuration);
    stConfig.onLeave = function () {
      /* Cards are invisible (opacity:0 from exits) but still occupy layout space.
         Hiding them lets shopHeading + bridgeWrap + trailingInfo flow without gap. */
      gsap.set([starter, habit, protocol], { display: 'none' });
    };
    stConfig.onLeaveBack = function () {
      gsap.set([starter, habit, protocol], { clearProps: 'display,xPercent,opacity' });
      gsap.set(trailUnit, { clearProps: 'y' });
      if (bridgeWrap) gsap.set(bridgeWrap, { opacity: 0 });
    };

    const tl = gsap.timeline({ scrollTrigger: stConfig });

    /* Lift trailing info into the pinned viewport while cards animate out.
       The section may be taller than the viewport — animate trailUnit upward
       so it remains visible throughout the pin. */
    if (trailUnit.length) {
      var liftY = function () {
        var excess = section.offsetHeight - (window.innerHeight - pinTopOffset()) + 20;
        return excess > 0 ? -excess : 0;
      };
      tl.to(trailUnit, { y: liftY, ease: 'power1.out', duration: 0.50 }, 0.12);
    }

    tl.to(starter,  { xPercent: -160, opacity: 0, ease: 'power2.in', duration: 0.30 }, 0.12)
      .to(habit,    { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.30 }, 0.30)
      .to(protocol, { xPercent:  160, opacity: 0, ease: 'power2.in', duration: 0.30 }, 0.48);

    if (bridgeWrap) {
      gsap.set(bridgeWrap, { opacity: 0 });
      tl.to(bridgeWrap, { opacity: 1, duration: 0.25, ease: 'power1.out' }, 0.78);
    }
  }

  function attachProductCardsExitMobile(pinDuration, bridgeWrap) {
    if (reducedMotion) return null;

    const section = document.getElementById('ritual-products');
    const shop    = document.getElementById('shop');
    if (!section || !shop) return null;

    const productCards = section.querySelectorAll('.premium-product-card');
    if (productCards.length < 3) return null;

    const [starter, habit, protocol] = productCards;
    productCards.forEach(function (c) { c.style.transition = 'border-color var(--t-base) ease'; });

    /* CSS sticky replaces GSAP pin:true.
       Sticky releases when the section's bottom exits the parent:
         release_scroll = shop.top + shop.height - section.height - stickyTop
       We want release_scroll === ScrollTrigger end scroll, so:
         shop.minHeight = hOrig + pinDuration
       where hOrig = section.offsetHeight with all 3 cards visible.
       Using hSmall instead caused the sticky to release ~halfway through
       the animation (when hOrig >> hSmall, sticky exit was far too early). */
    const stickyTop      = pinTopOffset();
    section.style.position = 'sticky';
    section.style.top      = stickyTop + 'px';
    const hOrig          = section.offsetHeight;
    const hOrigMinHeight = hOrig + pinDuration;
    shop.style.minHeight = hOrigMinHeight + 'px';

    const trailingInfo = section.querySelector('.shop-trailing-info');
    const paymentGroup = section.querySelector('.ritual-payment-group');
    const trailUnit    = [trailingInfo, paymentGroup].filter(Boolean);

    const margin    = function () { return parseFloat(getComputedStyle(starter).marginBottom) || 40; };
    const card1Lift = function () { return -(starter.offsetHeight + margin()); };
    const card2Lift = function () { return -(starter.offsetHeight + habit.offsetHeight + 2 * margin()); };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start:   'top top+=' + stickyTop,
        end:     '+=' + pinDuration,
        scrub:   0.8,
        /* Snap to final/initial state immediately when scroll goes beyond the
           trigger boundaries — prevents partially-visible cards when sticky
           releases (scrub lag would otherwise leave cards mid-animation). */
        onLeave: function () {
          tl.progress(1, false);
          gsap.set([starter, habit, protocol], { display: 'none' });
          gsap.set(trailUnit, { y: 0 });
          /* Cards are now display:none → section shrank to hSmall.
             Trim minHeight so sticky releases at current scroll position
             (no dead scroll). Then refresh all ScrollTriggers so editorial
             blocks recalculate their trigger positions after the layout shift. */
          shop.style.minHeight = Math.round(section.offsetHeight - shop.getBoundingClientRect().top + stickyTop) + 'px';
          requestAnimationFrame(function () { ScrollTrigger.refresh(); });
        },
        onLeaveBack: function () {
          tl.progress(0, false);
          gsap.set([starter, habit, protocol], { clearProps: 'display,xPercent,opacity' });
          gsap.set(trailUnit, { clearProps: 'y' });
          /* Restore original minHeight so the sticky animation range is intact
             when scrolling back; refresh so editorial positions update too. */
          shop.style.minHeight = hOrigMinHeight + 'px';
          requestAnimationFrame(function () { ScrollTrigger.refresh(); });
        },
      }
    });

    if (bridgeWrap) {
      gsap.set(bridgeWrap, { opacity: 0 });
      /* At 0.89: hide cards + snap trailUnit to y:0 so Das tägliche Ritual
         appears simultaneously with the bridge bottle. BridgeWrap fades in
         immediately after (0.90), and the timeline ends at 1.00 = pin ends
         with zero dead scroll — section starts scrolling upward instantly. */
      tl.set([starter, habit, protocol], { display: 'none' }, 0.89);
      tl.set(trailUnit, { y: 0 }, 0.89);
      tl.to(bridgeWrap, { opacity: 1, duration: 0.10, ease: 'power1.out' }, 0.90);
    }

    /* Timeline:
         0.05 → 0.35   Starter exits + Habit/Protocol/trail-unit lift
         0.36 → 0.66   Habit   exits + Protocol/trail-unit lift
         0.66 → 0.96   Protocol exits
         0.89          cards display:none + trailUnit y:0 (both appear together)
         0.90 → 1.00   bridgeWrap fade in → pin ends immediately after          */
    const liftAll1 = [habit, protocol].concat(trailUnit);
    const liftAll2 = [protocol].concat(trailUnit);

    tl.to(starter,   { xPercent: -160, opacity: 0, ease: 'power2.in',    duration: 0.30 }, 0.05)
      .to(liftAll1,  { y: card1Lift,               ease: 'power1.inOut', duration: 0.30 }, 0.05)
      .to(habit,     { xPercent:  160, opacity: 0, ease: 'power2.in',    duration: 0.30 }, 0.36)
      .to(liftAll2,  { y: card2Lift,               ease: 'power1.inOut', duration: 0.30 }, 0.36)
      .to(protocol,  { xPercent:  160, opacity: 0, ease: 'power2.in',    duration: 0.30 }, 0.66);

    return function () {
      section.style.position = '';
      section.style.top      = '';
      shop.style.minHeight   = '';
      gsap.set([starter, habit, protocol], { clearProps: 'display' });
      gsap.set(trailUnit, { clearProps: 'y' });
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
    wrap.style.cssText = 'display:flex;justify-content:center;align-items:center;width:100%;padding:30px 0;opacity:0;will-change:opacity;';

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
    attachProductCardsExitDesktop(1000, bridgeWrap);
    return function () {
      var section = document.getElementById('ritual-products');
      if (section) {
        var cards    = section.querySelectorAll('.premium-product-card');
        var trailing = section.querySelector('.shop-trailing-info');
        var payment  = section.querySelector('.ritual-payment-group');
        gsap.set(Array.from(cards), { clearProps: 'display,xPercent,opacity' });
        if (trailing) gsap.set(trailing, { clearProps: 'y' });
        if (payment)  gsap.set(payment,  { clearProps: 'y' });
      }
      if (bridgeWrap) gsap.set(bridgeWrap, { clearProps: 'opacity' });
    };
  });
  mm.add('(max-width: 991px)', function () {
    var mobileProdCleanup = attachProductCardsExitMobile(1500, bridgeWrap);
    return function () {
      if (mobileProdCleanup) mobileProdCleanup();
      if (bridgeWrap) gsap.set(bridgeWrap, { clearProps: 'opacity,scale' });
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

  mm.add('(min-width: 992px)', function () {
    if (editorialBlocks[0]) attachManifestShatter(editorialBlocks[0], 550, 1000, editorialPinStart(editorialBlocks[0].wrapper));
    /* Ritual converted to plain scroll-reveal — pin and word eruption removed. */
    if (editorialBlocks[1]) attachRitualReveal(editorialBlocks[1]);
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
