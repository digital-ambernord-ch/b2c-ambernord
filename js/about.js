/* ==========================================================================
   ABOUT PAGE — window.initAbout()
   Called by router.js after /pages/about.html is injected into #app.
   ========================================================================== */

window.initAbout = function () {

    /* -----------------------------------------------------------------------
       SCROLL REVEAL
       Adds .about-reveal class to timeline items and quote box, then uses
       IntersectionObserver to toggle .is-visible as they enter the viewport.
    ----------------------------------------------------------------------- */

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
