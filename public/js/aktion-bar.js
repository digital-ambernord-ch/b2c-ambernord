/* ==========================================================================
   AKTION BAR — dismiss handler.
   The `html.aktion-active` class is set synchronously in <head> (index.html)
   to avoid layout shift. This script only handles the dismiss interaction.
   Bump AKTION_VERSION to re-show the bar to all visitors after a message change.
   ========================================================================== */

(function () {
  const AKTION_VERSION  = 'v1';
  const STORAGE_KEY     = 'amber_aktion_dismissed_' + AKTION_VERSION;

  /* Auto-dismiss timing — time-only, no scroll-trigger.
     Scroll-based dismiss surprised users mid-read (people scroll while still
     reading the marquee), so the bar would vanish before its message
     registered. A pure 90 second timer guarantees the user has time to
     finish reading whether they sit on the hero or scroll through quickly,
     and only then does the bar fade out. */
  const AUTO_TIMEOUT_MS = 90000;

  let autoArmed = false;

  function dismiss(viaAuto) {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}

    /* Auto-dismiss fades out so the bar's disappearance feels intentional;
       the X button keeps the original instant collapse (a deliberate user
       action shouldn't linger). */
    const bar = document.querySelector('.aktion-bar');
    if (viaAuto && bar) {
      bar.style.transition = 'opacity 0.35s ease';
      bar.style.opacity = '0';
      setTimeout(function () {
        document.documentElement.classList.remove('aktion-active');
      }, 360);
    } else {
      document.documentElement.classList.remove('aktion-active');
    }
  }

  function armAutoDismiss() {
    if (autoArmed) return;
    autoArmed = true;
    setTimeout(function () { dismiss(true); }, AUTO_TIMEOUT_MS);
  }

  /* Swipe-to-dismiss (touch devices): a horizontal swipe drags the bar with
     the finger and, past the threshold, slides it off-screen and dismisses —
     same persistence as the × button. Vertical movement (page scrolling)
     cancels the gesture immediately. */
  function setupSwipeDismiss(bar) {
    let startX = 0, startY = 0, dx = 0, active = false;

    bar.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dx     = 0;
      active = true;
    }, { passive: true });

    bar.addEventListener('touchmove', function (e) {
      if (!active) return;
      dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        active = false;
        bar.style.transform = '';
        bar.style.opacity   = '';
        return;
      }
      if (Math.abs(dx) > 10) {
        bar.style.transition = 'none';
        bar.style.transform  = 'translateX(' + dx + 'px)';
        bar.style.opacity    = String(Math.max(0.25, 1 - Math.abs(dx) / 220));
      }
    }, { passive: true });

    bar.addEventListener('touchend', function () {
      if (!active) return;
      active = false;
      if (Math.abs(dx) > 70) {
        bar.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        bar.style.transform  = 'translateX(' + (dx > 0 ? '110%' : '-110%') + ')';
        bar.style.opacity    = '0';
        setTimeout(function () {
          dismiss(false);
          bar.style.cssText = '';
        }, 250);
      } else {
        bar.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        bar.style.transform  = '';
        bar.style.opacity    = '';
        setTimeout(function () { bar.style.transition = ''; }, 220);
      }
    }, { passive: true });
  }

  function init() {
    const closeBtn = document.getElementById('aktionBarClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { dismiss(false); });
    }

    const bar = document.querySelector('.aktion-bar');
    if (bar) setupSwipeDismiss(bar);

    /* Don't arm auto-dismiss if the bar isn't actually showing (e.g. the
       inline <head> script already cleared it because the user dismissed
       previously). */
    if (document.documentElement.classList.contains('aktion-active')) {
      armAutoDismiss();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
