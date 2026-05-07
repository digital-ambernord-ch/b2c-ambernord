# AmberNord b2c — CLAUDE.md

Swiss premium sea-buckthorn (Sanddorn) brand. Vanilla-JS SPA hosted on Cloudflare Pages.

## Stack & deploy

- Static site under [public/](public/) — no build step, served as-is by Cloudflare Pages.
- SPA fallback: [public/_redirects](public/_redirects) sends every path to `/index.html`.
- Security headers + CSP allowlist (Cloudinary, Stripe, GA, TikTok, fonts.gstatic, Web3Forms): [public/_headers](public/_headers).
- [wrangler.toml](wrangler.toml), [functions/_middleware.js](functions/_middleware.js), [functions/api/checkout.js](functions/api/checkout.js), [functions/api/contact.js](functions/api/contact.js), [functions/api/health.js](functions/api/health.js), [.env](.env) are **all empty stubs** — no server-side logic in this repo. Checkout uses Stripe payment links; contact form uses Web3Forms.
- Third-party JS loaded from CDN: GSAP + ScrollTrigger 3.12.2 ([public/index.html:358-359](public/index.html#L358-L359)), Google Fonts (Montserrat + Playfair Display).

## SPA architecture

- [public/index.html](public/index.html) is the shell: nav, footer, mobile menu, FAB, sticky mobile CTA, cookie banner/modal, gated `<script type="text/plain">` analytics tags, lightbox container. `<main id="app">` is the router target.
- [public/js/router.js](public/js/router.js) is the only routing layer:
  - `REDIRECTS` map for legacy paths → canonical: [router.js:6-22](public/js/router.js#L6-L22).
  - `ROUTES` table — page fragment + meta + JSON-LD + mobile sticky config: [router.js:24-281](public/js/router.js#L24-L281).
  - `INITS` map of `route.type` → `window.<initName>` function: [router.js:284-303](public/js/router.js#L284-L303). Adding a page = add route + init function on `window`.
  - Navigate flow: hide `#app`, fetch fragment (cached), update meta + JSON-LD, kill GSAP ScrollTriggers, swap DOM, scroll, run init, double-rAF fade in: [router.js:387-481](public/js/router.js#L387-L481).
- Internal links use `data-link` attribute. `attachLinkListeners` rebinds after every nav: [router.js:483-519](public/js/router.js#L483-L519).
- Stripe payment links and external `http://` URLs bypass the router.

## Page modules

- Each route's init fn lives at `public/js/<page>.js` and registers itself on `window`. Loaded with `defer` from [public/index.html:360-382](public/index.html#L360-L382).
- Init pattern: `await window.loadI18n(getLang(), '<page>')` first, then DOM bind. See [public/js/product.js](public/js/product.js), [public/js/landing.js](public/js/landing.js), [public/js/agb.js](public/js/agb.js).
- Shared UI (mobile menu, dropdowns, language switcher, deferred analytics): [public/js/ui.js](public/js/ui.js).

## i18n

- Locales: `de`, `en`, `fr`, `it`. Stored in [public/data/](public/data/) — **the German folder is uppercase `DE/` while others are lowercase**; relies on Cloudflare's case-insensitive serving. Local case-sensitive tooling can miss it.
- Default lang resolution: `localStorage.lang` → `'de'`. Switching reloads the page: [public/js/i18n.js:57-58](public/js/i18n.js#L57-L58).
- Two passes per nav: `loadCommonI18n()` on initial load applies nav/footer/cookie strings from `common.json`; each route init calls `loadI18n(lang, '<page>')` for the fragment: [public/js/i18n.js](public/js/i18n.js).
- DOM hooks: `data-i18n` (textContent), `data-i18n-html` (innerHTML), `data-i18n-attr="attr:path"` (attribute set).
- `data.meta.{title,description,canonical,og,hreflang}` overrides router-set meta when present.
- Fallback chain: requested lang → `de` (forced lowercase, only works because of case-insensitive serving).
- **Always propagate new copy to all 4 locales** (see memory feedback_translations.md).

## Styles

- All CSS preloaded in [public/index.html:33-51](public/index.html#L33-L51) — global stylesheet stack, no scoping.
- Design tokens (colors, gold palette, fonts, spacing scale, container/nav heights, z-index layers, easings/durations): [public/css/main.css:11-60](public/css/main.css#L11-L60). **Always use tokens, never hardcoded values.**
- Globals (reset, typography, buttons, FAB, nav, footer, mobile menu, skip-link, `.subpage-header`, `.subpage-container`): [public/css/main.css](public/css/main.css).
- Per-page CSS files mirror the page name: e.g. [public/css/landing.css](public/css/landing.css), [public/css/product.css](public/css/product.css), [public/css/shop.css](public/css/shop.css). AGB reuses returns styles by class.
- `aktion-active` is set synchronously on `<html>` in [public/index.html:53-65](public/index.html#L53-L65) to avoid layout shift; styling lives in [public/css/aktion-bar.css](public/css/aktion-bar.css). Bump `AKTION_VERSION` in [public/js/aktion-bar.js](public/js/aktion-bar.js) AND the localStorage key in index.html in lockstep when the message changes.

## Animation

- GSAP + ScrollTrigger globally available. Each page registers its own scroll triggers; the router calls `ScrollTrigger.getAll().forEach(t => t.kill())` on every nav: [router.js:381-385](public/js/router.js#L381-L385).
- Landing hero scroll choreography (desktop + mobile branches via `gsap.matchMedia()`): [public/js/landing.js:34-84](public/js/landing.js#L34-L84).
- All animations gated on `prefers-reduced-motion`: [public/js/landing.js:25](public/js/landing.js#L25).
- Generic `.gsap-reveal` fade-up reveal: [public/js/landing.js:145-162](public/js/landing.js#L145-L162). Plain CSS `.page-reveal` is used by JSON-rendered pages.

## Cookie consent

- GDPR/ePrivacy. Operator guide: [COOKIE-CONSENT.md](COOKIE-CONSENT.md). Module: [public/js/cookie-consent.js](public/js/cookie-consent.js). Categories: necessary, analytics, marketing.
- Pattern A: gate vendor tags as `<script type="text/plain" data-cookie-category="…">` — they're cloned to live `<script>` only when the category is granted. See examples in [public/index.html:327-356](public/index.html#L327-L356).
- When adding a vendor: register cookies in `VENDOR_COOKIES` ([cookie-consent.js:26-45](public/js/cookie-consent.js#L26-L45)) AND mirror them in `cookie.categories.<cat>.list` of every locale's `common.json`, otherwise withdrawal leaks cookies. Bump `CONSENT_VERSION` ([cookie-consent.js:16](public/js/cookie-consent.js#L16)) when policy changes.

## Pages

| Route | Fragment | Init | Status |
|---|---|---|---|
| `/` | [home.html](public/pages/home.html) | `initLanding` | done |
| `/story/` | [about.html](public/pages/about.html) | `initAbout` | done |
| `/wissenschaft/` | [dossier.html](public/pages/dossier.html) | `initDossier` | done |
| `/ritual/` | [ritual.html](public/pages/ritual.html) | `initRitual` | done |
| `/shop/` | [shop.html](public/pages/shop.html) | `initShop` | done |
| `/shop/starter/` | [the-starter.html](public/pages/the-starter.html) | `initProduct` | done |
| `/shop/habit/` | [the-habit.html](public/pages/the-habit.html) | `initProduct` | done |
| `/shop/protocol/` | [the-protocol.html](public/pages/the-protocol.html) | `initProduct` | done |
| `/shop/master-box/` | [the-master-box.html](public/pages/the-master-box.html) | `initTheMasterBox` | done |
| `/hilfe/faq/` | [faq.html](public/pages/faq.html) | `initFaq` | done |
| `/hilfe/kontakt/` | [contact.html](public/pages/contact.html) | `initContact` | done (Web3Forms) |
| `/hilfe/bestellstatus/` | [bestellstatus.html](public/pages/bestellstatus.html) | `initBestellstatus` | done (form-only, no backend) |
| `/hilfe/rueckgabe/` | [returns.html](public/pages/returns.html) | `initReturns` | done |
| `/datenschutz/` | [datenschutz.html](public/pages/datenschutz.html) | `initDatenschutz` | done |
| `/agb/` | [agb.html](public/pages/agb.html) | `initAgb` | done (reuses returns CSS) |
| `/b2b/` | [b2b.html](public/pages/b2b.html) | `initB2b` | done |
| `/danke/` | [thankyou.html](public/pages/thankyou.html) | `initThankyou` | done |
| `/bewertungen/` | [bewertungen.html](public/pages/bewertungen.html) | `initBewertungen` | done |
| `/2-fuer-1/` | [aktion-2-fuer-1.html](public/pages/aktion-2-fuer-1.html) | `initAktion2Fuer1` | done |
| `/2-fuer-1/danke/` | [aktion-2-fuer-1-danke.html](public/pages/aktion-2-fuer-1-danke.html) | `initAktion2Fuer1Danke` | done |

Legacy aliases auto-redirected to canonical paths via the `REDIRECTS` map.

## Conventions

- Page fragments contain content only — no `<html>`, `<head>`, `<body>`, or scripts. Router injects them into `<main id="app">`.
- Most static-text pages render section content from JSON in their init fn (see [agb.js](public/js/agb.js), [returns.js](public/js/returns.js), [datenschutz.js](public/js/datenschutz.js)).
- JSON-LD: route-level schema declared in `ROUTES[…].schema` is injected as `<script id="page-schema">` on nav. Some fragments also embed their own JSON-LD inline.
