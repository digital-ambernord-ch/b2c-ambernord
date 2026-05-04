/* ==========================================================================

   DOSSIER — window.initDossier()

   Called by router.js after /pages/dossier.html is injected into #app.

   ========================================================================== */

window.initDossier = function () {

    /* -----------------------------------------------------------------------

       SCROLL REVEAL

       Adds .dossier-reveal to target elements, then uses IntersectionObserver
       to toggle .is-visible as they enter the viewport. Elements already
       marked .dossier-reveal in HTML are also collected here and observed.

    ----------------------------------------------------------------------- */

    const revealTargets = [
        ...document.querySelectorAll('.dossier-card'),
        ...document.querySelectorAll('.dossier-image-wrapper'),
        ...document.querySelectorAll('.dossier-bleed__content'),
        ...document.querySelectorAll('.dossier-icon-list li'),
        ...document.querySelectorAll('.dossier-conclusion-text'),
        ...document.querySelectorAll('.dossier-logo-wrapper'),
    ].filter(Boolean);

    revealTargets.forEach((el, i) => {
        if (!el.classList.contains('dossier-reveal')) {
            el.classList.add('dossier-reveal');
        }
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
