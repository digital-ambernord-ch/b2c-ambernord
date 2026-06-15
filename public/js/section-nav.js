/* SECTION-NAV — collapsible scroll-spy menu for long pages.

   AT REST   the rail shows a column of section dots (a progress track that
             fills with gold as you advance) plus the CURRENT section's name.
   EXPANDED  on hover / keyboard focus (desktop) or tap (touch) the full list
             of section names appears — every entry is clickable and jumps
             straight to that section, no scrolling required.

   window.initSectionNav(config) mounts it; window.destroySectionNav() removes
   it (the router calls destroy on every navigation, so the rail only lives on
   the page that mounted it).

   Performance: zero dependencies. One passive, rAF-throttled scroll listener
   that does all DOM reads up front and all writes after — no interleaving, no
   forced reflow. Fixed overlay → no CLS, no effect on load metrics.

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

    var track = document.createElement('div');
    track.className = 'an-secnav__track';
    var trackFill = document.createElement('div');
    trackFill.className = 'an-secnav__track-fill';
    track.appendChild(trackFill);
    list.appendChild(track);

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
      btn.addEventListener('click', function () { onLinkClick(i); });
      li.appendChild(btn);
      list.appendChild(li);

      it.li = li; it.btn = btn;
    });

    root.appendChild(list);

    /* Touch-only hit area: covers the collapsed rail so a tap anywhere on it
       opens the full list (touch devices have no hover). Inert on desktop. */
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'an-secnav__toggle';
    toggle.setAttribute('aria-label', config.ariaLabel || 'Sections');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', open);
    root.appendChild(toggle);

    document.body.appendChild(root);

    /* ---- Open / close (touch) -------------------------------------------- */
    function open()  { root.classList.add('is-open');    toggle.setAttribute('aria-expanded', 'true');  }
    function close() { root.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }

    function onLinkClick(i) {
      /* On touch the first tap opens the menu; subsequent taps select+close. */
      if (!canHover && !root.classList.contains('is-open')) { open(); return; }
      goTo(i);
      if (!canHover) close();
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
      var line     = navH + winH * 0.28;          // a section becomes active
      var sy       = window.scrollY;              // once its top passes this line
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

    /* Outside-tap closes the expanded menu on touch devices. */
    var onDoc = null;
    if (!canHover) {
      onDoc = function (e) {
        if (root.classList.contains('is-open') && !root.contains(e.target)) close();
      };
      document.addEventListener('click', onDoc);
    }

    STATE = { root: root, onScroll: onScroll, onDoc: onDoc };

    requestAnimationFrame(function () {
      update();
      root.classList.add('is-ready');
    });
  };
})();
