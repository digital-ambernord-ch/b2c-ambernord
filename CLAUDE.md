## Project

AmberNord B2C — static dependency-free SPA for a Swiss biohacking brand selling cold-pressed sea-buckthorn (Sanddorn) elixirs. Deployed on **Cloudflare Pages** from `public/`. **No build step, no package.json, no tests, no linter.** Edit, save, refresh.

`functions/` (`_middleware.js`, `api/checkout.js`, `api/contact.js`, `api/health.js`) and `wrangler.toml` are empty placeholders — not wired to anything.

## Local dev

- `npx serve public -s` (SPA mode, fallback to index.html)
- `npx wrangler pages dev public` (Cloudflare parity)
- Deploy: push to configured Pages branch.

## Architecture

### Single-page shell
[public/index.html](public/index.html) is the **only** HTML the browser loads. Persistent shell: header nav, mobile overlay menu, `<main id="app">` outlet, footer, FAB, mobile sticky CTA, lightbox, cookie banner/modal. **All** page CSS and JS load up-front.

Consequences:
- **CSS must be hand-namespaced per page** (e.g. `.contact-card`, `.shop-card__badge`) — no scoping mechanism.
- Each page script exports exactly one `window.init<PageName>` function (do not run on `DOMContentLoaded`).

### Router — [public/js/router.js](public/js/router.js)
Hand-rolled History-API router. Three top-level objects:

- `REDIRECTS` — old paths → new paths (preserves SEO/inbound links). E.g. `/ueber-uns/` → `/story/`, `/dossier/` → `/wissenschaft/`, `/the-starter/` → `/shop/starter/`, `/kontakt/` → `/hilfe/kontakt/`, `/elixier/` → `/shop/`, `/ritual-wirkung/` → `/ritual/`.
- `ROUTES` — canonical path → `{ page, title, description, canonical, type, sticky, schema }`.
- `INITS` — `route.type` → `window.init<Name>` lookup table (replaced the old if/else chain — single source of truth).

`navigate(path, pushState)` flow: resolve → `updateMeta()` → toggle `#ambernord-subpage-hero-bg` → `killGSAP()` (kills all `ScrollTrigger` instances) → fetch fragment (cached in `pageCache`) → inject into `#app` → fade in → `attachLinkListeners()` (idempotent via `dataset.routerBound`) → `updateMobileSticky()` → dispatch via `INITS[route.type]`.

Unknown paths fall back to `ROUTES['/']` (landing). Treat unmapped footer/nav links as known gaps, not bugs.

**Adding a new page** requires four coordinated edits — miss one and the page silently 404s to landing:
1. Fragment in [public/pages/](public/pages/).
2. Entry in `ROUTES` ([public/js/router.js](public/js/router.js)).
3. Entry in `INITS` mapping the new `type` to its `window.init...`.
4. `<link>` to CSS and `<script>` to JS in [public/index.html](public/index.html). Load order matters: GSAP CDN, then `i18n.js`, `cookie-consent.js`, `ui.js`, `router.js`, then page scripts.

### Page scripts — [public/js/](public/js/)
One file per page (`landing.js`, `about.js`, `dossier.js`, `ritual.js`, `b2b.js`, `shop.js`, `the-master-box.js`, `contact.js`, `bestellstatus.js`, `thankyou.js`, `datenschutz.js`, `returns.js`, `faq.js`).

Convention inside each `init`: load i18n → bind listeners → set up `IntersectionObserver` for `.page-reveal` / `.is-visible` scroll reveal → page-specific work.

`product.js` is **shared** by `/shop/starter/`, `/shop/habit/`, `/shop/protocol/` (all dispatch `initProduct` via `type: 'product'`).

`landing.js` is heaviest — GSAP + ScrollTrigger for hero scale, floating cards, exclusive-section background fade, scroll reveals, YouTube facade, lightbox. Guards on `prefers-reduced-motion`, uses `gsap.matchMedia()` for `(min-width: 992px)` vs `(max-width: 991px)`.

### UI engine — [public/js/ui.js](public/js/ui.js)
Loaded once. Owns mobile menu (exposes `window.closeMobileMenu`), desktop dropdown ARIA, language switch.

**Note:** Analytics (GA4 `G-VRDSSTW4HR`, TikTok Pixel `D75TCVJC77UD6SV8PER0`) are now **gated by cookie consent**, not deferred-on-interaction. See cookie module below.

### Cookie consent — [public/js/cookie-consent.js](public/js/cookie-consent.js) + [public/css/cookie-consent.css](public/css/cookie-consent.css)
First-party `cookie_consent` cookie (categories: `necessary`, `analytics`, `marketing`). Activates `<script type="text/plain" data-cookie-category="…">` placeholders only after grant. Public API on `window.cookieConsent`. Withdrawal sweeps documented vendor cookies in `VENDOR_COOKIES`. Bump `CONSENT_VERSION` whenever disclosure changes.

**See [COOKIE-CONSENT.md](COOKIE-CONSENT.md) for full operator guide** (adding vendors, CSP, testing checklist). Read this before adding any third-party tag.

### Aktion bar — [public/js/aktion-bar.js](public/js/aktion-bar.js) + [public/css/aktion-bar.css](public/css/aktion-bar.css)
Top announcement bar above the nav, copy in `common.json` `aktion.*`. The `html.aktion-active` class is set **synchronously** by an inline script in [public/index.html](public/index.html) `<head>` (avoids layout shift). When active, body gets `padding-top: 36px`, topbar drops to `top: 36px`, subpage hero drops to `top: 118px` — these overrides live in `aktion-bar.css`. Dismiss writes `localStorage.amber_aktion_dismissed_<version>` (one year). **Bump `AKTION_VERSION` in both [aktion-bar.js](public/js/aktion-bar.js) AND the inline script in [index.html](public/index.html)** when the message changes — this re-shows the bar to all visitors.

### i18n — [public/js/i18n.js](public/js/i18n.js)
`window.loadI18n(lang, page)` fetches `/data/<lang>/<page>.json`, falls back to `de` on miss. Walks DOM and writes:
- `[data-i18n="key.path"]` → `textContent`
- `[data-i18n-html="…"]` → `innerHTML` (for content with inline tags)
- `[data-i18n-attr="attr:key.path"]` → `setAttribute`
- Optional `meta` block overwrites title/description/robots/OG/hreflang.

Language: `localStorage.lang` (default `de`). `window.setLang(lang)` reloads the page.

Translations in [public/data/](public/data/): `DE/`, `en/`, `fr/`, `it/` (17 page JSONs each + `common.json`).

**Locale gotchas — verify before relying on i18n:**
- DE folder is **uppercase** (`/data/DE/`) but default `lang = 'de'` (lowercase) — works on Windows/macOS (case-insensitive FS) but **breaks on case-sensitive hosts** including some Cloudflare edge behavior. Either rename folder to `de/` or switch default to `'DE'`.
- `it/elisier.json` is a typo — should be `elixier.json` (en/fr have the correct name). Currently no page calls `loadI18n('it', 'elixier')` so it's latent.
- Stray `data/b2b.json` and `data/ritual.json` exist at the data root, outside any locale folder — likely orphans; not loaded by anything.

### Forms (no backend yet)
- **Contact** posts to **Web3Forms** (`api.web3forms.com/submit`). Access key injected at runtime by `contact.js` via hidden inputs (not in static HTML).
- **Bestellstatus** is purely client-side fallback panel.
- **Stripe**: direct **Payment Links** (`buy.stripe.com/...`) stored in `route.sticky.href` and product fragments. No server checkout.

### Design tokens — [public/css/main.css](public/css/main.css) `:root`
- **Colors:** `--color-bg #0a0a0a`, `--color-surface #111`, `--color-gold #EDA323`, `--color-gold-hover`, `--color-text #fff`, `--color-text-muted`, `--color-text-dim`, `--color-gold-dim`, `--color-gold-dimmer`, `--color-border-gold`.
- **Fonts:** `--font-serif: 'Playfair Display'` (headings, italic emphasis), `--font-sans: 'Montserrat'` (body, UI).
- **Spacing:** `--space-xs/sm/md/lg/xl/2xl` = 8/16/24/40/80/120 px.
- **Layout:** `--container-max 1400px`, `--container-pad 20px`, `--nav-height 80px`.
- **Z-layers (use these, don't hardcode):** `--z-base 1`, `--z-above 10`, `--z-sticky 100`, `--z-nav 1000`, `--z-overlay 2000`, `--z-fab 3000`, `--z-modal 9000`.
- **Easings:** `--ease-smooth`, `--ease-out`. **Durations:** `--t-fast 0.2s`, `--t-base 0.4s`, `--t-slow 0.6s`.

`html` and `body` use `overflow-x: clip` (NOT `hidden`) — intentional. `hidden` creates a scroll container that breaks `position: sticky`. **Do not change.**

Global components: `.ambernord-btn` (outlined gold), `.ambernord-btn-solid` (filled CTA), `.ambernord-topbar`, `.ambernord-dropdown`, `.ambernord-footer`, `.ambernord-fab`, `.ambernord-mobile-sticky`, `.lightbox-overlay`, fixed `#ambernord-subpage-hero-bg` (router toggles visibility).

`@media (prefers-reduced-motion: reduce)` neutralizes animations globally; `landing.js` early-returns from GSAP setup.

Mobile breakpoint: `991px`.

## Routes (current canonical paths)

| Path | Type | Notes |
|---|---|---|
| `/` | `landing` | Heavy GSAP timeline; no i18n call |
| `/story/` | `about` | Old `/ueber-uns/` redirects here |
| `/wissenschaft/` | `dossier` | Old `/dossier/` redirects here |
| `/ritual/` | `ritual` | Old `/ritual-wirkung/` redirects here |
| `/shop/` | `shop` | Old `/elixier/` redirects here |
| `/shop/starter/` `/shop/habit/` `/shop/protocol/` | `product` | Share `initProduct`; each has Stripe Payment Link in `route.sticky.href` and JSON-LD `Product` schema |
| `/shop/master-box/` | `the-master-box` | Old `/the-master-box/` redirects here |
| `/hilfe/faq/` | `faq` | Old `/faq/` redirects |
| `/hilfe/kontakt/` | `contact` | Web3Forms; `?inquiry=b2b` autofill |
| `/hilfe/bestellstatus/` | `bestellstatus` | Client-only |
| `/hilfe/rueckgabe/` | `returns` | |
| `/datenschutz/` | `datenschutz` | |
| `/b2b/` | `b2b` | |
| `/danke/` | `thankyou` | Stripe success redirect |
| `/bewertungen/` | `bewertungen` | Customer reviews list + submission form (Web3Forms). Renders from `public/data/reviews.json` (manually curated) |

Footer-linked but unmapped (fall through to `/`): `/impressum/`, `/agb/`, `/widerruf/`.

## Security headers — [public/_headers](public/_headers)

CSP allows: `cdnjs.cloudflare.com` (GSAP), `js.stripe.com`, GA, TikTok in `script-src`; `fonts.googleapis.com` styles; `res.cloudinary.com` (account `dt6ksxuqf` — all imagery), GA, TikTok in `img-src`; `api.stripe.com`, `api.web3forms.com`, GA, TikTok in `connect-src`; `youtube-nocookie.com` + `youtube.com` in `frame-src`. `frame-ancestors 'none'`. `'unsafe-inline'` in script-src is required because router injects inline JSON-LD.

**Update CSP first** when adding any new third-party origin.

`/pages/*` and `/data/*` cached 5 min; `/*.css` and `/*.js` cached 1 day.

## Conventions

- **No build step / no framework** — chosen architecture; do not introduce.
- **All four touchpoints when adding a page** (fragment + ROUTES + INITS + index.html link/script).
- **Hand-namespace every CSS selector** by page name.
- **Kill GSAP on navigation** — `killGSAP()` already kills all ScrollTriggers; just don't store references that survive nav.
- **Use design tokens**, never hardcoded hex/px.
- HTML/CSS/copy is mostly **German**; JS comments mixed German/English — match the file.
- **Do not commit secrets** (Web3Forms key is currently injected at runtime, not stored).
- **Do not add anything under cookie "necessary"** without checking EDPB guidance.

## Status / known gaps

- `D CLAUDE.md` in git status — old CLAUDE.md was deleted; `CLAUDE_OLD.md` retained as reference (now superseded by this file).
- Untracked `public/data/DE/*.json` — recently added, not yet committed. Verify lowercase-`de` issue (above) before shipping.
- Cloudflare Functions stubs are empty.
- README.md is a one-line stub.
- Recent commit focus (per `git log`): cookie consent, bestellstatus typography fixes, landing flicker fix, language/gap polish.
