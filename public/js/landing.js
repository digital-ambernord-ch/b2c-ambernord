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

  /* Landing-only topbar state: hide the topbar EU-bio badge while the hero's
     own bio leaf is on screen (only ONE bio mark at a time — CSS rule in
     main.css). The router removes the class on every navigation; the bio
     badge toggle below removes it mid-scroll once the hero text is gone. */
  document.documentElement.classList.add('landing-hero-active');

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

  /* Force 3D-promoted transforms on every animated element so simultaneous
     tweens (hero shrink + flying bottle + reveals) run on the GPU compositor
     instead of the CPU — avoids stutter on slower phones. */
  gsap.config({ force3D: true });

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
    /* Reduced motion: no choreography → no scrub range. Collapse the track to
       one viewport so there is no dead pinned scroll (mirrors the mobile path).
       The float cards stay at their CSS resting state, covered by the
       full-size hero (z-index 10 vs workspace 5), so nothing flashes. */
    const scrollTrackDesk = document.getElementById('scrollTrack');
    const deskSvhOk = (window.CSS && CSS.supports && CSS.supports('height', '1svh'));
    if (reducedMotion) {
      if (scrollTrackDesk) scrollTrackDesk.style.height = deskSvhOk ? '100svh' : '100vh';
      return function () {
        if (scrollTrackDesk) scrollTrackDesk.style.height = '';
      };
    }

    /* CSS no longer hides the float cards (content must be visible without
       JS) — apply the pre-pop hidden state here, JS-only, so phase 1 (hero
       shrink) doesn't expose six static cards before their pop-in at 3.2.
       Only the VISIBLE cards are animated: in the 992–1399px laptop bands the
       two image-only .visual-card tiles are display:none (landing.css), and
       tweening hidden elements would corrupt the stagger rhythm. */
    const floatCards = gsap.utils.toArray('.float-img').filter(function (el) {
      return el.offsetParent !== null;
    });
    gsap.set(floatCards, { scale: 0.1, opacity: 0 });

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
      .to('#heroWatermark',     { opacity: 0, duration: 1, ease: 'power1.in' }, 0.3)
      .to('#heroCert',          { opacity: 0, duration: 1, ease: 'power1.in' }, 0.3)
      .to('#ambernordHeroShade',{ opacity: 0, duration: 1, ease: 'none' }, 0.8)

    /* Phase 2: the visible cards pop in around the shrunk hero (6 at ≥1400px,
       4 in the laptop bands) */
      .fromTo(floatCards,       { scale: 0.1, opacity: 0 },
                                { scale: 1, opacity: 1, duration: 1.5, stagger: 0.12, ease: 'back.out(1.4)' }, 3.2)

    /* Phase 3: Surrounding cards drift away upward — start TOGETHER with the
       bottle/hero rise (5.7, was 5.4) and travel a shorter distance, so they
       lift into the air at the same beat as the bottle instead of rocketing
       off ahead of it. */
      .to(floatCards,           { y: '-58vh', duration: 3.2, ease: 'power1.in' }, 5.7)

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
    /* svh, NOT dvh: dvh is dynamic — it changed mid-scroll whenever the
       mobile URL bar collapsed, resizing the track and jolting all content
       below it (visible stutter on real devices). svh is a constant. */
    const svhOk = (window.CSS && CSS.supports && CSS.supports('height', '1svh'));

    /* Reduced motion: no choreography → no scrub range. Collapse the track to
       one viewport so there is no dead pinned scroll. */
    if (reducedMotion) {
      if (scrollTrack) scrollTrack.style.height = svhOk ? '100svh' : '100vh';
      return function () {
        if (scrollTrack) scrollTrack.style.height = '';
      };
    }

    /* 145svh = ~45svh of scrub range for the shortened ~6-unit mobile timeline
       (shrink + bottle fly + rise — the ONLY pinned scene on mobile). The
       trust posms and the product-card pin were removed: everything after the
       hero is normal momentum scrolling. Tightened from 160: the final
       phase no longer flies the bottle off-screen, so less runway is needed
       and the fact strip arrives sooner after the bottle. */
    if (scrollTrack) scrollTrack.style.height = svhOk ? '145svh' : '145vh';

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
      .to('#heroWatermark',     { opacity: 0, duration: 1 }, 1)
      .to('#heroCert',          { opacity: 0, duration: 1 }, 1)
      .to('#ambernordHeroShade',{ opacity: 0, duration: 1.5 }, 1.5)
      /* Final phase: the hero/bottle barely rise (same lesson as desktop) —
         the old -0.75 rise flew the bottle fully off the top, leaving a huge
         black viewport between the bottle and the fact strip. Now the bottle
         stays near centre and the fact strip scrolls up to meet it. */
      .to('.scalable-hero',     { y: function () { return computeHeroCenterY(50) - window.innerHeight * 0.12; },
                                  duration: 2.0, ease: 'power1.in' }, 4.0);

    const btlCleanup = createFlyingBottle(tlMobile, false, 4.0, 2.0, 0.12);

    return function () {
      if (scrollTrack) scrollTrack.style.height = '';
      if (btlCleanup) btlCleanup();
    };
  });

  /* =========================================================================
     BIO BADGE HANDOVER — the topbar EU-bio mark simply APPEARS the moment the
     hero tagline/headline has faded out in the hero choreography (no flying
     clone): removing `landing-hero-active` lets the badge's own scale/fade
     transition in main.css play. Scrolling back up re-adds the class and the
     same transition reverses. State-toggled (badgeShown gate) so scrubbing
     never spams the classList. Reduced motion: identical class toggle.
     ========================================================================= */

  mm.add('all', function () {
    const track       = document.querySelector('.scroll-track');
    const topbarBadge = document.getElementById('topbarBioBadge');
    if (!track || !topbarBadge) return;

    const htmlEl   = document.documentElement;
    let badgeShown = false;   /* state gate — guards class spam while scrubbing */

    function showBadge() {
      if (badgeShown) return;
      badgeShown = true;
      htmlEl.classList.remove('landing-hero-active');
    }

    function hideBadge() {
      if (!badgeShown) return;
      badgeShown = false;
      htmlEl.classList.add('landing-hero-active');
    }

    if (reducedMotion) {
      /* No scrub choreography under reduced motion (the track is collapsed
         to one viewport) — toggle once the hero has essentially left. */
      ScrollTrigger.create({
        trigger: track,
        start: 'bottom 70%',
        onEnter:     showBadge,
        onLeaveBack: hideBadge
      });
    } else {
      /* EXACT beat of the hero text fade-out: #heroText reaches opacity 0 at
         1.3 of the 8.9-unit desktop timeline (≈0.15) and at 2 of the 6-unit
         mobile one (≈0.33). Raw track progress runs slightly AHEAD of the
         scrub-lagged visuals, so the badge appears right as the text dies,
         never seconds after. Evaluated per frame from raw progress so fast
         scrubbing in either direction can never double-run or skip the swap. */
      ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end:   'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          const p = window.matchMedia('(min-width: 992px)').matches ? 0.15 : 0.33;
          if (self.progress >= p) showBadge(); else hideBadge();
        }
      });
    }
  });

  /* =========================================================================
     PRODUCT CARDS.
     ≥992px: NO pin, NO scrub — the page scrolls completely freely. Each card
     does an in-place "gold coin" somersault flip to its benefit face once
     the group scrolls past ~mid-viewport (cascaded; reversed when scrolling
     back above), plus a hover toggle back to the sales face. Full system
     below.
     768–991px: NO flip — calm per-card fade-up (the choreography needs
     desktop room). <768px: same fade-up, unchanged. Reduced motion:
     everything static, sales faces only, no flips. CSS keeps the cards
     visible by default; the hidden pre-reveal state is applied here,
     JS-only, so content renders fine without JavaScript.
     ========================================================================= */

  mm.add('(min-width: 992px)', function () {
    if (reducedMotion) return;

    const section = document.getElementById('ritual-products');
    const cards   = section ? Array.from(section.querySelectorAll('.premium-product-card')) : [];
    if (!cards.length) return;

    /* The non-transforming wrapper around each card. Hover is detected on the
       slot (stable box) instead of the card (whose rotateX foreshortens it
       under the pointer), so a flip can never trip its own mouseleave. */
    const slots = cards.map(function (card) {
      return card.closest('.product-card-slot') || card.parentElement;
    });

    /* Reset stray state from a previous init (SPA re-entry, GSAP retry):
       no leaked faces, no leftover inline transforms, no one-shot classes. */
    cards.forEach(function (card) {
      card.classList.remove('is-flipped', 'is-airborne', 'is-glinting', 'is-shimmering');
      gsap.set(card, { clearProps: 'all' });
    });

    /* One grouped reveal: the whole stack rises together with a tight
       stagger (≤0.4s total feel) so the section reads as a single unit. */
    gsap.fromTo(cards,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true
        }
      }
    );

    /* GOLD COIN FLIP — in place, time-based (never scrubbed). Per card:
       anticipation dip → lift off the page (shadow grows via .is-airborne,
       CSS transition) → rotateX to 90° (edge-on: face swap + gold edge
       glint are invisible-but-flashy) → rotate in from −90° with a ~+2°
       overshoot → land (shadow contracts) → benefit content deals in
       (3 bullets stagger, savings chip pops) → one-shot gold shimmer sweep.
       Transform/opacity only on the card itself — zero layout shift.
       Perspective lives on .ritual-cards-group (landing.css).
       The .has-coin-flip class drops the CSS hover-lift transform
       transition so it never fights the GSAP-driven transform. */
    section.classList.add('has-coin-flip');

    const group     = section.querySelector('.ritual-cards-group') || section;
    const hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)');
    /* Per-card: target face, in-flight guard, live timeline, deal-in-played. */
    const state     = cards.map(function () { return { face: 'sales', busy: false, tl: null, dealt: false }; });
    /* Per-card debounce timer for the hover toggle (see below). */
    const hoverTimers = cards.map(function () { return null; });
    let   engaged   = false;   /* true while scrolled past the flip trigger */
    let   cascade   = null;

    /* The shimmer is a one-shot CSS keyframe animation on a pseudo element —
       remove its trigger class on animationend (bubbles from the benefit
       face) so it can re-fire on the next flip. */
    cards.forEach(function (card) {
      card.addEventListener('animationend', function (e) {
        if (e.animationName === 'an-face-shimmer') card.classList.remove('is-shimmering');
      });
    });

    /* Fresh timeline per flip, each direction — never timeline.reverse():
       the face swap + glint + deal-in are sets/class toggles and would
       glitch when rewound. `quick` = 0.5s toggle version (hover, reverse
       scroll, repeat visits); the full 5-beat choreography plays only on a
       card's FIRST flip to the benefit face. Kills any in-flight timeline
       first, so the new flip takes over from the current pose seamlessly. */
    function buildFlip(card, i, face, quick) {
      const st        = state[i];
      const toBenefit = face === 'benefit';
      const dealIn    = toBenefit && !st.dealt && !quick;
      const items     = card.querySelectorAll('.card-benefit-face__list li');
      const savings   = card.querySelector('.card-benefit-face__savings');

      if (st.tl) st.tl.kill();
      st.busy = true;
      st.face = face;

      const tl = gsap.timeline({
        onComplete: function () {
          st.busy = false;
          st.tl   = null;
          settleHover(card, i);
        }
      });
      st.tl = tl;

      /* 1+2 — somersault to edge-on. Quick (hover) flips rotate calmly in
         place: no translate/scale, so the card stays put and the stable
         .product-card-slot keeps the hover region steady. The full (sales-
         reset) path still lifts off the page first. */
      if (quick) {
        tl.to(card, { rotationX: 90, duration: 0.34, ease: 'power2.inOut' });
      } else {
        tl.call(function () { card.classList.add('is-airborne'); });
        tl.to(card, { y: 4, duration: 0.12, ease: 'power1.in' })
          .to(card, { y: -25, scale: 1.03, duration: 0.3, ease: 'power2.out' })
          .to(card, { rotationX: 90, duration: 0.18, ease: 'power1.in' });
      }

      /* Deal-in hidden states: applied INSIDE the timeline, right at the
         edge-on moment — the benefit face never starts CSS-hidden. */
      if (dealIn) {
        tl.set(items,   { x: -14, opacity: 0 });
        tl.set(savings, { scale: 0.85, opacity: 0 });
      }

      /* At exactly 90° (card edge-on, invisible): swap faces. */
      tl.call(function () {
        card.classList.toggle('is-flipped', toBenefit);
      });
      tl.set(card, { rotationX: -90 });

      /* Quick flips to the benefit face force the deal-in content visible:
         if a full flip was killed mid-flight (fast scroll jitter) between
         its hidden-state sets and the deal-in, the bullets would otherwise
         stay stuck at opacity 0. */
      if (toBenefit && !dealIn) {
        tl.set(items,   { x: 0, opacity: 1 });
        tl.set(savings, { scale: 1, opacity: 1 });
      }

      /* 3 — rotate in from edge-on with a soft overshoot, then settle.
         Quick path is ~0.84s total (0.34 + 0.34 + 0.16) for a calm,
         deliberate flip; no shadow to contract since it never lifted. */
      if (quick) {
        tl.to(card, { rotationX: 2, duration: 0.34, ease: 'power2.out' })
          .to(card, { rotationX: 0, duration: 0.16, ease: 'sine.inOut' });
      } else {
        tl.to(card, { rotationX: 2, duration: 0.22, ease: 'power1.out' })
          .add('land')
          .to(card, { rotationX: 0, duration: 0.18, ease: 'power1.inOut' }, 'land')
          .to(card, { y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 'land')
          .call(function () { card.classList.remove('is-airborne'); }, null, 'land+=0.1');
      }

      /* 4+5 — content deal-in over the landing (heading is visible from the
         swap itself), then the one-shot gold shimmer sweep across the face. */
      if (dealIn) {
        st.dealt = true;
        tl.to(items,   { x: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out' }, 'land')
          .to(savings, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' }, '>-0.1')
          .call(function () { card.classList.add('is-shimmering'); });
      }

      return tl;
    }

    /* Cascade: card N starts at card N−1's apex (~50% of its flip). */
    function flipAll(face) {
      if (cascade) cascade.kill();
      cascade = gsap.timeline();
      cards.forEach(function (card, i) {
        const st = state[i];
        if (st.face === face && !st.busy) return;   /* already there */
        const quick = face === 'sales' || st.dealt;
        cascade.add(buildFlip(card, i, face, quick), i * (quick ? 0.25 : 0.9));
      });
      /* Global pacing: ~15% slower so the whole somersault reads as calm,
         deliberate motion rather than a rapid snap. */
      cascade.timeScale(0.85);
    }

    /* HOVER FLIP (pointer-fine only): cards rest on their sales face and
       only somersault to the benefit face while the pointer is on them;
       leaving flips back to sales. Nothing flips on scroll. Transform-only,
       so the <a> keeps navigating on click. In-flight flips ignore the
       events; settleHover() (called from every flip's onComplete) corrects
       the face if the pointer moved mid-flip. */
    function settleHover(card, i) {
      if (!engaged || !hoverFine.matches || state[i].busy) return;
      const target = slots[i].matches(':hover') ? 'benefit' : 'sales';
      if (state[i].face !== target) buildFlip(card, i, target, true);
    }

    /* Debounced so a pointer merely sweeping across the stack doesn't set off
       a chain of flips: each enter/leave schedules a settle 120ms out and
       cancels any pending one, then re-reads the real :hover state and only
       flips if the face is actually wrong. Quick passes net to no motion. */
    if (hoverFine.matches) {
      function scheduleHover(card, i) {
        if (hoverTimers[i]) clearTimeout(hoverTimers[i]);
        hoverTimers[i] = setTimeout(function () {
          hoverTimers[i] = null;
          if (!engaged || state[i].busy) return;
          const target = slots[i].matches(':hover') ? 'benefit' : 'sales';
          if (state[i].face !== target) buildFlip(card, i, target, true);
        }, 120);
      }
      cards.forEach(function (card, i) {
        slots[i].addEventListener('mouseenter', function () { scheduleHover(card, i); });
        slots[i].addEventListener('mouseleave', function () { scheduleHover(card, i); });
      });
    }

    /* Gate hover flips to when the stack is actually in view, and reset any
       hovered card back to its sales face when scrolling back above. No
       automatic flip-to-benefit — that is hover-driven only. */
    const coinST = ScrollTrigger.create({
      trigger: group,
      start: 'top 85%',
      invalidateOnRefresh: true,
      onEnter:     function () { engaged = true;  },
      onLeaveBack: function () { engaged = false; flipAll('sales'); }
    });

    return function () {
      coinST.kill();
      if (cascade) cascade.kill();
      hoverTimers.forEach(function (t) { if (t) clearTimeout(t); });
      state.forEach(function (st) { if (st.tl) st.tl.kill(); });
      section.classList.remove('has-coin-flip');
      cards.forEach(function (card) {
        card.classList.remove('is-flipped', 'is-airborne', 'is-glinting', 'is-shimmering');
        gsap.set(card, { clearProps: 'transform' });
      });
    };
  });

  mm.add('(max-width: 991px)', function () {
    if (reducedMotion) return;

    /* Static premium stack: each card (and the trust row) fades up ONCE on
       entry, then stays put — the user compares the three editions in peace.
       The Habit gets its border-glow "breath" right after its reveal. */
    var section   = document.getElementById('ritual-products');
    var cards     = section ? Array.from(section.querySelectorAll('.premium-product-card')) : [];
    var trustWrap = section ? section.querySelector('.conversion-booster-wrapper') : null;
    var revealEls = cards.concat(trustWrap ? [trustWrap] : []);

    revealEls.forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
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
    };
  });

  /* =========================================================================
     FULL-BLEED CINEMATIC EDITORIAL — Manifest + Ritual, desktop + mobile.
     Each block is a full-viewport scene (CSS makes it edge-to-edge with a
     top+bottom dark vignette so adjacent scenes fuse seamlessly). On scroll
     the prose slides in from the side — Manifest from the left, Ritual from
     the right — and the background gets a gentle parallax drift. No pin: the
     page never locks. All hidden/offset states are applied by JS (gsap.set),
     so the prose is fully visible without JavaScript and stays untouched
     under reduced motion.
     ========================================================================= */
  function attachEditorialCinematic(wrapper, fromLeft) {
    if (reducedMotion || !wrapper) return;
    const content = wrapper.querySelector('.nature-hero-content');
    const bg      = wrapper.querySelector('.nature-hero-bg');
    if (!content) return;
    const items = Array.from(content.children);
    if (!items.length) return;

    const dir = fromLeft ? -1 : 1;

    /* Prose slides in from the side as the scene enters the lower viewport —
       short fade + transform only, tight stagger (≤0.4s total feel). */
    gsap.set(items, { opacity: 0, x: dir * 40, y: 16 });
    gsap.to(items, {
      opacity: 1, x: 0, y: 0,
      duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: {
        trigger: wrapper,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
        invalidateOnRefresh: true
      }
    });

    /* Background parallax drift (extra scale gives headroom so the translate
       never exposes an edge). Keeps the full-bleed image alive while scrolling. */
    if (bg) {
      gsap.fromTo(bg,
        { yPercent: -6, scale: 1.12 },
        { yPercent: 6, scale: 1.12, ease: 'none',
          scrollTrigger: {
            trigger: wrapper,
            start: 'top bottom',
            end:   'bottom top',
            scrub: 1.2,
            invalidateOnRefresh: true
          }
        });
    }
  }

  /* Desktop AND mobile share the cinematic treatment: Manifest reads in from
     the left, Ritual mirrors in from the right (CSS makes both full-bleed).
     'all' matchMedia scope so every reveal lives inside gsap.matchMedia and
     reverts cleanly with the rest. */
  mm.add('all', function () {
    if (reducedMotion) return;

    const editorialWrappers = Array.from(document.querySelectorAll('.editorial-bento-grid > .nature-hero-wrapper'));
    if (editorialWrappers[0]) attachEditorialCinematic(editorialWrappers[0], true);
    if (editorialWrappers[1]) attachEditorialCinematic(editorialWrappers[1], false);

    /* WIDE-SPLIT ROWS (Exclusive Sourcing + Handwerk) — same cinematic
       language as Manifest/Ritual: the photo (or video facade) swims up, the
       prose column slides in from the side it occupies in the desktop row
       layout (Sourcing right, Handwerk left). Transform + short fade only. */
    document.querySelectorAll('.wide-split-row').forEach(function (row) {
      const img = row.querySelector('.wide-split-img');
      const txt = row.querySelector('.wide-split-text');
      const dir = row.classList.contains('reverse') ? -1 : 1;

      /* Per-element triggers: on mobile the row is a tall stacked column, so
         a row-level trigger would fire the text while it is still below the
         fold and the user would only ever see the finished state. */
      if (img) {
        gsap.fromTo(img,
          { opacity: 0, y: 40, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out',
            scrollTrigger: {
              trigger: img,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
              invalidateOnRefresh: true
            }
          });
      }

      if (txt) {
        const items = Array.from(txt.children);
        if (items.length) {
          gsap.set(items, { opacity: 0, x: dir * 40, y: 14 });
          gsap.to(items, {
            opacity: 1, x: 0, y: 0,
            duration: 0.8, stagger: 0.08, ease: 'power3.out',
            scrollTrigger: {
              trigger: txt,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
              invalidateOnRefresh: true
            }
          });
        }
      }
    });
  });

  /* =========================================================================
     PAST-HERO STATE — one IntersectionObserver drives the bewertung chip
     (bottom-left social proof). The old mobile topbar CTA swap to
     "Zum Ritual" was removed: the nav CTA is always "Jetzt bestellen"
     linking to /shop/.
     ========================================================================= */

  const landingBewertungChip = document.getElementById('landingBewertungChip');
  const scrollTrack          = document.getElementById('scrollTrack');

  /* Chip visibility with mobile context zones: past the hero, but QUIET while
     the "Wählen Sie Ihr Protokoll" heading or the closing CTA are on screen —
     the chip pops back in the moment the heading scrolls away, accompanying
     the product cards as social proof. Desktop keeps the simple past-hero rule. */
  function updateChipVisibility() {
    const chip = document.getElementById('landingBewertungChip');
    if (!chip) return;
    let visible = !!window._anPastHero;
    if (visible && window.matchMedia('(max-width: 991px)').matches) {
      const vh   = window.innerHeight;
      const head = document.querySelector('.shop-heading-wrap');
      if (head) {
        const r = head.getBoundingClientRect();
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

  if (scrollTrack && landingBewertungChip) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        window._anPastHero = past;
        updateChipVisibility();
      });
    }, { threshold: 0 });
    observer.observe(scrollTrack);
  }

  /* Land precisely at the top of the product block — heading + cards framed
     under the topbar. Same target for the hero CTA and the closing CTA so
     every "go to the shop" action lands identically. The offset
     (nav + aktion + 40) is read live so it's correct whether the aktion bar
     is visible or not. */
  function scrollToProductsStart() {
    /* Reference #shop (the wrapper): its top is a stable anchor from any
       scroll position; #ritual-products' natural top = #shop top + #shop
       padding-top. */
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
     Desktop: the bg scrub-fades in as the section enters and back out near
     its end. CSS keeps the bg at opacity:1 by default (visible without JS
     and under reduced motion); the hidden pre-fade state is JS-applied here.
     Mobile keeps the plain CSS default — the bg is simply visible in flow.
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
  }

  /* =========================================================================
     GSAP SCROLL REVEALS
     Elements with .gsap-reveal fade up on scroll entry.
     ========================================================================= */

  mm.add('all', function () {
    if (reducedMotion) return;
    document.querySelectorAll('.gsap-reveal').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 32 },
        {
          scrollTrigger: {
            trigger:      el,
            start:        'top 85%',
            toggleActions: 'play none none reverse'
          },
          opacity:  1,
          y:        0,
          duration: 0.8,
          ease:     'power2.out'
        }
      );
    });
  });

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
