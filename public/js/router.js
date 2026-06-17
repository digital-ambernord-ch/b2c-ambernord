/* AmberNord SPA router — History API, fragment fetch, meta + JSON-LD, init dispatch. */

(function () {

  /* ------------------------------------------------------------------------
     LOCALE-PREFIXED URLS — /en/, /fr/, /it/ prefix a route; German lives at
     the root (no /de/). The locale is fixed per page load: switching language
     triggers a full reload onto the prefixed URL (see i18n.js setLang), so
     everything downstream can treat `currentLocale` as a constant. There are
     NO automatic geo/language redirects — the URL alone decides the locale.
     ------------------------------------------------------------------------ */

  function pathLocale(path) {
    const m = /^\/(en|fr|it)(?=\/|$)/.exec(path || '');
    return m ? m[1] : 'de';
  }

  function stripLocale(path) {
    return ((path || '/').replace(/^\/(en|fr|it)(?=\/|$)/, '')) || '/';
  }

  const currentLocale = pathLocale(window.location.pathname);

  window.getLocale = function () { return currentLocale; };

  /* localePath('/story/') → '/story/' (de) or '/fr/story/' (fr). Idempotent:
     an already-prefixed path is stripped first, so it is safe to call on
     hrefs that may or may not carry a prefix. External URLs pass through. */
  window.localePath = function (path) {
    if (!path || path.charAt(0) !== '/') return path;
    const clean = stripLocale(path);
    return currentLocale === 'de' ? clean : '/' + currentLocale + clean;
  };

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
      schema: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "AmberNord",
        "url": "https://ambernord.ch/",
        "logo": "https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto:best,h_160/v1776015174/bio-sanddorn-elixier-schweiz-ambernord-ritual-with-Zelt-premium-edition_k5pn3w.png",
        "founder": {
          "@type": "Person",
          "name": "Eriks Matisons",
          "jobTitle": "Gründer"
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Aarau",
          "addressCountry": "CH"
        },
        "sameAs": [
          "https://www.facebook.com/ambernord.ch/",
          "https://www.instagram.com/ambernord.ch/",
          "https://www.tiktok.com/@ambernord.ch",
          "https://www.youtube.com/@ambernord"
        ]
      }
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
      description: 'The Habit: Das 30-Tage-Ritual mit kaltgepresstem Bio-Sanddorn. Bio-zertifiziert, Omega-7, 190+ Bioaktivstoffe.',
      canonical:   'https://ambernord.ch/shop/habit/',
      type:        'product',
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Habit (3× 250 ml)",
        "description": "The Habit: Das 30-Tage-Ritual. Bio-zertifiziert, kaltgepresst, reich an Omega-7.",
        "image": [
          "https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1774798926/ambernord-sanddornsaft-kur-3er-pack-longevity-biohacking.webp_cg74qe.png"
        ],
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
        "image": [
          "https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1774798936/ambernord-sanddorn-elixier-6er-vorratspack-premium-qualit%C3%A4t.webp_v9c6bd.png"
        ],
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
      type:        'product',
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Master Box (20× 250 ml)",
        "description": "The Master Box: die exklusive Original-Edition mit 20× 250 ml kaltgepresstem Bio-Sanddornsaft. Über 25 % Ersparnis.",
        "image": [
          "https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1781632763/AmberNord_the_masterbox_20x250ml_ritual_kig85d.jpg"
        ],
        "brand": { "@type": "Brand", "name": "AmberNord" },
        "offers": {
          "@type": "Offer",
          "url": "https://ambernord.ch/shop/master-box/",
          "priceCurrency": "CHF",
          "price": "370.00",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      }
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

    '/impressum/': {
      page:        '/pages/impressum.html',
      title:       'Impressum | AmberNord',
      description: 'Impressum der AmberNord — Anbieterkennzeichnung gemäss schweizerischem Recht.',
      canonical:   'https://ambernord.ch/impressum/',
      type:        'impressum',
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
      description: 'Ihre Bestellung ist eingegangen. AmberNord bereitet Ihr Elixier vor.',
      canonical:   'https://ambernord.ch/danke/',
      type:        'thankyou',
      schema:      null
    },

    '/bewertungen/': {
      page:        '/pages/bewertungen.html',
      title:       'Kundenstimmen | AmberNord',
      description: 'Verifizierte Erfahrungen aus der Schweiz: Stimmen zum AmberNord Sanddorn-Elixier nach mindestens 14 Tagen täglicher Anwendung.',
      canonical:   'https://ambernord.ch/bewertungen/',
      type:        'bewertungen',
      schema:      null
    },

    '/2-fuer-1/': {
      page:        '/pages/aktion-2-fuer-1.html',
      title:       'Markteinführungs-Edition · 2 für 1 | AmberNord',
      description: 'Markteinführungs-Edition: 2 × The Starter zum Preis von 1. Limitiert auf 250 Sets in der Schweiz. Im Gegenzug bitten wir nach 14 Tagen um eine ehrliche Bewertung.',
      canonical:   'https://ambernord.ch/2-fuer-1/',
      type:        'aktion2fuer1',
      schema:      null
    },

    '/2-fuer-1/danke/': {
      page:        '/pages/aktion-2-fuer-1-danke.html',
      title:       'Aktion gesichert | AmberNord',
      description: 'Sie sind Teil der Markteinführungs-Edition. Ihre Bestellung ist eingegangen.',
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
    impressum:        'initImpressum',
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

  /* ------------------------------------------------------------------------
     OG / Twitter share image per route. The card image is chosen by the
     locale-less canonical path: the three sellable PDPs and the 2-für-1
     campaign each get their own product shot; every other route falls back to
     the brand ritual image. All variants are c_fill 1200×630, so the static
     og:image:width / og:image:height / twitter:card tags in index.html stay
     valid for every route. Mirrored in scripts/prerender.mjs for the static
     build, and consumed by i18n.js (loadI18n) so it always wins as the last
     writer of og:image on every navigation. */
  const OG_IMAGE_FALLBACK = 'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774812498/ambernord-zelt-taegliches-ritual-sanddorn-konzentrat-morgenroutine.webp_tnwv2r.jpg';
  const OG_IMAGES = {
    '/shop/starter/':  'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774514853/ambernord-sanddornsaft-einzel-250ml_c0vwjx.jpg',
    '/shop/habit/':    'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774514833/ambernord-sanddornsaft-3er-pack-250ml_em8h2n.jpg',
    '/shop/protocol/': 'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774514800/ambernord-sanddornsaft-6er-pack-250ml_ofvtkj.jpg',
    '/shop/master-box/': 'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1781632763/AmberNord_the_masterbox_20x250ml_ritual_kig85d.jpg',
    '/2-fuer-1/':      'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1778164908/Markteinf%C3%BChrungs-Aktion_2_The_Starter_zum_Preis_von_1_Im_Gegenzug_bitten_wir_nach_14_Tagen_um_eine_ehrliche_Bewertung_pbompq.jpg'
  };

  /* Resolve the share image for a path (defaults to the current URL). Strips
     any origin + locale prefix and follows REDIRECTS so legacy/aliased paths
     map to the same image as their canonical route. Always returns a URL. */
  function ogImageForPath(path) {
    const raw       = (path || window.location.pathname).replace(/^https?:\/\/[^/]+/, '');
    const clean     = normalisePath(stripLocale(raw));
    const canonical = REDIRECTS[clean] || clean;
    return OG_IMAGES[canonical] || OG_IMAGE_FALLBACK;
  }
  window.ambernordOgImage = ogImageForPath;

  /* Set og:image + twitter:image to the route's share image. Width/height and
     twitter:card are static in index.html (every image is 1200×630). */
  function applyOgImage(path) {
    const url = ogImageForPath(path);
    const og = document.querySelector('meta[property="og:image"]');
    if (og) og.setAttribute('content', url);
    const tw = document.querySelector('meta[name="twitter:image"]');
    if (tw) tw.setAttribute('content', url);
  }
  window.applyOgImage = applyOgImage;

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

    applyOgImage(route.canonical);

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

  /* Custom smooth scroll — the browser's native `behavior: 'smooth'` runs at a
     fixed ~600ms regardless of distance, which feels rushed on long anchor
     scrolls (e.g. hero CTA → product grid). This rAF loop runs ~1000ms with
     ease-in-out cubic for a calmer, more premium feel. Cancels itself the
     moment the user touches the wheel/touch/scroll keys so it never fights
     manual scrolling, and falls back to an instant jump under
     prefers-reduced-motion. Cost: a single rAF chain for ~1s, then nothing.  */
  function smoothScrollTo(targetY, opts) {
    opts = opts || {};
    const duration = opts.duration || 1000;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, targetY);
      return;
    }

    const startY    = window.scrollY;
    const distance  = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const startTime = performance.now();
    let cancelled   = false;

    function onUserScroll()    { cancelled = true; }
    function onUserKey(e) {
      const keys = ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '];
      if (keys.indexOf(e.key) !== -1) cancelled = true;
    }

    window.addEventListener('wheel',      onUserScroll, { passive: true });
    window.addEventListener('touchstart', onUserScroll, { passive: true });
    window.addEventListener('keydown',    onUserKey);

    function cleanup() {
      window.removeEventListener('wheel',      onUserScroll);
      window.removeEventListener('touchstart', onUserScroll);
      window.removeEventListener('keydown',    onUserKey);
    }

    function step(now) {
      if (cancelled) { cleanup(); return; }
      const elapsed = now - startTime;
      const t       = Math.min(elapsed / duration, 1);
      const eased   = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, startY + distance * eased);
      if (t < 1) requestAnimationFrame(step);
      else      cleanup();
    }
    requestAnimationFrame(step);
  }

  window.smoothScrollTo = smoothScrollTo;

  /* True only when this document load is a reload (F5 / Ctrl-R), not a fresh
     visit or a back/forward restore. Lets us restore the saved scroll on a
     reload without wrongly restoring it on an unrelated first visit in a tab
     that happens to still hold an old anReloadScroll value. */
  function isReload() {
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      return !!nav && nav.type === 'reload';
    } catch (_) { return false; }
  }

  /* Lift the black boot cover (index.html #an-boot-cover, shown via the
     html.an-booting class set synchronously before first paint). Called ONLY
     after the page is fully placed at its final scroll position with the hero
     snapped — so the reveal shows finished content, never a mid-init flash.
     Idempotent: on SPA navigations the class is long gone, so this no-ops. */
  function revealPage() {
    document.documentElement.classList.remove('an-booting');
  }
  window.revealPage = revealPage;

  /* Resolve the scroll target for an initial (hydrated) load, set it, snap the
     scrubbed hero to it, and ONLY THEN lift the boot cover. The browser's own
     restoration is off (scrollRestoration='manual', index.html) so nothing
     paints at the old position before GSAP loads; we own placement entirely.

     Target priority: a URL hash anchor → the scroll stashed by a language
     switch (i18n.setLang) → the scroll stashed before a reload → top. All
     stashed keys are single-use. We set the scroll, run ScrollTrigger.refresh()
     so the sticky hero snaps to its exact state for that position (instead of
     scrub smoothing animating it there over ~1.5s), set it once more (refresh
     can nudge scroll while recomputing geometry), then reveal on the next
     frame — the cover hides this entire dance behind solid black. */
  function placeAndReveal(hash) {
    /* Consume both stashed keys regardless of which target wins, so a stale
       value never leaks into a later load. */
    let saved = null;
    try {
      const lang = sessionStorage.getItem('langSwitchScroll');
      if (lang !== null) { sessionStorage.removeItem('langSwitchScroll'); saved = parseFloat(lang) || 0; }
      const reload = sessionStorage.getItem('anReloadScroll');
      if (reload !== null) sessionStorage.removeItem('anReloadScroll');
      if (saved === null && reload !== null && isReload()) saved = parseFloat(reload) || 0;
    } catch (_) {}

    function targetY() {
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          const navHeight   = document.getElementById('siteNav')?.offsetHeight || 80;
          const extraOffset = hash === 'shop' ? 160 : (hash === 'habit-card' ? 50 : 0);
          return Math.max(0, el.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset);
        }
        return 0;
      }
      return saved && saved > 0 ? saved : 0;
    }

    requestAnimationFrame(function () {
      const y = targetY();
      window.scrollTo({ top: y, behavior: 'instant' });
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      requestAnimationFrame(function () {
        window.scrollTo({ top: y, behavior: 'instant' });
        requestAnimationFrame(revealPage);
      });
    });
  }

  /* Both the desktop topbar and the mobile overlay menu use
     [aria-current="page"] to paint the active entry in gold. For the topbar
     dropdowns (Shop, Hilfe), we propagate the current state up to the
     parent button so the section heading itself glows when the user is on
     any sublink — the dropdown stays closed but signals "you are here". */
  function markActiveNavLink(currentPath) {
    const norm = function (p) {
      return stripLocale((p || '').replace(/^https?:\/\/[^/]+/, '')).replace(/\/$/, '') || '/';
    };
    const target = norm(currentPath || window.location.pathname);

    /* 1) Plain link entries (top-level desktop nav + mobile overlay items). */
    document.querySelectorAll('.nav-links > a, .mobile-link, .mobile-sublink').forEach(function (link) {
      if (norm(link.getAttribute('href')) === target) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    /* 2) Desktop dropdown buttons — set aria-current when ANY sublink inside
          the dropdown's content matches the current path. Scoped per dropdown. */
    document.querySelectorAll('.ambernord-dropdown').forEach(function (dropdown) {
      const btn   = dropdown.querySelector('.ambernord-dropbtn');
      const links = dropdown.querySelectorAll('.ambernord-dropdown-content a[href]');
      let match = false;
      links.forEach(function (a) {
        if (norm(a.getAttribute('href')) === target) match = true;
      });
      if (btn) {
        if (match) btn.setAttribute('aria-current', 'page');
        else        btn.removeAttribute('aria-current');
      }
      /* Also light up the matching sublink itself so users who do open the
         dropdown see the precise sub-page they are on. */
      links.forEach(function (a) {
        if (norm(a.getAttribute('href')) === target) {
          a.setAttribute('aria-current', 'page');
        } else {
          a.removeAttribute('aria-current');
        }
      });
    });
  }

  async function navigate(path, pushState, hydrate) {
    /* Route matching always happens on the locale-less path; the visible URL
       keeps the current locale prefix via localePath(). */
    const cleanPath = normalisePath(stripLocale(path));
    const hash      = path.includes('#') ? path.split('#')[1] : null;
    /* Preserve any query string (e.g. ?inquiry=masterbox) — normalisePath strips
       it for route matching, but it must survive into the pushed URL so pages
       can read window.location.search (contact.js inquiry autofill). */
    const beforeHash = path.split('#')[0];
    const search     = beforeHash.includes('?') ? '?' + beforeHash.split('?').slice(1).join('?') : '';
    const { route, canonicalPath } = resolveRoute(cleanPath);

    const localizedPath = window.localePath(canonicalPath) + search + (hash ? '#' + hash : '');

    if (pushState) {
      history.pushState({ path: canonicalPath }, route.title, localizedPath);
    } else if (canonicalPath !== cleanPath || pathLocale(window.location.pathname) !== currentLocale) {
      history.replaceState({ path: canonicalPath }, route.title, localizedPath);
    }

    /* Reflect the new path on every nav link in the mobile overlay so the
       entry the user just landed on stands out in gold (CSS reads
       aria-current="page"). Includes both top-level and nested sublinks. */
    markActiveNavLink(canonicalPath);

    /* Notify non-routing shell modules (e.g. exit-intent.js) that the route
       changed. Fires on the initial hydrate and every SPA navigation, after
       history has been updated, so listeners see the final canonical path. */
    window.dispatchEvent(new CustomEvent('an:navigated', { detail: { path: canonicalPath, type: route.type } }));

    const app = document.getElementById('app');
    if (!app) return;

    /* INITIAL-LOAD HYDRATION — the prerendered build already injected this
       route's fragment into #app with the correct localized <title>, meta,
       canonical, hreflang and JSON-LD (#page-schema). The old path re-fetched
       the fragment and did app.innerHTML = html on first load too, which threw
       all of that away: an opacity 0→1 flash, a scroll reset, and — because
       GSAP is deferred — the sticky hero painting full-size before ScrollTrigger
       could shrink it. Hydrate in place instead: leave the DOM and meta exactly
       as prerendered, just toggle the subpage stripe, wire links and run init.
       updateMeta() is intentionally NOT called — it would clobber the localized
       title with the German ROUTES default (i18n only re-corrects it a frame
       later). Local dev serves an empty #app, so this branch is skipped there. */
    if (hydrate) {
      const subpageHero = document.getElementById('ambernord-subpage-hero-bg');
      if (subpageHero) {
        const blackCanvas =
          route.type === 'landing' || route.type === 'product' ||
          route.type === 'thankyou';
        subpageHero.classList.toggle('is-visible', !blackCanvas);
      }

      /* updateMeta() is intentionally skipped on hydrate (see above), so set the
         share image here — prerender already emitted the correct one, this just
         keeps og:image/twitter:image in sync before loadI18n re-applies it. */
      applyOgImage(canonicalPath);

      /* No ScrollTriggers exist yet on a fresh load, but keep this for symmetry
         and to clear any that a racing init somehow created. */
      killGSAP();
      if (typeof window.destroySectionNav === 'function') window.destroySectionNav();
      attachLinkListeners();

      const initName = INITS[route.type];
      if (initName && typeof window[initName] === 'function') {
        try { await window[initName](); } catch (e) { console.error('[Router] hydrate init failed:', e); }
      }

      /* Init done → GSAP is live. Place the page at its final scroll position
         (hash anchor / restored scroll / top), snap the hero, THEN lift the
         black boot cover so the reveal shows finished, correctly-placed content. */
      placeAndReveal(hash);
      return;
    }

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
        /* Pages that keep a pure-black canvas instead of the ambient stripe:
           landing has its own hero, the product PDPs need a clean dark
           shopping context, and thankyou is intentionally minimal. Every
           other route — including the /shop/ overview — shows the atmospheric
           stripe behind the eyebrow + h1. */
        const blackCanvas =
          route.type === 'landing' ||
          route.type === 'product' ||
          route.type === 'thankyou';
        if (!blackCanvas) {
          subpageHero.classList.add('is-visible');
        } else {
          subpageHero.classList.remove('is-visible');
        }
      }

      killGSAP();
      if (typeof window.destroySectionNav === 'function') window.destroySectionNav();

      /* Reset the landing-only "hide topbar bio badge" state on every nav.
         Landing's init re-adds it; subpages leave it off so the badge shows. */
      document.documentElement.classList.remove('landing-hero-active');

      /* Swap DOM, scroll, attach handlers, run init — all while invisible. */
      app.innerHTML = html;

      if (hash) {
        setTimeout(function () {
          const target     = document.getElementById(hash);
          const navHeight  = document.getElementById('siteNav')?.offsetHeight || 80;
          const extraOffset = hash === 'shop' ? 160 : (hash === 'habit-card' ? 50 : 0);
          if (target) smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset);
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

      attachLinkListeners();

      /* Render the fragment immediately — no blank gap while the init runs.
         The fade-in starts on the next frame; the page init (i18n + scroll
         animations) executes right after and animates over the already
         visible content. Reveal classes are applied by JS only, so content
         stays visible even if an init throws or JS is disabled entirely. */
      requestAnimationFrame(function () {
        app.style.transition = 'opacity 0.18s ease';
        requestAnimationFrame(function () {
          app.style.opacity = '1';
        });
      });

      const initName = INITS[route.type];
      if (initName && typeof window[initName] === 'function') {
        try { await window[initName](); } catch (e) { console.error('[Router] init failed:', e); }
      }

      /* Language-switch scroll restore. setLang() stashes window.scrollY in
         sessionStorage right before location.reload(), and we consume it
         here on the very first navigate() after that reload — so the user
         lands back at the same scroll position in the new locale instead
         of being snapped to the top. Skipped when the URL carries a hash
         (the hash scroll above already placed the user) and one-shot via
         removeItem so subsequent in-app navigations are never affected. */
      if (!hash) {
        try {
          const saved = sessionStorage.getItem('langSwitchScroll');
          if (saved !== null) {
            sessionStorage.removeItem('langSwitchScroll');
            const y = parseFloat(saved) || 0;
            requestAnimationFrame(function () {
              window.scrollTo({ top: y, behavior: 'instant' });
            });
          }
        } catch (_) {}
      } else {
        /* Even with a hash, the saved scroll is stale once consumed by hash —
           clear it so it doesn't leak into a later same-tab navigation. */
        try { sessionStorage.removeItem('langSwitchScroll'); } catch (_) {}
      }

      /* Lift the boot cover once content is rendered + init has run. Only the
         initial local-dev load (empty prerender → this path) still has the
         cover up; production uses the hydrate path above, and SPA navigations
         have long since removed the class, so this no-ops there. */
      requestAnimationFrame(revealPage);
    } catch (err) {
      console.error('[Router] Navigation failed:', err);
      app.innerHTML = '<div style="padding:120px 20px;text-align:center;font-family:Montserrat,sans-serif;color:#888;">Seite nicht gefunden.</div>';
      app.style.transition = 'opacity 0.25s ease';
      app.style.opacity = '1';
      revealPage();
    }
  }

  function attachLinkListeners() {
    document.querySelectorAll('[data-link]').forEach(function (el) {
      if (el.dataset.routerBound) return;
      el.dataset.routerBound = 'true';

      /* Keep visible hrefs locale-aware (hover, copy-link, open-in-new-tab,
         crawlers on prerendered HTML). Markup authors always write the
         root-relative DE path; we prefix it here once per element. */
      const rawHref = el.getAttribute('href') || '';
      if (rawHref.charAt(0) === '/' && currentLocale !== 'de') {
        el.setAttribute('href', window.localePath(rawHref.split('#')[0]) + (rawHref.includes('#') ? '#' + rawHref.split('#')[1] : ''));
      }

      el.addEventListener('click', function (e) {
        const href = el.getAttribute('href');
        if (!href) return;

        const isExternal = href.startsWith('http') && !href.startsWith('https://ambernord.ch');
        const isMailto   = href.startsWith('mailto');
        const isTel      = href.startsWith('tel');
        if (isExternal || isMailto || isTel) return;

        e.preventDefault();

        const normalised = href.replace('https://ambernord.ch', '');
        const rawPath    = normalised.split('#')[0];
        const pathPart   = rawPath ? stripLocale(rawPath) : '';
        const hashPart   = normalised.includes('#') ? normalised.split('#')[1] : null;
        const samePage   = pathPart === '' || pathPart === stripLocale(window.location.pathname);

        if (samePage && hashPart) {
          const target     = document.getElementById(hashPart);
          const navHeight  = document.getElementById('siteNav')?.offsetHeight || 80;
          const extraOffset = hashPart === 'shop' ? 160 : (hashPart === 'habit-card' ? 50 : 0);
          if (target) smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset);
          if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
          return;
        }

        if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
        navigate(normalised, true);
      });
    });
  }

  window.attachLinkListeners = attachLinkListeners;

  /* Programmatic SPA navigation for WebMCP's navigate_to tool (js/webmcp.js)
     and any other automation entry point. Takes a canonical, locale-less path
     (e.g. '/shop/'); the router applies the active locale prefix and hydrates. */
  window.ambernordNavigate = function (path) { return navigate(path, true); };

  window.addEventListener('popstate', function (e) {
    const path = e.state ? e.state.path : window.location.pathname;
    navigate(path, false);
  });

  /* Persist scroll position for a true reload. SPA link clicks navigate via
     pushState and never fire pagehide, so this only ever captures a genuine
     reload / tab close / cross-document nav. placeAndReveal() reads it back,
     but only when the performance navigation type is actually 'reload'. */
  window.addEventListener('pagehide', function () {
    try { sessionStorage.setItem('anReloadScroll', String(window.scrollY || 0)); } catch (_) {}
  });

  document.addEventListener('DOMContentLoaded', function () {
    attachLinkListeners();
    const initialPath = window.location.pathname + window.location.search + window.location.hash;
    history.replaceState({ path: window.location.pathname }, document.title, initialPath);
    /* If the prerendered build served real content inside #app, hydrate over it
       in place instead of re-fetching and replacing it (see the hydrate branch
       in navigate). Local dev ships an empty #app, so this is false there and
       the normal fetch path runs. */
    const app = document.getElementById('app');
    const hydrate = !!(app && app.innerHTML.trim());
    navigate(window.location.pathname + window.location.hash, false, hydrate);
  });

})();
