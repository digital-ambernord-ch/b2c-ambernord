/* DOSSIER (/wissenschaft/) — window.initDossier()
   Renders dynamic list/grid blocks from /data/<lang>/dossier.json. */

window.initDossier = async function () {

    const lang = (typeof window.getLang === 'function') ? window.getLang() : 'de';
    const data = (typeof window.loadI18n === 'function')
        ? await window.loadI18n(lang, 'dossier')
        : null;

    if (data) {
        renderList('dossier-history-list',  data.history?.list);
        renderList('dossier-phyto-list',    data.phyto?.card2?.list);
        renderList('dossier-sourcing-list', data.sourcing?.list);
        renderList('dossier-harvest-list',  data.harvest?.list);
        renderLipidsGrid(data.lipids?.cards);
        renderScienceGrid(data.science?.cards);
        renderInnovationsGrid(data.innovations?.cards);
        renderZerowaste(data.zerowaste?.items);
    }

    function renderList(id, items) {
        const el = document.getElementById(id);
        if (!el || !Array.isArray(items)) return;
        el.innerHTML = items.map((html) => `<li>${html}</li>`).join('');
    }

    function renderLipidsGrid(cards) {
        const grid = document.getElementById('dossier-lipids-grid');
        if (!grid || !Array.isArray(cards)) return;
        const imgs = [
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=800&auto=format&fit=crop'
        ];
        grid.innerHTML = cards.map((c, i) => `
            <div class="dossier-card dossier-card--media dossier-reveal">
                <div class="dossier-card__image-wrap">
                    <img src="${imgs[i] || ''}" alt="${escapeAttr(c.imgAlt)}" loading="lazy">
                </div>
                <h3>${escapeHtml(c.title)}</h3>
                <p>${escapeHtml(c.desc)}</p>
            </div>
        `).join('');
    }

    function renderScienceGrid(cards) {
        const grid = document.getElementById('dossier-science-grid');
        if (!grid || !Array.isArray(cards)) return;
        const icons = [
            '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
            '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12h6"/><path d="M12 9v6"/>',
            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
        ];
        grid.innerHTML = cards.map((c, i) => `
            <div class="dossier-card dossier-reveal">
                <div class="dossier-card__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[i] || ''}</svg>
                </div>
                <h3>${escapeHtml(c.title)}</h3>
                <p>${escapeHtml(c.desc)}</p>
            </div>
        `).join('');
    }

    function renderInnovationsGrid(cards) {
        const grid = document.getElementById('dossier-innovations-grid');
        if (!grid || !Array.isArray(cards)) return;
        grid.innerHTML = cards.map((c) => `
            <div class="dossier-card dossier-reveal">
                <h3>${escapeHtml(c.title)}</h3>
                <p>${escapeHtml(c.desc)}</p>
            </div>
        `).join('');
    }

    function renderZerowaste(items) {
        const list = document.getElementById('dossier-zerowaste-list');
        if (!list || !Array.isArray(items)) return;
        const icons = [
            '<path d="M9 3h6"/><path d="M10 9l-3 9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l-3-9"/><path d="M12 3v6"/>',
            '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
            '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
            '<path d="M12 22v-6"/><path d="M12 8v4"/><path d="M8 12h8"/><path d="M12 2s-4 2-4 6 4 4 4 4"/><path d="M12 2s4 2 4 6-4 4-4 4"/>'
        ];
        list.innerHTML = items.map((item, i) => `
            <li class="dossier-reveal">
                <svg class="dossier-icon-list__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[i] || ''}</svg>
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    ${escapeHtml(item.desc)}
                </div>
            </li>
        `).join('');
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function escapeAttr(s) {
        return escapeHtml(s);
    }

    /* Scroll-reveal observer (re-binds after dynamic content is in the DOM). */
    const revealTargets = [
        ...document.querySelectorAll('.dossier-card'),
        ...document.querySelectorAll('.dossier-image-wrapper'),
        ...document.querySelectorAll('.dossier-bleed__content'),
        ...document.querySelectorAll('.dossier-icon-list li'),
        ...document.querySelectorAll('.dossier-conclusion-text'),
        ...document.querySelectorAll('.dossier-logo-wrapper'),
    ].filter(Boolean);

    revealTargets.forEach((el, i) => {
        if (!el.classList.contains('dossier-reveal')) el.classList.add('dossier-reveal');
        el.style.transitionDelay = `${i * 0.08}s`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealTargets.forEach((el) => observer.observe(el));
};
