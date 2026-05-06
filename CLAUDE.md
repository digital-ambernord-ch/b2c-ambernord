# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AmberNord B2C site — a static, dependency-free SPA for a Swiss biohacking/longevity brand selling cold-pressed sea-buckthorn (Sanddorn) elixirs. Deployed on **Cloudflare Pages** with `public/` as the build output directory and `functions/` reserved for Pages Functions (currently empty stubs at `functions/_middleware.js`, `functions/api/checkout.js`, `functions/api/contact.js`, `functions/api/health.js` — `wrangler.toml` and `.env` are also empty placeholders).

There is **no build step, no package.json, no test framework, no linter**. Files are served as-is. Edit, save, refresh.

## Local Development

Serve the `public/` directory with any static server, then visit `http://localhost:<port>/`. The SPA needs a fallback to `index.html` for unknown paths (handled in production by [public/_redirects](public/_redirects)). Examples:

```powershell
npx serve public -s          # -s = SPA mode, fallback to index.html
# or
python -m http.server 8000 --directory public   # no SPA fallback, deep links 404
```

For Cloudflare Pages parity (Functions + redirects), use Wrangler:

```powershell
npx wrangler pages dev public
```

Deploy: push to the configured Cloudflare Pages branch — Cloudflare builds from `public/`.

## Architecture

### Single-page app, no framework

[public/index.html](public/index.html) is the **only** HTML document the browser ever loads. It contains the persistent shell — `<header>` nav, mobile overlay menu, `<main id="app">` outlet, footer, FAB, mobile sticky CTA, lightbox — and link/script tags for **every** page's CSS and JS. Page-specific HTML fragments live in [public/pages/](public/pages/) and are injected into `#app` by the router.

Because every CSS file and every JS file is loaded up-front on first page load, **CSS rules must be namespaced per page** (e.g. `.contact-card`, `.shop-card__badge`) to avoid collisions, and each page script must export exactly one global `window.init<PageName>` function rather than running on `DOMContentLoaded`.

### Router — [public/js/router.js](public/js/router.js)

Hand-rolled History-API router. The `ROUTES` object at the top maps a URL path to:

- `page` — fragment URL under `/pages/`
- `title`, `description`, `canonical` — written into `<head>` via `updateMeta()`
- `type` — string key used to dispatch the matching `window.init<Type>()` (see the long `if/else if` chain in `navigate()`)
- `sticky` — `{ cta, sub, href }` if a mobile sticky CTA should appear (product pages only)
- `schema` — optional JSON-LD object injected as `<script id="page-schema">`

Navigation flow inside `navigate(path, pushState)`:

1. Resolve route (with trailing-slash tolerance, fallback to `/`).
2. `updateMeta()` — title / description / canonical / JSON-LD.
3. Toggle the fixed background hero `#ambernord-subpage-hero-bg` (visible on subpages, hidden on landing/product/thank-you).
4. `killGSAP()` — `ScrollTrigger.getAll().forEach(t => t.kill())` to prevent leaks across navigations.
5. Fetch fragment (cached in-memory in `pageCache`), inject into `#app`, fade in.
6. `attachLinkListeners()` — binds new `[data-link]` elements (idempotent via `dataset.routerBound`).
7. `updateMobileSticky(route)` — wires the bottom CTA to the route's Stripe URL on product pages.
8. Dispatch `window.init<Type>()` for the page's JS.

**Adding a new page** requires four coordinated edits:

1. Add the HTML fragment in [public/pages/](public/pages/).
2. Add a route entry in `ROUTES` in [public/js/router.js](public/js/router.js).
3. Add an `else if` branch in `navigate()` that calls the new `window.init...()`.
4. Add `<link>` to the CSS and `<script>` to the JS in [public/index.html](public/index.html) (load order matters: `ui.js` and `router.js` first, then page scripts, then `i18n.js` is referenced via `window.loadI18n`).

### Page scripts pattern — [public/js/](public/js/)

Each page has a single global init function attached to `window` (e.g. `window.initContact`, `window.initShop`, `window.initLanding`). Convention inside each init:

1. `const lang = window.getLang(); const data = await window.loadI18n(lang, '<page>');` — populates `data-i18n*` attributes from `/data/<lang>/<page>.json`.
2. Bind page-local listeners (forms, gallery, accordions).
3. Set up `IntersectionObserver` for scroll-reveal — typical pattern: add `.page-reveal` class with staggered `transitionDelay`, then toggle `.is-visible` on intersect, then `unobserve`.
4. Page-specific feature work (Stripe URL, Web3Forms submit, GSAP timelines on landing).

`product.js` is **shared** across `/the-starter/`, `/the-habit/`, `/the-protocol/` — those three fragments share the same gallery markup; the router dispatches `initProduct` for any route with `type: 'product'`.

`landing.js` is the heaviest — it uses GSAP + ScrollTrigger for the hero scale-down, floating cards, exclusive-section background fade, scroll reveals, YouTube facade, and lightbox. It guards on `prefers-reduced-motion` and uses `gsap.matchMedia()` for `(min-width: 992px)` vs `(max-width: 991px)` variants. GSAP is loaded from cdnjs in [public/index.html](public/index.html) before page scripts.

### UI engine — [public/js/ui.js](public/js/ui.js)

Loaded once on initial page load. Owns:

- Mobile menu open/close (hamburger ↔ X), exposes `window.closeMobileMenu` so the router can close it on navigation.
- Desktop dropdown ARIA toggling.
- **Deferred analytics** — GA4 (`G-VRDSSTW4HR`) and TikTok Pixel (`D75TCVJC77UD6SV8PER0`) only load after first user interaction (`scroll | mousemove | touchstart | click`) or 5s timeout, so they never block first paint.

### i18n — [public/js/i18n.js](public/js/i18n.js)

`window.loadI18n(lang, page)` fetches `/data/<lang>/<page>.json`, falls back to `de` on miss. Walks the DOM and writes:

- `[data-i18n="path.to.key"]` → `textContent`
- `[data-i18n-html="path.to.key"]` → `innerHTML` (used for keys containing `<br>`, `<span>`, etc.)
- `[data-i18n-attr="attr:path.to.key"]` → `el.setAttribute(attr, value)` (e.g. `href:card.email.href`)
- If JSON has a `meta` block, it overwrites `<title>`, description, robots, OG tags, and `<link rel="alternate" hreflang>`.

Language is held in `localStorage.lang` (default `de`). `window.setLang(lang)` reloads the page after switching.

Translations live in [public/data/](public/data/) split by locale: `de`, `en`, `fr`, `it`. Note the home/about/faq/dossier/ritual pages currently have **no JSON files** — their copy is hardcoded German in the HTML fragments. Only pages that call `loadI18n` (b2b, shop, contact, bestellstatus, thankyou, datenschutz, returns, the-master-box) are translated. The IT folder has a typo — `elisier.json` instead of `elixier.json`; the EN/FR have `elixier.json`. The DE folder is missing both `elixier.json` and `landing.json`.

### Forms (no backend yet)

- **Contact form** posts to **Web3Forms** (`https://api.web3forms.com/submit`). The access key is injected at runtime by [public/js/contact.js](public/js/contact.js) via hidden inputs prepended to the form (so it doesn't sit as a static attribute in the HTML fragment).
- **Bestellstatus** form is purely client-side — it just reveals a fallback message panel.
- The Cloudflare Functions stubs (`functions/api/checkout.js`, `contact.js`, `health.js`) are empty — they are **not** wired to anything currently.
- Stripe checkout uses **direct Stripe Payment Links** stored in `route.sticky.href` and inside product HTML fragments (`https://buy.stripe.com/...`). There is no server-side checkout flow.

### Design tokens — [public/css/main.css](public/css/main.css)

All design tokens are CSS custom properties on `:root`:

- **Colors:** `--color-bg #0a0a0a`, `--color-surface #111`, `--color-gold #EDA323` (brand accent), `--color-gold-hover`, `--color-text #fff`, `--color-text-muted`, `--color-text-dim`. Golds with alpha exist as `--color-gold-dim`, `--color-gold-dimmer`, `--color-border-gold`.
- **Fonts:** `--font-serif: 'Playfair Display'` (h1–h6, italic spans for emphasis), `--font-sans: 'Montserrat'` (body, buttons, nav).
- **Spacing scale:** `--space-xs/sm/md/lg/xl/2xl` = 8/16/24/40/80/120 px.
- **Layout:** `--container-max 1400px`, `--container-pad 20px`, `--nav-height 80px`.
- **Z-layers (use these, don't hardcode):** `--z-base 1`, `--z-above 10`, `--z-sticky 100`, `--z-nav 1000`, `--z-overlay 2000`, `--z-fab 3000`, `--z-modal 9000`.
- **Easings:** `--ease-smooth`, `--ease-out`. **Durations:** `--t-fast 0.2s`, `--t-base 0.4s`, `--t-slow 0.6s`.

`html` and `body` use `overflow-x: clip` (not `hidden`) — this is intentional, because `hidden` creates a new scroll container that breaks `position: sticky`. Don't change this.

Global components: `.ambernord-btn` (outlined gold), `.ambernord-btn-solid` (filled gold CTA), `.ambernord-topbar`, `.ambernord-dropdown`, `.ambernord-footer`, `.ambernord-fab`, `.ambernord-mobile-sticky`, `.lightbox-overlay`. The site uses a fixed full-width subpage background hero (`#ambernord-subpage-hero-bg`) toggled by the router.

`@media (prefers-reduced-motion: reduce)` neutralizes animations globally; landing.js also early-returns from GSAP setup when reduced motion is set.

Mobile breakpoint is `991px` — desktop nav hides, hamburger appears, mobile sticky CTA enables.

## Routes

| Path | Type | Notes |
|---|---|---|
| `/` | `landing` | Heavy GSAP timeline; no i18n |
| `/ueber-uns/` | `about` | German only |
| `/ritual-wirkung/` | (alias to ritual?) | Linked in nav but not in `ROUTES` — falls through to `/` |
| `/the-starter/` `/the-habit/` `/the-protocol/` | `product` | Share `initProduct`; each has its own Stripe Payment Link |
| `/elixier/` | (linked in nav, not in `ROUTES`) | Falls through |
| `/dossier/` `/ritual/` `/faq/` | `dossier` / `ritual` / `faq` | German only |
| `/b2b/` `/shop/` `/the-master-box/` | `b2b` / `shop` / `the-master-box` | i18n via JSON |
| `/kontakt/` | `contact` | Web3Forms submit; supports `?inquiry=b2b` autofill |
| `/bestellstatus/` | `bestellstatus` | Client-only fallback panel |
| `/danke/` | `thankyou` | Stripe redirect target |
| `/datenschutz/` `/rueckgabe/` | `datenschutz` / `returns` | i18n via JSON |
| `/impressum/` `/agb/` `/widerruf/` | (linked in footer, not in `ROUTES`) | Fall through |

When the user clicks a footer/nav link to a route not in `ROUTES`, `navigate()` falls back to `ROUTES['/']` (the landing page) — that may or may not be intended; treat it as a known gap rather than a bug to silently fix.

## Security headers — [public/_headers](public/_headers)

CSP allows scripts from `cdnjs.cloudflare.com` (GSAP) and `js.stripe.com`; styles from `fonts.googleapis.com`; images from `res.cloudinary.com` (all product/lifestyle imagery is on Cloudinary `dt6ksxuqf`); connect to `api.stripe.com` and `api.web3forms.com`. `frame-ancestors 'none'`. **Update CSP if you add new third-party origins** — the `unsafe-inline` for scripts is currently required because page scripts inject inline JSON-LD.

## Conventions worth following

- **Don't introduce a build step or framework** unless explicitly asked — the no-tooling architecture is the chosen design.
- **New pages need all four touchpoints** updated (fragment, route, dispatch branch, index.html link/script tags) or the page will silently 404 to the landing fallback.
- **CSS scoping is by hand** — prefix every selector with the page name. There is no CSS Modules, no Tailwind, no scoping mechanism.
- **GSAP cleanup is mandatory** — any new ScrollTrigger you create must be killed by `killGSAP()` in `router.js` (it already kills all triggers; just don't store references that survive navigation).
- **Use the design tokens**, not hardcoded hex/px values, when adding styles.
- The HTML/CSS is **mostly written in German**; comments in JS are mixed German/English. Keep that consistent within a file.
