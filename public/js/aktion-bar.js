/* ==========================================================================
   AKTION BAR — dismiss handler.
   The `html.aktion-active` class is set synchronously in <head> (index.html)
   to avoid layout shift. This script only handles the dismiss interaction.
   Bump AKTION_VERSION to re-show the bar to all visitors after a message change.
   ========================================================================== */

(function () {
  const AKTION_VERSION  = 'v1';
  const STORAGE_KEY     = 'amber_aktion_dismissed_' + AKTION_VERSION;

  /* Auto-dismiss tuning. We trigger on whichever happens first:
       SCROLL_TRIGGER_PX — user has scrolled deeply enough to signal real
                           engagement with the page (≈ past the hero).
       AUTO_TIMEOUT_MS  — fallback for visitors who don't scroll (e.g. they
                           pause on the hero, then click a nav link). */
  const SCROLL_TRIGGER_PX = 600;
  const AUTO_TIMEOUT_MS   = 25000;

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

    let triggered = false;
    function trigger() {
      if (triggered) return;
      triggered = true;
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      dismiss(true);
    }

    function onScroll() {
      if ((window.scrollY || window.pageYOffset || 0) >= SCROLL_TRIGGER_PX) trigger();
    }

    const timer = setTimeout(trigger, AUTO_TIMEOUT_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function init() {
    const closeBtn = document.getElementById('aktionBarClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { dismiss(false); });
    }

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
