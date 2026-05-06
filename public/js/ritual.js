/* RITUAL — window.initRitual()
   Renders dynamic blocks from /data/<lang>/ritual.json so all content is i18n-driven. */

window.initRitual = async function () {

    const lang = (typeof window.getLang === 'function') ? window.getLang() : 'de';
    const data = (typeof window.loadI18n === 'function')
        ? await window.loadI18n(lang, 'ritual')
        : null;

    if (data) {
        renderBenefits(data.benefits);
        renderStats(data.stats);
        renderProtocol(data.protocol);
        renderRecipes(data.recipes);
    }

    function renderBenefits(b) {
        const grid = document.getElementById('ritual-benefits-grid');
        if (!grid || !b || !b.items) return;
        grid.innerHTML = b.items.map((item, i) => `
            <div class="ritual-benefits__item" data-number="0${i + 1}">
                <div class="ritual-benefits__item-content">
                    <h3 class="ritual-benefits__item-title">${escapeHtml(item.title)}</h3>
                    <p class="ritual-benefits__item-desc">${escapeHtml(item.desc)}</p>
                </div>
            </div>
        `).join('');
    }

    function renderStats(s) {
        const wrapper = document.getElementById('ritual-stats');
        if (!wrapper || !s || !s.items) return;
        wrapper.innerHTML = s.items.map((item) => `
            <div class="ritual-stats__item">
                <div class="ritual-stats__highlight">${escapeHtml(item.highlight)}</div>
                <div class="ritual-stats__detail">${item.detail}</div>
            </div>
        `).join('');
    }

    function renderProtocol(p) {
        const grid = document.getElementById('ritual-protocol-grid');
        if (!grid || !p || !p.items) return;
        grid.innerHTML = p.items.map((item) => `
            <div class="ritual-protocol__card">
                <span class="ritual-protocol__step">${escapeHtml(item.step)}</span>
                <h3 class="ritual-protocol__title">${escapeHtml(item.title)}</h3>
                <p class="ritual-protocol__desc">${item.desc}</p>
            </div>
        `).join('');
    }

    function renderRecipes(r) {
        if (!r) return;
        ['kalt', 'warm', 'kulinarik'].forEach((cat) => {
            const panel = document.getElementById('tab-' + cat);
            const items = r[cat];
            if (!panel || !items) return;
            panel.innerHTML = items.map((item) => `
                <article class="ritual-recipe-card">
                    <span class="ritual-recipe-card__tag">${escapeHtml(item.tag)}</span>
                    <h3 class="ritual-recipe-card__title">${escapeHtml(item.title)}</h3>
                    <p class="ritual-recipe-card__desc">${escapeHtml(item.desc)}</p>
                </article>
            `).join('');
        });
    }

    function escapeHtml(str) {
        if (str === undefined || str === null) return '';
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /* Scroll-reveal observer (re-binds after dynamic content is in the DOM). */
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
        (entries) => entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        }),
        { threshold: 0.15 }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));

    /* Tab switching for recipe categories. */
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

    /* Recipes section background scale-fade trigger. */
    const recipeSection = document.getElementById('ritual-recipes-section');
    if (recipeSection && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => entries.forEach((entry) => {
            entry.target.classList.toggle('is-in-view', entry.isIntersecting);
        }), { threshold: 0.15 }).observe(recipeSection);
    } else if (recipeSection) {
        recipeSection.classList.add('is-in-view');
    }
};
