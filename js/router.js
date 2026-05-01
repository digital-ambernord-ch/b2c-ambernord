/* =========================================================================
   AMBERNORD — SPA ROUTER
   js/router.js
   History API · Page fetching · Meta updates · JSON-LD · Init dispatch
   ========================================================================= */

(function () {

  /* =========================================================================
     ROUTE DEFINITIONS
     Each route maps a URL path to a page fragment and page metadata.
     ========================================================================= */

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
    '/the-starter/': {
      page:        '/pages/the-starter.html',
      title:       'The Starter (1x 250ml) | AmberNord Sanddorn Elixier',
      description: 'The Starter: Ihr Einstieg in die Welt von AmberNord. Zellschutz und Vitalität durch 190+ Bioaktivstoffe. Kaltgepresst. Bio-zertifiziert.',
      canonical:   'https://ambernord.ch/the-starter/',
      type:        'product',
      sticky: {
        cta:  'Jetzt starten',
        sub:  '— 2.49 CHF / Tag',
        href: 'https://buy.stripe.com/6oU8wR3PBagV3GpaPBbQY00'
      },
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Starter (1x 250ml)",
        "image": [
          "https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1774798945/ambernord-bio-sanddornsaft-zelt-edition-250ml-schweiz.webp_f3eaz0.png"
        ],
        "description": "The Starter — Ihr Einstieg in die Welt von AmberNord. Bio-zertifiziert, kaltgepresst, reich an Omega-7 und über 190 Bioaktivstoffen.",
        "brand": { "@type": "Brand", "name": "AmberNord" },
        "offers": {
          "@type": "Offer",
          "url": "https://ambernord.ch/the-starter/",
          "priceCurrency": "CHF",
          "price": "24.90",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      }
    },
    '/the-habit/': {
      page:        '/pages/the-habit.html',
      title:       'The Habit (3x 250ml) | AmberNord Sanddorn Elixier',
      description: 'The Habit: Das 30-Tage-Ritual für nachhaltigen Fokus, Energie und Zellregeneration. Bio-zertifiziert, Omega-7, 190+ Bioaktivstoffe.',
      canonical:   'https://ambernord.ch/the-habit/',
      type:        'product',
      sticky: {
        cta:  'Jetzt starten',
        sub:  '— 2.30 CHF / Tag',
        href: 'https://buy.stripe.com/cNi3cx3PB2Ot6SB4rdbQY01'
      },
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Habit (3x 250ml)",
        "description": "The Habit: Das 30-Tage-Ritual. Bio-zertifiziert, kaltgepresst, reich an Omega-7.",
        "brand": { "@type": "Brand", "name": "AmberNord" },
        "offers": {
          "@type": "Offer",
          "url": "https://ambernord.ch/the-habit/",
          "priceCurrency": "CHF",
          "price": "69.00",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      }
    },
    '/the-protocol/': {
      page:        '/pages/the-protocol.html',
      title:       'The Protocol (6x 250ml) | AmberNord Sanddorn Elixier',
      description: 'The Protocol: Dauerhafte zelluläre Versorgung für Familie und Höchstleister. Bester Preis pro Tagesration.',
      canonical:   'https://ambernord.ch/the-protocol/',
      type:        'product',
      sticky: {
        cta:  'Jetzt starten',
        sub:  '— 2.15 CHF / Tag',
        href: 'https://buy.stripe.com/3cI6oJbi3gFjb8R8HtbQY02'
      },
      schema: {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "The Protocol (6x 250ml)",
        "description": "The Protocol: Das ultimative Protokoll für Familien und Höchstleister. Bio-zertifiziert.",
        "brand": { "@type": "Brand", "name": "AmberNord" },
        "offers": {
          "@type": "Offer",
          "url": "https://ambernord.ch/the-protocol/",
          "priceCurrency": "CHF",
          "price": "129.00",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      }
    }
  };

  /* =========================================================================
     PAGE FRAGMENT CACHE — avoids re-fetching already visited pages
     ========================================================================= */

  const pageCache = {};

  /* =========================================================================
     SCROLL TO TOP — smooth on route change, instant on anchor hash
     ========================================================================= */

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* =========================================================================
     META UPDATER — title, description, canonical, JSON-LD schema
     ========================================================================= */

  function updateMeta(route) {
    document.title = route.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', route.description);

    let canonical = document.getElementById('canonical-tag');
    if (canonical) canonical.setAttribute('href', route.canonical);

    let existingSchema = document.getElementById('page-schema');
    if (existingSchema) existingSchema.remove();

    if (route.schema) {
      const schemaEl = document.createElement('script');
      schemaEl.type  = 'application/ld+json';
      schemaEl.id    = 'page-schema';
      schemaEl.textContent = JSON.stringify(route.schema);
      document.head.appendChild(schemaEl);
    }
 }
 
  /* =========================================================================
     MOBILE STICKY CTA MANAGER
     Shows on product pages, hidden on landing page
     ========================================================================= */

  function updateMobileSticky(route) {
    const sticky  = document.getElementById('mobileStickyGlobal');
    const btn     = document.getElementById('mobileStickyBtn');
    const subText = document.getElementById('mobileStickySubText');

    if (!sticky || !btn) return;

    if (route.sticky) {
      subText.textContent = route.sticky.sub;

      const handleStickyClick = function () {
        window.location.href = route.sticky.href;
      };

      btn.replaceWith(btn.cloneNode(true));
      document.getElementById('mobileStickyBtn').addEventListener('click', handleStickyClick);

      const orderBtn = document.querySelector('.order-btn-stripe');
      if (orderBtn && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              sticky.classList.remove('is-visible');
            }
          });
        }, { threshold: 0.1 });
        observer.observe(orderBtn);
      }

      window.addEventListener('scroll', function onScroll() {
        if (window.scrollY > 300) {
          sticky.classList.add('is-visible');
        }
      }, { passive: true });

    } else {
      sticky.classList.remove('is-visible');
    }
  }

  /* =========================================================================
     GSAP CLEANUP — kill all ScrollTriggers before loading a new page
     ========================================================================= */

  function killGSAP() {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
  }

  /* =========================================================================
     NAVIGATE — core function: fetch fragment, inject, init
     ========================================================================= */

  async function navigate(path, pushState) {
    const cleanPath = path.split('#')[0] || '/';
    const hash      = path.includes('#') ? path.split('#')[1] : null;

    const route = ROUTES[cleanPath] || ROUTES['/'];

    if (pushState) {
      history.pushState({ path: cleanPath }, route.title, path);
    }

    updateMeta(route);

    // Subpage hero — rāda visur izņemot landing un thank-you
const subpageHero = document.getElementById('ambernord-subpage-hero-bg');
if (subpageHero) {
const isLanding  = route.type === 'landing';
const isProduct  = route.type === 'product';
const isThankYou = cleanPath.includes('vielen-dank') || cleanPath.includes('thank');
if (!isLanding && !isProduct && !isThankYou) {
  subpageHero.classList.add('is-visible');
} else {
  subpageHero.classList.remove('is-visible');
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
          const target    = document.getElementById(hash);
const navHeight = document.getElementById('siteNav')?.offsetHeight || 80;
const extraOffset = hash === 'shop' ? 160 : 0;
if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset, behavior: 'smooth' });
        }, 100);
      } else {
        scrollToTop();
      }

      attachLinkListeners();
      updateMobileSticky(route);

      if (route.type === 'landing' && typeof window.initLanding === 'function') {
        window.initLanding();
      } else if (route.type === 'product' && typeof window.initProduct === 'function') {
        window.initProduct();
      }

    } catch (err) {
      console.error('[Router] Navigation failed:', err);
      app.innerHTML = '<div style="padding:120px 20px;text-align:center;font-family:\'Montserrat\',sans-serif;color:#888;">Seite nicht gefunden.</div>';
      app.style.opacity = '1';
    }
  }

  /* =========================================================================
     LINK INTERCEPTION — attach click listeners to all [data-link] elements
     Called after every page inject (new links appear in #app)
     ========================================================================= */

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

        // Same-page hash link — smooth scroll only, no page re-render or flash
        if (samePage && hashPart) {
          const target    = document.getElementById(hashPart);
const navHeight = document.getElementById('siteNav')?.offsetHeight || 80;
const extraOffset = hashPart === 'shop' ? 160 : 0;
if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset, behavior: 'smooth' });
          if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
          return;
        }

        if (typeof window.closeMobileMenu === 'function') {
          window.closeMobileMenu();
        }

        navigate(normalised, true);
      });
    });
  }

  /* =========================================================================
     BROWSER BACK / FORWARD — popstate handler
     ========================================================================= */

  window.addEventListener('popstate', function (e) {
    const path = e.state ? e.state.path : window.location.pathname;
    navigate(path, false);
  });

  /* =========================================================================
     INITIAL LOAD — run on first page visit
     ========================================================================= */

  document.addEventListener('DOMContentLoaded', function () {
    attachLinkListeners();

    const initialPath = window.location.pathname + window.location.search + window.location.hash;
    history.replaceState({ path: window.location.pathname }, document.title, initialPath);
    navigate(window.location.pathname + window.location.hash, false);
  });

})();
