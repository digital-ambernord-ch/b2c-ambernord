/* ==========================================================================
   ABOUT PAGE — window.initAbout()
   Called by router.js after /pages/about.html is injected into #app.
   ========================================================================== */

window.initAbout = async function () {

    if (typeof window.loadI18n === 'function') {
      try { await window.loadI18n(window.getLang(), 'about'); } catch {}
    }

    /* Re-bind data-link clicks after i18n injects HTML (e.g. the B2B note's
       inline <a href="/b2b/" data-link>) — without this, the link would do a
       full page reload instead of a SPA route. */
    if (typeof window.attachLinkListeners === 'function') {
      window.attachLinkListeners();
    }

    const revealTargets = [
        ...document.querySelectorAll('.timeline-item'),
        document.querySelector('.about-quote-box'),
        document.querySelector('.about-img-col'),
    ].filter(Boolean);

    revealTargets.forEach((el, i) => {
        el.classList.add('about-reveal');
        el.style.transitionDelay = `${i * 0.08}s`;
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealTargets.forEach((el) => observer.observe(el));
};
