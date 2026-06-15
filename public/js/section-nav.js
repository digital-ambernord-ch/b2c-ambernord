/* SECTION-NAV — kinetic scroll-spy rail for long pages.

   window.initSectionNav(config) mounts a fixed side rail that tracks the
   active section as the user scrolls and lets them jump to any section with a
   click. The rail is a vertical "reel": the active section sits large and
   gold in the centre, neighbours shrink and fade above/below — like an iOS
   picker wheel. A thin spine on the edge fills with overall scroll progress.

   window.destroySectionNav() tears it down. The router calls it on every
   navigation, so the rail only ever lives on the page that mounted it.

   Performance contract: zero dependencies, no library. A single passive,
   rAF-throttled scroll listener that does ALL its DOM reads up front and ALL
   writes after — never interleaved, so it triggers no forced reflow. Layout
   geometry (slot height, rail height) is measured once and cached, so the
   steady-state scroll path is pure arithmetic + cheap getBoundingClientRect
   reads. It is a fixed overlay, so it never shifts content (no CLS) and has no
   effect on load metrics / PageSpeed.

   config = {
     sections:  [{ id, label }, ...]   // in document order; missing ids are skipped
     ariaLabel: string                 // accessible name for the <nav>
     navHeightId: string               // element whose height is the sticky offset (default 'siteNav')
   }                                                                          */

(function () {
  'use strict';

  var STATE = null;

  window.destroySectionNav = function () {
    if (!STATE) return;
    window.removeEventListener('scroll', STATE.onScroll);
    window.removeEventListener('resize', STATE.onResize);
    if (STATE.root && STATE.root.parentNode) STATE.root.parentNode.removeChild(STATE.root);
    STATE = null;
  };

  window.initSectionNav = function (config) {
    window.destroySectionNav();                 // idempotent — never stack rails
    if (!config || !Array.isArray(config.sections)) return;

    /* Resolve only the sections that are actually in the DOM and have a label. */
    var items = config.sections
      .map(function (s) {
        return { id: s.id, label: s.label, el: document.getElementById(s.id) };
      })
      .filter(function (s) { return s.el && s.label; });
    if (items.length < 2) return;               // a 1-item rail is pointless

    var navId    = config.navHeightId || 'siteNav';
    var activeIx = -1;

    /* ---- Build DOM -------------------------------------------------------- */
    var root = document.createElement('nav');
    root.className = 'an-secnav';
    root.setAttribute('aria-label', config.ariaLabel || 'Sections');

    var reel = document.createElement('ul');
    reel.className = 'an-secnav__reel';

    items.forEach(function (it, i) {
      var li  = document.createElement('li');
      li.className = 'an-secnav__item';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'an-secnav__btn';

      var span = document.createElement('span');
      span.className = 'an-secnav__label';
      span.textContent = it.label;

      btn.appendChild(span);
      btn.addEventListener('click', function () { goTo(i); });
      li.appendChild(btn);
      reel.appendChild(li);

      it.li = li; it.btn = btn; it.span = span;
    });

    var spine = document.createElement('div');
    spine.className = 'an-secnav__spine';
    var spineFill = document.createElement('div');
    spineFill.className = 'an-secnav__spine-fill';
    spine.appendChild(spineFill);

    root.appendChild(reel);
    root.appendChild(spine);
    document.body.appendChild(root);

    /* ---- Cached geometry (measured once, refreshed on resize) ------------- */
    var geo = { slotH: 0, rootH: 0, compact: false };

    function measure() {
      geo.slotH   = items[0].li.getBoundingClientRect().height || geo.slotH;
      geo.rootH   = root.clientHeight || geo.rootH;
      geo.compact = window.matchMedia('(max-width: 768px)').matches;
    }

    function navOffset() {
      var nav = document.getElementById(navId);
      return (nav ? nav.offsetHeight : 80) + 16;
    }

    /* ---- Active state + reel centring (writes only) ----------------------- */
    function setActive(i, force) {
      if (i === activeIx && !force) return;
      activeIx = i;

      for (var k = 0; k < items.length; k++) {
        var d = Math.abs(k - i);
        var scale, opacity;
        if      (d === 0) { scale = 1;    opacity = 1;    }
        else if (d === 1) { scale = 0.62; opacity = 0.5;  }
        else if (d === 2) { scale = 0.5;  opacity = geo.compact ? 0 : 0.22; }
        else              { scale = 0.5;  opacity = 0;    }

        var it = items[k];
        it.span.style.transform = 'scale(' + scale + ')';
        it.span.style.opacity   = opacity;
        it.li.classList.toggle('is-active', d === 0);
        /* Invisible labels must not swallow clicks over the page beneath. */
        it.btn.style.pointerEvents = opacity === 0 ? 'none' : 'auto';
        if (d === 0) it.btn.setAttribute('aria-current', 'true');
        else         it.btn.removeAttribute('aria-current');
      }

      /* Uniform slots → centre the active one with pure arithmetic, no reads. */
      if (geo.slotH && geo.rootH) {
        var y = geo.rootH / 2 - (i + 0.5) * geo.slotH;
        reel.style.transform = 'translateY(' + y + 'px)';
      }
    }

    /* ---- Scroll sync (reads batched, then writes) ------------------------- */
    function update() {
      if (!geo.slotH || !geo.rootH) measure();    // first paint / post-CSS swap

      /* READS ------------------------------------------------------------- */
      var line  = navOffset() + 12;
      var sy    = window.scrollY;
      var docH  = document.documentElement.scrollHeight;
      var winH  = window.innerHeight;
      var tops  = items.map(function (it) {
        return it.el.getBoundingClientRect().top + sy;
      });
      var atBottom = (winH + sy) >= (docH - 4);

      /* COMPUTE ----------------------------------------------------------- */
      var current = 0;
      for (var k = 0; k < tops.length; k++) {
        if (tops[k] - line <= sy) current = k; else break;
      }
      if (atBottom) current = items.length - 1;

      var first = tops[0] - line;
      var last  = tops[tops.length - 1] - line;
      var p = last > first ? (sy - first) / (last - first) : 0;
      p = atBottom ? 1 : Math.max(0, Math.min(1, p));

      /* WRITES ------------------------------------------------------------ */
      setActive(current);
      spineFill.style.transform = 'scaleY(' + p + ')';
    }

    function goTo(i) {
      var y = items[i].el.getBoundingClientRect().top + window.scrollY - navOffset();
      y = Math.max(0, y);
      if (typeof window.smoothScrollTo === 'function') window.smoothScrollTo(y);
      else window.scrollTo(0, y);
      setActive(i);                               // optimistic — feels instant
    }

    /* ---- rAF-throttled passive listeners ---------------------------------- */
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    function onResize() {
      measure();
      setActive(activeIx < 0 ? 0 : activeIx, true);
      update();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    STATE = { root: root, onScroll: onScroll, onResize: onResize };

    /* Settle: this page's CSS is loaded with a media="print" → onload swap, so
       the rail's geometry (slot height, rail height) may not be final on the
       first frame. Re-measure across a few frames and once more after a short
       delay so centring is correct regardless of when the stylesheet applies.
       Each settle is a cheap one-off; there is no ongoing timer. */
    function settle() { measure(); update(); }

    requestAnimationFrame(function () {
      settle();
      root.classList.add('is-ready');
      requestAnimationFrame(settle);
      setTimeout(settle, 250);
    });
  };
})();
