/* =============================================================================
   AmberNord — WebMCP (Web Model Context Protocol)
   https://github.com/webmachinelearning/webmcp · Chrome "agentic browsing"

   Registers AmberNord's catalogue, brand facts and SPA navigation as
   structured, agent-callable tools via the modelContext API, so AI agents
   (and Chrome's agentic-browsing audits) can read and move around the shop
   without scraping the DOM. Declarative form tools (toolname/tooldescription)
   live in the page fragments; this module covers the imperative tools.

   EXPERIMENTAL + FAIL-SOFT: everything is feature-detected and wrapped in
   try/catch. A browser without the modelContext API — i.e. virtually all of
   them today — is completely unaffected: no tools, no errors, no overhead.
   All tools are read-only except navigate_to, which only changes the SPA route
   (no data writes, no side effects). Results are returned as strings (JSON for
   data) to match the WebMCP imperative-API examples.
   ========================================================================== */
(function () {
  'use strict';

  /* Entry point moved: Chrome 149 exposed navigator.modelContext; Chrome 150+
     deprecated that in favour of document.modelContext. Prefer the current
     surface and fall back to the older one so both trial builds work. */
  var mc = document.modelContext || navigator.modelContext;
  if (!mc || typeof mc.registerTool !== 'function') return;   /* unsupported → no-op */

  var ORIGIN = 'https://ambernord.ch';

  /* Catalogue — mirrors the product data in scripts/prerender.mjs. */
  var PRODUCTS = [
    { id: 'starter',    name: 'The Starter',    bottles: 1,  volumeMl: 250, priceCHF: 24.90,  path: '/shop/starter/' },
    { id: 'habit',      name: 'The Habit',      bottles: 3,  volumeMl: 250, priceCHF: 69.00,  path: '/shop/habit/' },
    { id: 'protocol',   name: 'The Protocol',   bottles: 6,  volumeMl: 250, priceCHF: 129.00, path: '/shop/protocol/' },
    { id: 'master-box', name: 'The Master Box', bottles: 20, volumeMl: 250, priceCHF: 370.00, path: '/shop/master-box/' }
  ].map(function (p) { p.url = ORIGIN + p.path; return p; });

  var BRAND = {
    name: 'AmberNord',
    summary: 'Swiss premium organic sea-buckthorn (Sanddorn) elixir — single-origin Nordic berries, hand-harvested and cold-pressed into a pure daily concentrate.',
    origin: 'Aarau, Switzerland',
    usage: 'The 1:10 protocol — mix 1 part essence with 10 parts still or sparkling water, ideally in the morning on an empty stomach (~30 seconds a day).',
    keyFacts: [
      '190+ bioactive compounds from a single botanical source',
      'Naturally high in Vitamin C — roughly 9x that of citrus; Vitamin C contributes to the reduction of tiredness and fatigue and to normal immune function',
      "One of nature's rarest plant sources of Omega-7 (palmitoleic acid), up to 42% of the pulp oil, alongside Omega 3, 6 and 9",
      '100% hand-harvested, cold-pressed, single-origin and fully traceable'
    ],
    certifications: ['ProCert organic (CH-BIO-038, certificate ID 141710)', 'EU Organic'],
    guarantee: '30-day money-back guarantee; ships within 24h from Aarau',
    languages: ['de (canonical, root)', 'en (/en/)', 'fr (/fr/)', 'it (/it/)']
  };

  /* Friendly page name → canonical (locale-less) path for navigate_to. The SPA
     router (window.ambernordNavigate) applies the active locale prefix. */
  var PAGES = {
    home: '/', shop: '/shop/', story: '/story/', science: '/wissenschaft/',
    ritual: '/ritual/', reviews: '/bewertungen/', faq: '/hilfe/faq/',
    contact: '/hilfe/kontakt/', returns: '/hilfe/rueckgabe/',
    'order-status': '/hilfe/bestellstatus/', b2b: '/b2b/',
    starter: '/shop/starter/', habit: '/shop/habit/',
    protocol: '/shop/protocol/', 'master-box': '/shop/master-box/'
  };

  function result(data) {
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
  function register(tool) {
    try { mc.registerTool(tool); } catch (e) { /* never break the page */ }
  }

  register({
    name: 'list_products',
    description: 'List all AmberNord sea-buckthorn products with pack size, volume, price in CHF and product-page URL.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async function () { return result({ currency: 'CHF', products: PRODUCTS }); }
  });

  register({
    name: 'get_product_details',
    description: 'Get the details (pack size, volume, price, URL) for one AmberNord product by its id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', enum: ['starter', 'habit', 'protocol', 'master-box'], description: 'Product identifier' }
      },
      required: ['id']
    },
    annotations: { readOnlyHint: true },
    execute: async function (input) {
      var id = input && input.id;
      var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];
      return result(p || { error: 'Unknown product id. Valid ids: starter, habit, protocol, master-box.' });
    }
  });

  register({
    name: 'get_brand_info',
    description: 'Get key facts about AmberNord: what the product is, ingredients, certifications, recommended usage, guarantees and available languages.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async function () { return result(BRAND); }
  });

  register({
    name: 'navigate_to',
    description: 'Navigate the AmberNord website to a given page within the current language.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'string', enum: Object.keys(PAGES), description: 'The destination page' }
      },
      required: ['page']
    },
    execute: async function (input) {
      var path = PAGES[input && input.page];
      if (!path) return result({ error: 'Unknown page. Valid pages: ' + Object.keys(PAGES).join(', ') });
      if (typeof window.ambernordNavigate === 'function') {
        window.ambernordNavigate(path);
        return result('Navigated to ' + input.page + ' (' + path + ').');
      }
      window.location.href = path;     /* fallback before the router is ready */
      return result('Navigating to ' + input.page + '.');
    }
  });
})();
