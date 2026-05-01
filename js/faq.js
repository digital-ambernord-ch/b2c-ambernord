/* ==========================================================================
   FAQ — window.initFaq()

   Called by router.js after /pages/faq.html is injected into #app.

   ========================================================================== */

window.initFaq = function () {

    /* -----------------------------------------------------------------------
       ACCORDION

       Each .faq-btn toggles its parent .faq-item between open and closed.
       Only one item can be open at a time — clicking a new one collapses
       the previously active item before expanding the new one.
    ----------------------------------------------------------------------- */

    const buttons = document.querySelectorAll('.faq-btn');

    buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const item = this.parentElement;
            const answer = this.nextElementSibling;
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            document.querySelectorAll('.faq-item.active').forEach(function (activeItem) {
                if (activeItem !== item) {
                    activeItem.classList.remove('active');
                    activeItem.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
                    activeItem.querySelector('.faq-answer-wrapper').style.maxHeight = '0px';
                }
            });

            item.classList.toggle('active');

            if (item.classList.contains('active')) {
                this.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                this.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = '0px';
            }
        });
    });

    /* -----------------------------------------------------------------------
       SCROLL REVEAL

       Adds .about-reveal to target elements, then uses IntersectionObserver
       to toggle .is-visible as they enter the viewport.
    ----------------------------------------------------------------------- */

    const revealTargets = [
        ...document.querySelectorAll('.faq-item'),
        ...document.querySelectorAll('.faq-category'),
        document.querySelector('.faq-footer'),
    ].filter(Boolean);

    revealTargets.forEach(function (el, i) {
        el.classList.add('about-reveal');
        el.style.transitionDelay = (i * 0.04) + 's';
    });

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 }
    );

    revealTargets.forEach(function (el) {
        observer.observe(el);
    });

};
