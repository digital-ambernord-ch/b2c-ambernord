/* FAQ — window.initFaq()
   Renders all categories + Q&A from /data/<lang>/faq.json with accordion + reveal. */

window.initFaq = async function () {

    const lang = (typeof window.getLang === 'function') ? window.getLang() : 'de';
    const data = (typeof window.loadI18n === 'function')
        ? await window.loadI18n(lang, 'faq')
        : null;

    const container = document.getElementById('main-content');
    if (!container || !data) return;

    container.innerHTML = renderCategories(data.categories) + renderFooter(data.footer);

    bindAccordion();
    bindScrollReveal();

    function renderCategories(cats) {
        if (!Array.isArray(cats)) return '';
        const plus = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>`;
        return cats.map((cat) => `
            <div class="faq-category">${escapeHtml(cat.title)}</div>
            ${(cat.items || []).map((it) => `
                <div class="faq-item">
                    <button class="faq-btn" type="button" aria-expanded="false">
                        <h3 class="faq-question">${escapeHtml(it.q)}</h3>
                        <span class="faq-icon">${plus}</span>
                    </button>
                    <div class="faq-answer-wrapper">
                        <div class="faq-answer-content">
                            <p>${escapeHtml(it.a)}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        `).join('');
    }

    function renderFooter(f) {
        if (!f) return '';
        return `
            <div class="faq-footer">
                <p>${f.leadHtml}
                <a href="/hilfe/kontakt/" class="faq-footer__link" data-link>${escapeHtml(f.linkLabel)}</a>.
                </p>
                <a class="faq-footer__cta" href="/shop/" data-link>${escapeHtml(f.cta)}</a>
            </div>
        `;
    }

    function bindAccordion() {
        const buttons = document.querySelectorAll('.faq-btn');
        buttons.forEach((btn) => {
            btn.addEventListener('click', function () {
                const item = this.parentElement;
                const answer = this.nextElementSibling;
                const isExpanded = this.getAttribute('aria-expanded') === 'true';

                document.querySelectorAll('.faq-item.active').forEach((activeItem) => {
                    if (activeItem !== item) {
                        activeItem.classList.remove('active');
                        const otherBtn = activeItem.querySelector('.faq-btn');
                        const otherAns = activeItem.querySelector('.faq-answer-wrapper');
                        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                        if (otherAns) otherAns.style.maxHeight = '0px';
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
        if (typeof window.attachLinkListeners === 'function') window.attachLinkListeners();
    }

    function bindScrollReveal() {
        const targets = [
            ...document.querySelectorAll('.faq-item'),
            ...document.querySelectorAll('.faq-category'),
            document.querySelector('.faq-footer'),
        ].filter(Boolean);
        targets.forEach((el, i) => {
            el.classList.add('about-reveal');
            el.style.transitionDelay = (i * 0.04) + 's';
        });
        const obs = new IntersectionObserver((entries) => entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        }), { threshold: 0.1 });
        targets.forEach((el) => obs.observe(el));
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
};
