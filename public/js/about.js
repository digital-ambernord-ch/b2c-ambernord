/* ==========================================================================
   ABOUT PAGE — window.initAbout()
   Called by router.js after /pages/about.html is injected into #app.
   ========================================================================== */

window.initAbout = async function () {

    let i18n = null;
    if (typeof window.loadI18n === 'function') {
      try { i18n = await window.loadI18n(window.getLang(), 'about'); } catch {}
    }

    /* Re-bind data-link clicks after i18n injects HTML (e.g. the B2B note's
       inline <a href="/b2b/" data-link>) — without this, the link would do a
       full page reload instead of a SPA route. */
    if (typeof window.attachLinkListeners === 'function') {
      window.attachLinkListeners();
    }

    setupQuoteExpander(i18n);

    const revealTargets = [
        ...document.querySelectorAll('.timeline-item'),
        document.querySelector('.about-quote-box'),
        document.querySelector('.about-img-col'),
    ].filter(Boolean);

    revealTargets.forEach((el, i) => {
        el.classList.add('about-reveal');
        el.style.transitionDelay = `${Math.min(i * 0.08, 0.3)}s`;
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

    /* Kinetic section-nav rail (js/section-nav.js). Sections in document order;
       short labels come from i18n.sectionNav per locale. The component skips any
       id missing from the DOM, so this stays safe; router tears it down on nav. */
    if (typeof window.initSectionNav === 'function' && i18n && i18n.sectionNav) {
        const navItems = i18n.sectionNav.items || {};
        window.initSectionNav({
            ariaLabel: i18n.sectionNav.aria || 'Sections',
            sections: [
                { id: 'about-story',    label: navItems['about-story'] },
                { id: 'about-timeline', label: navItems['about-timeline'] }
            ]
        });
    }
};

/* Collapse the long founder quote to its first four sentences and append a
   gold "Mehr lesen" text toggle. Runs AFTER loadI18n so it always splits the
   final localized text; without JS the full quote stays fully visible. */
function setupQuoteExpander(i18n) {
    const quoteEl = document.querySelector('.about-quote-box .quote-text');
    if (!quoteEl || quoteEl.dataset.expanderBound) return;

    const fullText = quoteEl.textContent.trim();

    /* Sentence boundary: terminator (or closing ») + whitespace + an
       uppercase/«/digit sentence start. Leaves "1:10", "5–10 ml" and
       decimals like "2.5" intact — no period-space inside them. */
    const sentences = fullText.split(/(?<=[.!?»])\s+(?=[A-ZÄÖÜ«0-9])/);
    if (sentences.length <= 4) return;

    const collapsedText = sentences.slice(0, 4).join(' ') + ' …';
    const readMore = i18n?.story?.readMore || 'Mehr lesen';
    const readLess = i18n?.story?.readLess || 'Weniger anzeigen';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quote-toggle';
    quoteEl.after(btn);
    quoteEl.dataset.expanderBound = 'true';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let expanded = false;

    const render = () => {
        quoteEl.textContent = expanded ? fullText : collapsedText;
        btn.textContent = expanded ? readLess : readMore;
        btn.setAttribute('aria-expanded', String(expanded));
    };

    btn.addEventListener('click', () => {
        expanded = !expanded;
        if (reduceMotion) { render(); return; }
        /* Quick fade-out → swap → fade-in; duration matches --t-fast. */
        quoteEl.classList.add('is-swapping');
        setTimeout(() => {
            render();
            quoteEl.classList.remove('is-swapping');
        }, 200);
    });

    render();
}
