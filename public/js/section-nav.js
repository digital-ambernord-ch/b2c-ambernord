/* SECTION-NAV — collapsible scroll-spy menu for long pages.

   COLLAPSED  only the section dots + a gold progress line (no text).
   EXPANDED   on hover / keyboard focus (desktop) or tap (touch) every section
              name appears in a full-width, equal-size clickable row. One tap /
              click jumps straight there — and the menu stays open, so further
              selections are a single tap. It collapses on mouse-leave (desktop)
              or a tap outside (touch); collapsed = dots + line only again.

   window.initSectionNav(config) mounts it; window.destroySectionNav() removes
   it (the router calls destroy on every navigation).

   Performance: zero dependencies. One passive, rAF-throttled scroll listener
   that does all DOM reads up front and all writes after — no forced reflow.
   Fixed overlay → no CLS, no effect on load metrics.

   config = {
     sections:    [{ id, label }, ...]   // document order; missing ids skipped
     ariaLabel:   string                 // accessible name for the <nav>
     navHeightId: string                 // sticky-offset element (default 'siteNav')
   }                                                                          */

(function () {
  'use strict';

  var STATE = null;

  window.destroySectionNav = function () {
    if (!STATE) return;
    if (STATE.cancel) STATE.cancel();
    window.removeEventListener('scroll', STATE.onScroll);
    window.removeEventListener('resize', STATE.onScroll);
    if (STATE.onDoc) document.removeEventListener('click', STATE.onDoc);
    if (STATE.root && STATE.root.parentNode) STATE.root.parentNode.removeChild(STATE.root);
    STATE = null;
  };

  window.initSectionNav = function (config) {
    window.destroySectionNav();                 // idempotent — never stack rails
    if (!config || !Array.isArray(config.sections)) return;

    var items = config.sections
      .map(function (s) {
        return { id: s.id, label: s.label, el: document.getElementById(s.id) };
      })
      .filter(function (s) { return s.el && s.label; });
    if (items.length < 2) return;

    var navId    = config.navHeightId || 'siteNav';
    var canHover = window.matchMedia('(hover: hover)').matches;
    var activeIx = -1;

    /* ---- Build DOM -------------------------------------------------------- */
    var root = document.createElement('nav');
    root.className = 'an-secnav' + (canHover ? '' : ' is-touch');
    root.setAttribute('aria-label', config.ariaLabel || 'Sections');

    var list = document.createElement('ul');
    list.className = 'an-secnav__list';

    /* Progress line. It is a sibling of the <ul>, NOT a child — a list may only
       contain <li> (plus script-supporting elements), so a <div> inside it is
       invalid and screen readers mis-announce the list. It is position:absolute
       against the position:fixed root, which shares the list's box, so the
       top/bottom/right alignment is identical. */
    var track = document.createElement('div');
    track.className = 'an-secnav__track';
    var trackFill = document.createElement('div');
    trackFill.className = 'an-secnav__track-fill';
    track.appendChild(trackFill);

    items.forEach(function (it, i) {
      var li = document.createElement('li');
      li.className = 'an-secnav__item';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'an-secnav__link';

      var label = document.createElement('span');
      label.className = 'an-secnav__label';
      label.textContent = it.label;

      var tick = document.createElement('span');
      tick.className = 'an-secnav__tick';
      tick.setAttribute('aria-hidden', 'true');

      btn.appendChild(label);
      btn.appendChild(tick);
      btn.addEventListener('click', function () { goTo(i); });
      li.appendChild(btn);
      list.appendChild(li);

      it.li = li; it.btn = btn;
    });

    root.appendChild(track);                    // paints underneath the list
    root.appendChild(list);
    document.body.appendChild(root);

    /* ---- Expand / collapse ----------------------------------------------- */
    var closeTimer = 0;
    function expand() {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
      root.classList.add('is-open');
    }
    function collapse() { root.classList.remove('is-open'); }
    /* Desktop: linger open a beat after the pointer leaves, then collapse —
       the slow CSS transition does the soft fade. Re-entering cancels it. */
    function collapseSoon() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { closeTimer = 0; collapse(); }, 600);
    }

    if (canHover) {
      root.addEventListener('mouseenter', expand);
      root.addEventListener('mouseleave', collapseSoon);
    }
    /* Keyboard: opening on focus, closing when focus leaves the rail. */
    root.addEventListener('focusin', expand);
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) collapse();
    });

    /* Touch: a tap on the collapsed rail opens it; a tap outside closes it.
       Section taps (handled by goTo) leave it open for further single-tap
       selections — no double-tap, no auto-close. */
    var onDoc = null;
    if (!canHover) {
      root.addEventListener('click', function () {
        if (!root.classList.contains('is-open')) expand();
      });
      onDoc = function (e) {
        if (root.classList.contains('is-open') && !root.contains(e.target)) collapse();
      };
      document.addEventListener('click', onDoc);
    }

    /* ---- Geometry + navigation ------------------------------------------- */
    function navOffset() {
      var nav = document.getElementById(navId);
      return (nav ? nav.offsetHeight : 80) + 16;
    }

    function goTo(i) {
      var y = items[i].el.getBoundingClientRect().top + window.scrollY - navOffset();
      y = Math.max(0, y);
      if (typeof window.smoothScrollTo === 'function') window.smoothScrollTo(y);
      else window.scrollTo(0, y);
      setActive(i);                               // optimistic — feels instant
    }

    function setActive(i) {
      if (i === activeIx) return;
      activeIx = i;
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        it.li.classList.toggle('is-active', k === i);
        it.li.classList.toggle('is-passed', k < i);
        if (k === i) it.btn.setAttribute('aria-current', 'true');
        else         it.btn.removeAttribute('aria-current');
      }
    }

    /* ---- Scroll sync (reads batched, then writes) ------------------------- */
    function update() {
      /* READS */
      var navH     = navOffset();
      var winH     = window.innerHeight;
      var line     = navH + winH * 0.28;          // active = its top crosses this
      var sy       = window.scrollY;
      var docH     = document.documentElement.scrollHeight;
      var tops     = items.map(function (it) { return it.el.getBoundingClientRect().top; });
      var atBottom = (winH + sy) >= (docH - 4);

      /* COMPUTE */
      var current = 0;
      for (var k = 0; k < tops.length; k++) {
        if (tops[k] <= line) current = k; else break;
      }
      if (atBottom) current = items.length - 1;

      var p = (docH - winH) > 0 ? sy / (docH - winH) : 0;
      p = atBottom ? 1 : Math.max(0, Math.min(1, p));

      /* WRITES */
      setActive(current);
      trackFill.style.transform = 'scaleY(' + p + ')';
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    STATE = {
      root: root, onScroll: onScroll, onDoc: onDoc,
      cancel: function () { if (closeTimer) clearTimeout(closeTimer); }
    };

    requestAnimationFrame(function () {
      update();
      root.classList.add('is-ready');
    });
  };
})();
