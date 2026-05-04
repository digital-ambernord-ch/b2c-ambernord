/* ==========================================================================

   RITUAL — window.initRitual()

   Called by router.js after /pages/ritual.html is injected into #app.

   ========================================================================== */

window.initRitual = function () {

    /* -----------------------------------------------------------------------

       SCROLL REVEAL

       Adds .page-reveal to target elements. IntersectionObserver toggles

       .is-visible as each element enters the viewport. Observer disconnects

       after reveal to avoid unnecessary callbacks.

    ----------------------------------------------------------------------- */

    const revealTargets = [
        ...document.querySelectorAll('.ritual-benefits__item'),
        ...document.querySelectorAll('.ritual-stats'),
        ...document.querySelectorAll('.ritual-video'),
        ...document.querySelectorAll('.ritual-protocol__card'),
        ...document.querySelectorAll('.ritual-recipes__container'),
    ].filter(Boolean);

    revealTargets.forEach((el, i) => {
        el.classList.add('page-reveal');
        el.style.transitionDelay = `${i * 0.08}s`;
    });

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));

    /* -----------------------------------------------------------------------

       TAB SWITCHING

       Activates the selected recipe category and shows its content panel.

       Manages aria-selected state for screen reader compatibility. The

       `hidden` attribute is used alongside the CSS class so panels are

       invisible even if the stylesheet fails to load.

    ----------------------------------------------------------------------- */

    const tabBtns = document.querySelectorAll('.ritual-recipes__tab-btn');
    const tabContents = document.querySelectorAll('.ritual-recipes__tab-content');

    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach((b) => {
                b.classList.remove('ritual-recipes__tab-btn--active');
                b.setAttribute('aria-selected', 'false');
            });

            tabContents.forEach((c) => {
                c.classList.remove('ritual-recipes__tab-content--active');
                c.hidden = true;
            });

            btn.classList.add('ritual-recipes__tab-btn--active');
            btn.setAttribute('aria-selected', 'true');

            const targetPanel = document.getElementById('tab-' + btn.getAttribute('data-tab'));
            if (targetPanel) {
                targetPanel.classList.add('ritual-recipes__tab-content--active');
                targetPanel.hidden = false;
            }
        });
    });

    /* -----------------------------------------------------------------------

       RECIPES BACKGROUND ANIMATION

       IntersectionObserver toggles .is-in-view on the recipe section to

       trigger the CSS parallax scale + fade effect on the overlay div.

       The class is removed on scroll-out so the animation replays on re-entry.

    ----------------------------------------------------------------------- */

    const recipeSection = document.getElementById('ritual-recipes-section');

    if (recipeSection && 'IntersectionObserver' in window) {
        const bgObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-in-view');
                    } else {
                        entry.target.classList.remove('is-in-view');
                    }
                });
            },
            { threshold: 0.15 }
        );

        bgObserver.observe(recipeSection);
    } else if (recipeSection) {
        recipeSection.classList.add('is-in-view');
    }

};
