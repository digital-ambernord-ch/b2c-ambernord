/* ==========================================================================
   AKTION BAR — dismiss handler.
   The `html.aktion-active` class is set synchronously in <head> (index.html)
   to avoid layout shift. This script only handles the dismiss interaction.
   Bump AKTION_VERSION to re-show the bar to all visitors after a message change.
   ========================================================================== */

(function () {
  const AKTION_VERSION  = 'v1';
  const STORAGE_KEY     = 'amber_aktion_dismissed_' + AKTION_VERSION;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    document.documentElement.classList.remove('aktion-active');
  }

  function init() {
    const closeBtn = document.getElementById('aktionBarClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', dismiss);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
