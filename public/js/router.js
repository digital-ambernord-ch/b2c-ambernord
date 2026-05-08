/* AmberNord SPA router — History API, fragment fetch, meta + JSON-LD, init dispatch. */

(function () {

  /* Map old paths to new ones so existing inbound links / SEO history keep working. */
  const REDIRECTS = {
    '/ueber-uns/':       '/story/',
    '/dossier/':         '/wissenschaft/',
    '/ritual-wirkung/':  '/ritual/',
    '/the-starter/':     '/shop/starter/',
    '/the-habit/':       '/shop/habit/',
    '/the-protocol/':    '/shop/protocol/',
    '/the-master-box/':  '/shop/master-box/',
    '/elixier/':         '/shop/',
    '/faq/':             '/hilfe/faq/',
    '/kontakt/':         '/hilfe/kontakt/',
    '/bestellstatus/':   '/hilfe/bestellstatus/',
    '/rueckgabe/':       '/hilfe/rueckgabe/',
    '/2+1/':             '/2-fuer-1/',
    '/2plus1/':          '/2-fuer-1/',
    '/markteinfuehrung/':'/2-fuer-1/'
  };

  const ROUTES = {
    '/': {
      page:        '/pages/home.html',
      title:       'AmberNord | Sanddorn Biohacking & Longevity Schweiz',
      description: 'Entdecken Sie die Kraft von Sanddorn. AmberNord bietet natürliche Biohacking- und Longevity-Essenzen aus der Schweiz für Ihr tägliches Ritual.',
      canonical:   'https://ambernord.ch/',
      type:        'landing',
      schema:      null
    },

    '/story/': {
      page:        '/pages/about.html',
      title:       'Story | AmberNord',
      description: 'Vom falschen Kick zur echten Klarheit. Erfahren Sie mehr über Gründer Eriks Matisons und die Vision hinter der kompromisslosen AmberNord Sanddorn-Essenz.',
      canonical:   'https://ambernord.ch/story/',
      type:        'about',
      schema:      null
    },

    '/wissenschaft/': {
      page:        '/pages/dossier.html',
      title:       'Wissenschaft | AmberNord',
      description: 'Pharmakologie, Phytochemie und funktionelle Ernährung: das wissenschaftliche Dossier zur AmberNord Methodik rund um Hippophae rhamnoides.',
      canonical:   'https://ambernord.ch/wissenschaft/',
      type:        'dossier',
      schema:      null
    },

    '/ritual/': {
      page:        '/pages/ritual.html',
      title:       'Ritual | AmberNord',
      description: 'Die Wissenschaft hinter dem AmberNord Ritual: 9 Wirkungsbereiche, tägliches Anwendungsprotokoll und Rezeptideen mit Sanddorn-Elixier.',
      canonical:   'https://ambernord.ch/ritual/',
      type:        'ritual',
      schema:      null
    },

    '/shop/': {
      page:        '/pages/shop.html',
      title:       'Shop | AmberNord',
      description: 'Sanddorn-Essenzen wählen – The Starter, The Habit, The Protocol und The Master Box.',
      canonical:   'https://ambernord.ch/shop/',
      type:        'shop',
      schema:      null
    },

    '/shop/starter/': {
      page:        '/pages/the-starter.html',
      title:       'The Starter (1× 250 ml) | AmberNord Sanddorn Elixier',
      description: 'The Starter: Ihr Einstieg in die Welt von AmberNord. Zellschutz und Vitalität durch 190+ Bioaktivstoffe. Kaltgepresst. Bio-zertifiziert.',
      canonical:   'https://ambernord.ch/shop/starter/',
      type:        'product',
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Starter (1× 250 ml)",
        "image": [
          "https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1774798945/ambernord-bio-sanddornsaft-zelt-edition-250ml-schweiz.webp_f3eaz0.png"
        ],
        "description": "The Starter — Ihr Einstieg in die Welt von AmberNord. Bio-zertifiziert, kaltgepresst, reich an Omega-7 und über 190 Bioaktivstoffen.",
        "brand": { "@type": "Brand", "name": "AmberNord" },
        "offers": {
          "@type": "Offer",
          "url": "https://ambernord.ch/shop/starter/",
          "priceCurrency": "CHF",
          "price": "24.90",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      }
    },

    '/shop/habit/': {
      page:        '/pages/the-habit.html',
      title:       'The Habit (3× 250 ml) | AmberNord Sanddorn Elixier',
      description: 'The Habit: Das 30-Tage-Ritual für nachhaltigen Fokus, Energie und Zellregeneration. Bio-zertifiziert, Omega-7, 190+ Bioaktivstoffe.',
      canonical:   'https://ambernord.ch/shop/habit/',
      type:        'product',
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Habit (3× 250 ml)",
        "description": "The Habit: Das 30-Tage-Ritual. Bio-zertifiziert, kaltgepresst, reich an Omega-7.",
        "brand": { "@type": "Brand", "name": "AmberNord" },
        "offers": {
          "@type": "Offer",
          "url": "https://ambernord.ch/shop/habit/",
          "priceCurrency": "CHF",
          "price": "69.00",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      }
    },

    '/shop/protocol/': {
      page:        '/pages/the-protocol.html',
      title:       'The Protocol (6× 250 ml) | AmberNord Sanddorn Elixier',
      description: 'The Protocol: Dauerhafte zelluläre Versorgung für Familie und Höchstleister. Bester Preis pro Tagesration.',
      canonical:   'https://ambernord.ch/shop/protocol/',
      type:        'product',
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Protocol (6× 250 ml)",
        "description": "The Protocol: Das ultimative Protokoll für Familien und Höchstleister. Bio-zertifiziert.",
        "brand": { "@type": "Brand", "name": "AmberNord" },
        "offers": {
          "@type": "Offer",
          "url": "https://ambernord.ch/shop/protocol/",
          "priceCurrency": "CHF",
          "price": "129.00",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      }
    },

    '/shop/master-box/': {
      page:        '/pages/the-master-box.html',
      title:       'The Master Box (20× 250 ml) | AmberNord',
      description: 'Die exklusive Original-Edition: 20 × 250 ml kaltgepresster Bio-Sanddornsaft. Über 25 % Ersparnis, kostenloser Premium-Versand aus Aarau.',
      canonical:   'https://ambernord.ch/shop/master-box/',
      type:        'the-master-box',
      schema:      null
    },

    '/hilfe/faq/': {
      page:        '/pages/faq.html',
      title:       'FAQ | AmberNord',
      description: 'Häufige Fragen zum AmberNord Sanddorn-Elixier: Anwendung, Inhaltsstoffe, Verträglichkeit und Herkunft.',
      canonical:   'https://ambernord.ch/hilfe/faq/',
      type:        'faq',
      schema:      null
    },

    '/hilfe/kontakt/': {
      page:        '/pages/contact.html',
      title:       'Kontakt | AmberNord',
      description: 'Kontaktieren Sie AmberNord – Fragen zu unserem Bio-Sanddornsaft, Bestellungen oder B2B-Partnerschaften.',
      canonical:   'https://ambernord.ch/hilfe/kontakt/',
      type:        'contact',
      schema:      null
    },

    '/hilfe/bestellstatus/': {
      page:        '/pages/bestellstatus.html',
      title:       'Bestellstatus | AmberNord',
      description: 'Geben Sie Ihre Bestellnummer ein, um den Status Ihrer Lieferung zu prüfen.',
      canonical:   'https://ambernord.ch/hilfe/bestellstatus/',
      type:        'bestellstatus',
      schema:      null
    },

    '/hilfe/rueckgabe/': {
      page:        '/pages/returns.html',
      title:       'Rückgabe & Erstattung | AmberNord',
      description: 'Rückgabe- und Erstattungsrichtlinie für AmberNord Bio-Sanddornsaft.',
      canonical:   'https://ambernord.ch/hilfe/rueckgabe/',
      type:        'returns',
      schema:      null
    },

    '/datenschutz/': {
      page:        '/pages/datenschutz.html',
      title:       'Datenschutzerklärung | AmberNord',
      description: 'Datenschutz gemäss revDSG.',
      canonical:   'https://ambernord.ch/datenschutz/',
      type:        'datenschutz',
      schema:      null
    },

    '/agb/': {
      page:        '/pages/agb.html',
      title:       'Allgemeine Geschäftsbedingungen | AmberNord',
      description: 'AGB der AmberNord Sanddorn-Essenzen — Geltungsbereich, Vertragsschluss, Lieferung, Gewährleistung, Gerichtsstand.',
      canonical:   'https://ambernord.ch/agb/',
      type:        'agb',
      schema:      null
    },

    '/b2b/': {
      page:        '/pages/b2b.html',
      title:       'B2B Klinische Rohstoffe | AmberNord',
      description: 'Zertifizierte Sanddorn-Rohstoffe in Bulk-Mengen. ISO 22000, EU-Bio.',
      canonical:   'https://ambernord.ch/b2b/',
      type:        'b2b',
      schema:      null
    },

    '/danke/': {
      page:        '/pages/thankyou.html',
      title:       'Bestellung bestätigt | AmberNord',
      description: 'Deine Bestellung ist eingegangen. AmberNord bereitet dein Elixier vor.',
      canonical:   'https://ambernord.ch/danke/',
      type:        'thankyou',
      schema:      null
    },

    '/bewertungen/': {
      page:        '/pages/bewertungen.html',
      title:       'Kundenbewertungen | AmberNord',
      description: 'Echte Stimmen aus der Schweiz: ungefilterte Erfahrungen mit dem AmberNord Sanddorn-Elixier nach 14 Tagen täglicher Anwendung.',
      canonical:   'https://ambernord.ch/bewertungen/',
      type:        'bewertungen',
      schema:      null
    },

    '/2-fuer-1/': {
      page:        '/pages/aktion-2-fuer-1.html',
      title:       'Markteinführungs-Edition · 2 für 1 | AmberNord',
      description: 'Markteinführungs-Edition: 2 × The Starter zum Preis von 1. Limitiert auf 250 Plätze in der Schweiz. Im Gegenzug bitten wir nach 14 Tagen um eine ehrliche Bewertung.',
      canonical:   'https://ambernord.ch/2-fuer-1/',
      type:        'aktion2fuer1',
      schema:      null
    },

    '/2-fuer-1/danke/': {
      page:        '/pages/aktion-2-fuer-1-danke.html',
      title:       'Aktion gesichert | AmberNord',
      description: 'Du bist Teil der Markteinführungs-Edition. Deine Bestellung ist eingegangen.',
      canonical:   'https://ambernord.ch/2-fuer-1/danke/',
      type:        'aktion2fuer1Danke',
      schema:      null
    }
  };

  /* Map of route.type → init function name on window. Single source of truth — no if/else chain. */
  const INITS = {
    landing:          'initLanding',
    product:          'initProduct',
    about:            'initAbout',
    faq:              'initFaq',
    dossier:          'initDossier',
    ritual:           'initRitual',
    b2b:              'initB2b',
    shop:             'initShop',
    'the-master-box': 'initTheMasterBox',
    contact:          'initContact',
    bestellstatus:    'initBestellstatus',
    thankyou:         'initThankyou',
    datenschutz:      'initDatenschutz',
    returns:          'initReturns',
    bewertungen:      'initBewertungen',
    aktion2fuer1:     'initAktion2Fuer1',
    aktion2fuer1Danke:'initAktion2Fuer1Danke',
    agb:              'initAgb'
  };

  const pageCache = {};

  function normalisePath(path) {
    const raw = path.split('#')[0].split('?')[0] || '/';
    return raw === '/' ? '/' : (raw.endsWith('/') ? raw : raw + '/');
  }

  function resolveRoute(cleanPath) {
    if (REDIRECTS[cleanPath]) return { route: ROUTES[REDIRECTS[cleanPath]], canonicalPath: REDIRECTS[cleanPath] };
    if (ROUTES[cleanPath])    return { route: ROUTES[cleanPath],            canonicalPath: cleanPath };
    return { route: ROUTES['/'], canonicalPath: '/' };
  }

  function updateMeta(route) {
    document.title = route.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', route.description);

    const canonical = document.getElementById('canonical-tag');
    if (canonical) canonical.setAttribute('href', route.canonical);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', route.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', route.description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', route.canonical);

    const existingSchema = document.getElementById('page-schema');
    if (existingSchema) existingSchema.remove();

    if (route.schema) {
      const schemaEl = document.createElement('script');
      schemaEl.type        = 'application/ld+json';
      schemaEl.id          = 'page-schema';
      schemaEl.textContent = JSON.stringify(route.schema);
      document.head.appendChild(schemaEl);
    }
  }

  function killGSAP() {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
  }

  async function navigate(path, pushState) {
    const cleanPath = normalisePath(path);
    const hash      = path.includes('#') ? path.split('#')[1] : null;
    const { route, canonicalPath } = resolveRoute(cleanPath);

    /* If this is a redirect, rewrite the URL silently to the new path. */
    const finalPath = (canonicalPath !== cleanPath ? canonicalPath : path);

    if (pushState) {
      history.pushState({ path: canonicalPath }, route.title, finalPath);
    } else if (canonicalPath !== cleanPath) {
      history.replaceState({ path: canonicalPath }, route.title, canonicalPath + (hash ? '#' + hash : ''));
    }

    const app = document.getElementById('app');
    if (!app) return;

    /* Hide #app instantly (no transition) so the previous page does not stay
       visible while the new one is being prepared. */
    app.style.transition = 'none';
    app.style.opacity = '0';
    /* Force layout flush so the browser commits opacity:0 before we swap content. */
    void app.offsetHeight;

    try {
      let html;
      if (pageCache[route.page]) {
        html = pageCache[route.page];
      } else {
        const res = await fetch(route.page);
        if (!res.ok) throw new Error('Page not found: ' + route.page);
        html = await res.text();
        pageCache[route.page] = html;
      }

      /* Update meta, hero visibility, and clean GSAP while #app is hidden. */
      updateMeta(route);

      const subpageHero = document.getElementById('ambernord-subpage-hero-bg');
      if (subpageHero) {
        const isLanding  = route.type === 'landing';
        const isProduct  = route.type === 'product';
        const isThankYou = route.type === 'thankyou';
        if (!isLanding && !isProduct && !isThankYou) {
          subpageHero.classList.add('is-visible');
        } else {
          subpageHero.classList.remove('is-visible');
        }
      }

      killGSAP();

      /* Reset the landing-only "hide topbar bio badge" state on every nav.
         Landing's init re-adds it; subpages leave it off so the badge is shown. */
      document.documentElement.classList.remove('landing-hero-active');

      /* Swap DOM, scroll, attach handlers, run init — all while invisible. */
      app.innerHTML = html;

      if (hash) {
        setTimeout(function () {
          const target     = document.getElementById(hash);
          const navHeight  = document.getElementById('siteNav')?.offsetHeight || 80;
          const extraOffset = hash === 'shop' ? 160 : 0;
          if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset, behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

      attachLinkListeners();

      /* Await the page's init function — most do `await loadI18n(...)` and then
         apply scroll-reveal classes (opacity:0). If we faded in #app before init
         finished, those classes would land on already-visible content and cause
         a "flash → vanish → fade back" flicker. */
      const initName = INITS[route.type];
      if (initName && typeof window[initName] === 'function') {
        try { await window[initName](); } catch (e) { console.error('[Router] init failed:', e); }
      }

      /* Two rAFs: the first commits all DOM/style changes to the next frame,
         the second triggers the actual fade-in. Without this, the transition
         from opacity:0 to opacity:1 happens instantly because the browser
         coalesces both writes within the same frame. */
      requestAnimationFrame(function () {
        app.style.transition = 'opacity 0.25s ease';
        requestAnimationFrame(function () {
          app.style.opacity = '1';
        });
      });
    } catch (err) {
      console.error('[Router] Navigation failed:', err);
      app.innerHTML = '<div style="padding:120px 20px;text-align:center;font-family:Montserrat,sans-serif;color:#888;">Seite nicht gefunden.</div>';
      app.style.transition = 'opacity 0.25s ease';
      app.style.opacity = '1';
    }
  }

  function attachLinkListeners() {
    document.querySelectorAll('[data-link]').forEach(function (el) {
      if (el.dataset.routerBound) return;
      el.dataset.routerBound = 'true';

      el.addEventListener('click', function (e) {
        const href = el.getAttribute('href');
        if (!href) return;

        const isExternal = href.startsWith('http') && !href.startsWith('https://ambernord.ch');
        const isMailto   = href.startsWith('mailto');
        const isTel      = href.startsWith('tel');
        if (isExternal || isMailto || isTel) return;

        e.preventDefault();

        const normalised = href.replace('https://ambernord.ch', '');
        const pathPart   = normalised.split('#')[0];
        const hashPart   = normalised.includes('#') ? normalised.split('#')[1] : null;
        const samePage   = pathPart === '' || pathPart === window.location.pathname;

        if (samePage && hashPart) {
          const target     = document.getElementById(hashPart);
          const navHeight  = document.getElementById('siteNav')?.offsetHeight || 80;
          const extraOffset = hashPart === 'shop' ? 160 : 0;
          if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset, behavior: 'smooth' });
          if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
          return;
        }

        if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
        navigate(normalised, true);
      });
    });
  }

  window.attachLinkListeners = attachLinkListeners;

  window.addEventListener('popstate', function (e) {
    const path = e.state ? e.state.path : window.location.pathname;
    navigate(path, false);
  });

  document.addEventListener('DOMContentLoaded', function () {
    attachLinkListeners();
    const initialPath = window.location.pathname + window.location.search + window.location.hash;
    history.replaceState({ path: window.location.pathname }, document.title, initialPath);
    navigate(window.location.pathname + window.location.hash, false);
  });

})();
