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
    '/rueckgabe/':       '/hilfe/rueckgabe/'
  };

  const ROUTES = {
    '/': {
      page:        '/pages/home.html',
      title:       'AmberNord | Sanddorn Biohacking & Longevity Schweiz',
      description: 'Entdecken Sie die Kraft von Sanddorn. AmberNord bietet natürliche Biohacking- und Longevity-Essenzen aus der Schweiz für Ihr tägliches Ritual.',
      canonical:   'https://ambernord.ch/',
      type:        'landing',
      sticky:      null,
      schema:      null
    },

    '/story/': {
      page:        '/pages/about.html',
      title:       'Story | AmberNord',
      description: 'Vom falschen Kick zur echten Klarheit. Erfahren Sie mehr über Gründer Eriks Matisons und die Vision hinter der kompromisslosen AmberNord Sanddorn-Essenz.',
      canonical:   'https://ambernord.ch/story/',
      type:        'about',
      sticky:      null,
      schema:      null
    },

    '/wissenschaft/': {
      page:        '/pages/dossier.html',
      title:       'Wissenschaft | AmberNord',
      description: 'Pharmakologie, Phytochemie und funktionelle Ernährung: das wissenschaftliche Dossier zur AmberNord Methodik rund um Hippophae rhamnoides.',
      canonical:   'https://ambernord.ch/wissenschaft/',
      type:        'dossier',
      sticky:      null,
      schema:      null
    },

    '/ritual/': {
      page:        '/pages/ritual.html',
      title:       'Ritual | AmberNord',
      description: 'Die Wissenschaft hinter dem AmberNord Ritual: 9 Wirkungsbereiche, tägliches Anwendungsprotokoll und Rezeptideen mit Sanddorn-Elixier.',
      canonical:   'https://ambernord.ch/ritual/',
      type:        'ritual',
      sticky:      null,
      schema:      null
    },

    '/shop/': {
      page:        '/pages/shop.html',
      title:       'Shop | AmberNord',
      description: 'Sanddorn-Essenzen wählen – The Starter, The Habit, The Protocol und The Master Box.',
      canonical:   'https://ambernord.ch/shop/',
      type:        'shop',
      sticky:      null,
      schema:      null
    },

    '/shop/starter/': {
      page:        '/pages/the-starter.html',
      title:       'The Starter (1× 250 ml) | AmberNord Sanddorn Elixier',
      description: 'The Starter: Ihr Einstieg in die Welt von AmberNord. Zellschutz und Vitalität durch 190+ Bioaktivstoffe. Kaltgepresst. Bio-zertifiziert.',
      canonical:   'https://ambernord.ch/shop/starter/',
      type:        'product',
      sticky: {
        cta:  'Jetzt starten',
        sub:  '— 2.49 CHF / Tag',
        href: 'https://buy.stripe.com/6oU8wR3PBagV3GpaPBbQY00'
      },
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
      sticky: {
        cta:  'Jetzt starten',
        sub:  '— 2.30 CHF / Tag',
        href: 'https://buy.stripe.com/cNi3cx3PB2Ot6SB4rdbQY01'
      },
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
      sticky: {
        cta:  'Jetzt starten',
        sub:  '— 2.15 CHF / Tag',
        href: 'https://buy.stripe.com/3cI6oJbi3gFjb8R8HtbQY02'
      },
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
      sticky:      null,
      schema:      null
    },

    '/hilfe/faq/': {
      page:        '/pages/faq.html',
      title:       'FAQ | AmberNord',
      description: 'Häufige Fragen zum AmberNord Sanddorn-Elixier: Anwendung, Inhaltsstoffe, Verträglichkeit und Herkunft.',
      canonical:   'https://ambernord.ch/hilfe/faq/',
      type:        'faq',
      sticky:      null,
      schema:      null
    },

    '/hilfe/kontakt/': {
      page:        '/pages/contact.html',
      title:       'Kontakt | AmberNord',
      description: 'Kontaktieren Sie AmberNord – Fragen zu unserem Bio-Sanddornsaft, Bestellungen oder B2B-Partnerschaften.',
      canonical:   'https://ambernord.ch/hilfe/kontakt/',
      type:        'contact',
      sticky:      null,
      schema:      null
    },

    '/hilfe/bestellstatus/': {
      page:        '/pages/bestellstatus.html',
      title:       'Bestellstatus | AmberNord',
      description: 'Geben Sie Ihre Bestellnummer ein, um den Status Ihrer Lieferung zu prüfen.',
      canonical:   'https://ambernord.ch/hilfe/bestellstatus/',
      type:        'bestellstatus',
      sticky:      null,
      schema:      null
    },

    '/hilfe/rueckgabe/': {
      page:        '/pages/returns.html',
      title:       'Rückgabe & Erstattung | AmberNord',
      description: 'Rückgabe- und Erstattungsrichtlinie für AmberNord Bio-Sanddornsaft.',
      canonical:   'https://ambernord.ch/hilfe/rueckgabe/',
      type:        'returns',
      sticky:      null,
      schema:      null
    },

    '/datenschutz/': {
      page:        '/pages/datenschutz.html',
      title:       'Datenschutzerklärung | AmberNord',
      description: 'Datenschutz gemäss revDSG.',
      canonical:   'https://ambernord.ch/datenschutz/',
      type:        'datenschutz',
      sticky:      null,
      schema:      null
    },

    '/b2b/': {
      page:        '/pages/b2b.html',
      title:       'B2B Klinische Rohstoffe | AmberNord',
      description: 'Zertifizierte Sanddorn-Rohstoffe in Bulk-Mengen. ISO 22000, EU-Bio.',
      canonical:   'https://ambernord.ch/b2b/',
      type:        'b2b',
      sticky:      null,
      schema:      null
    },

    '/danke/': {
      page:        '/pages/thankyou.html',
      title:       'Bestellung bestätigt | AmberNord',
      description: 'Deine Bestellung ist eingegangen. AmberNord bereitet dein Elixier vor.',
      canonical:   'https://ambernord.ch/danke/',
      type:        'thankyou',
      sticky:      null,
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
    returns:          'initReturns'
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

  function updateMobileSticky(route) {
    const sticky  = document.getElementById('mobileStickyGlobal');
    const btn     = document.getElementById('mobileStickyBtn');
    const subText = document.getElementById('mobileStickySubText');

    if (!sticky || !btn) return;

    if (route.sticky) {
      subText.textContent = route.sticky.sub;

      btn.replaceWith(btn.cloneNode(true));
      document.getElementById('mobileStickyBtn').addEventListener('click', function () {
        window.location.href = route.sticky.href;
      });

      const orderBtn = document.querySelector('.order-btn-stripe');
      if (orderBtn && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) sticky.classList.remove('is-visible');
          });
        }, { threshold: 0.1 }).observe(orderBtn);
      }

      window.addEventListener('scroll', function () {
        if (window.scrollY > 300) sticky.classList.add('is-visible');
      }, { passive: true });

    } else {
      sticky.classList.remove('is-visible');
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

    const app = document.getElementById('app');
    if (!app) return;

    app.style.opacity = '0';

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

      app.innerHTML = html;

      requestAnimationFrame(function () {
        app.style.transition = 'opacity 0.3s ease';
        app.style.opacity    = '1';
      });

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
      updateMobileSticky(route);

      const initName = INITS[route.type];
      if (initName && typeof window[initName] === 'function') {
        window[initName]();
      }
    } catch (err) {
      console.error('[Router] Navigation failed:', err);
      app.innerHTML = '<div style="padding:120px 20px;text-align:center;font-family:Montserrat,sans-serif;color:#888;">Seite nicht gefunden.</div>';
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
