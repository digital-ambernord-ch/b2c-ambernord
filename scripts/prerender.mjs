/* ==========================================================================
   AmberNord prerender — emits dist/{locale?}/{route}/index.html for every
   route × locale so crawlers receive real HTML (localized title, meta,
   self-referencing canonical, og:*, hreflang cluster, JSON-LD) plus the page
   fragment already injected into <main id="app">. The SPA router hydrates
   over the prerendered fragment on load, so behaviour in the browser is
   unchanged. The repo stays runnable WITHOUT this build for local dev —
   this script only assembles what is already in /public.

   Usage: npm run build   (output: dist/)
   ========================================================================== */

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT   = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const DIST   = join(ROOT, 'dist');
const ORIGIN = 'https://ambernord.ch';

const LOCALES = [
  { code: 'de', prefix: '',    hreflang: 'de-CH', og: 'de_CH' },
  { code: 'en', prefix: '/en', hreflang: 'en',    og: 'en' },
  { code: 'fr', prefix: '/fr', hreflang: 'fr-CH', og: 'fr_CH' },
  { code: 'it', prefix: '/it', hreflang: 'it-CH', og: 'it_CH' }
];

/* Route table — mirrors ROUTES in public/js/router.js (path → fragment +
   data slug + page type). `noindex` pages are prerendered but excluded from
   the sitemap. `product` carries the Product JSON-LD payload. */
const ROUTES = [
  { path: '/',                    page: 'home.html',                 slug: 'home',                  type: 'landing' },
  { path: '/story/',              page: 'about.html',                slug: 'about',                 type: 'about' },
  { path: '/wissenschaft/',       page: 'dossier.html',              slug: 'dossier',               type: 'dossier' },
  { path: '/ritual/',             page: 'ritual.html',               slug: 'ritual',                type: 'ritual' },
  { path: '/shop/',               page: 'shop.html',                 slug: 'shop',                  type: 'shop' },
  { path: '/shop/starter/',       page: 'the-starter.html',          slug: 'the-starter',           type: 'product',
    product: { name: 'The Starter (1× 250 ml)', price: '24.90',
      image: 'https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1774798945/ambernord-bio-sanddornsaft-zelt-edition-250ml-schweiz.webp_f3eaz0.png' } },
  { path: '/shop/habit/',         page: 'the-habit.html',            slug: 'the-habit',             type: 'product',
    product: { name: 'The Habit (3× 250 ml)', price: '69.00',
      image: 'https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1774798926/ambernord-sanddornsaft-kur-3er-pack-longevity-biohacking.webp_cg74qe.png' } },
  { path: '/shop/protocol/',      page: 'the-protocol.html',         slug: 'the-protocol',          type: 'product',
    product: { name: 'The Protocol (6× 250 ml)', price: '129.00',
      image: 'https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1774798936/ambernord-sanddorn-elixier-6er-vorratspack-premium-qualit%C3%A4t.webp_v9c6bd.png' } },
  { path: '/shop/master-box/',    page: 'the-master-box.html',       slug: 'the-master-box',        type: 'product',
    product: { name: 'The Master Box (20× 250 ml)', price: '370.00',
      image: 'https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto,w_800/v1781632763/AmberNord_the_masterbox_20x250ml_ritual_kig85d.jpg' } },
  { path: '/hilfe/faq/',          page: 'faq.html',                  slug: 'faq',                   type: 'faq' },
  { path: '/hilfe/kontakt/',      page: 'contact.html',              slug: 'contact',               type: 'contact' },
  { path: '/hilfe/bestellstatus/',page: 'bestellstatus.html',        slug: 'bestellstatus',         type: 'bestellstatus' },
  { path: '/hilfe/rueckgabe/',    page: 'returns.html',              slug: 'returns',               type: 'returns' },
  { path: '/datenschutz/',        page: 'datenschutz.html',          slug: 'datenschutz',           type: 'datenschutz' },
  { path: '/agb/',                page: 'agb.html',                  slug: 'agb',                   type: 'agb' },
  { path: '/b2b/',                page: 'b2b.html',                  slug: 'b2b',                   type: 'b2b' },
  { path: '/danke/',              page: 'thankyou.html',             slug: 'thankyou',              type: 'thankyou',          noindex: true },
  { path: '/bewertungen/',        page: 'bewertungen.html',          slug: 'bewertungen',           type: 'bewertungen' },
  { path: '/impressum/',          page: 'impressum.html',            slug: 'impressum',             type: 'impressum',         optional: true },
  { path: '/2-fuer-1/',           page: 'aktion-2-fuer-1.html',      slug: 'aktion-2-fuer-1',       type: 'aktion2fuer1' },
  { path: '/2-fuer-1/danke/',     page: 'aktion-2-fuer-1-danke.html',slug: 'aktion-2-fuer-1-danke', type: 'aktion2fuer1Danke', noindex: true }
];

/* OG / Twitter share image per route — MIRRORS OG_IMAGES in
   public/js/router.js. Keyed by locale-less canonical path; the PDPs and the
   2-für-1 campaign get their own product shot, everything else falls back to
   the brand ritual image. All variants are c_fill 1200×630 to match the static
   og:image:width / og:image:height tags in index.html. */
const OG_IMAGE_FALLBACK = 'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774812498/ambernord-zelt-taegliches-ritual-sanddorn-konzentrat-morgenroutine.webp_tnwv2r.jpg';
const OG_IMAGES = {
  '/shop/starter/':  'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774514853/ambernord-sanddornsaft-einzel-250ml_c0vwjx.jpg',
  '/shop/habit/':    'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774514833/ambernord-sanddornsaft-3er-pack-250ml_em8h2n.jpg',
  '/shop/protocol/': 'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1774514800/ambernord-sanddornsaft-6er-pack-250ml_ofvtkj.jpg',
  '/2-fuer-1/':      'https://res.cloudinary.com/dt6ksxuqf/image/upload/c_fill,w_1200,h_630,f_auto,q_auto/v1778164908/Markteinf%C3%BChrungs-Aktion_2_The_Starter_zum_Preis_von_1_Im_Gegenzug_bitten_wir_nach_14_Tagen_um_eine_ehrliche_Bewertung_pbompq.jpg'
};

const ogImageForRoute = (routePath) => OG_IMAGES[routePath] || OG_IMAGE_FALLBACK;

/* ----------------------------------------------------------------------- */

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s) { return escapeHtml(s); }

function stripTags(s) {
  return String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function pageData(locale, slug) {
  return readJson(join(PUBLIC, 'data', locale, `${slug}.json`)) ||
         readJson(join(PUBLIC, 'data', 'de', `${slug}.json`)) || {};
}

function buildSchema(route, locale, data, canonical) {
  if (route.type === 'landing') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AmberNord',
      url: ORIGIN + '/',
      logo: 'https://res.cloudinary.com/dt6ksxuqf/image/upload/f_auto,q_auto:best,h_160/v1776015174/bio-sanddorn-elixier-schweiz-ambernord-ritual-with-Zelt-premium-edition_k5pn3w.png',
      founder: { '@type': 'Person', name: 'Eriks Matisons', jobTitle: 'Gründer' },
      address: { '@type': 'PostalAddress', addressLocality: 'Aarau', addressCountry: 'CH' },
      sameAs: [
        'https://www.facebook.com/ambernord.ch/',
        'https://www.instagram.com/ambernord.ch/',
        'https://www.tiktok.com/@ambernord.ch',
        'https://www.youtube.com/@ambernord'
      ]
    };
  }

  if (route.type === 'product' && route.product) {
    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: route.product.name,
      image: [route.product.image],
      description: (data.meta && data.meta.description) || '',
      brand: { '@type': 'Brand', name: 'AmberNord' },
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: 'CHF',
        price: route.product.price,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition'
      }
    };
  }

  if (route.type === 'faq' && Array.isArray(data.categories)) {
    const questions = data.categories.flatMap((cat) =>
      (cat.items || []).map((item) => ({
        '@type': 'Question',
        name: stripTags(item.q),
        acceptedAnswer: { '@type': 'Answer', text: stripTags(item.a) }
      })));
    return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions };
  }

  return null;
}

function hreflangCluster(routePath) {
  const lines = LOCALES.map((l) =>
    `  <link rel="alternate" hreflang="${l.hreflang}" href="${ORIGIN}${l.prefix}${routePath}">`);
  lines.push(`  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${routePath}">`);
  return lines.join('\n');
}

function setMetaContent(html, selectorRe, replacement) {
  return html.replace(selectorRe, replacement);
}

/* Prefix every internal data-link href with the locale segment so the
   prerendered HTML is crawlable per locale even without JS. */
function localizeLinks(html, prefix) {
  if (!prefix) return html;
  return html.replace(/<a\b[^>]*\bdata-link\b[^>]*>/g, (tag) =>
    tag.replace(/href="(\/(?!en\/|fr\/|it\/)[^"]*)"/, (m, href) => `href="${prefix}${href === '/' ? '/' : href}"`));
}

function renderPage(shell, route, localeDef) {
  const locale    = localeDef.code;
  const data      = pageData(locale, route.slug);
  const deData    = pageData('de', route.slug);
  const meta      = data.meta || deData.meta || {};
  const canonical = ORIGIN + localeDef.prefix + route.path;

  const fragment = readFileSync(join(PUBLIC, 'pages', route.page), 'utf8');

  const title       = meta.title || 'AmberNord';
  const description = meta.description || '';
  const ogMeta      = meta.og || {};
  const ogImage     = ogImageForRoute(route.path);
  const robots      = route.noindex ? 'noindex, nofollow' : (meta.robots || 'index, follow');

  let html = shell;

  html = html.replace(/<html lang="de">/, `<html lang="${locale}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = setMetaContent(html, /(<meta name="description" content=")[^"]*(">)/, `$1${escapeAttr(description)}$2`);
  html = setMetaContent(html, /(<meta name="robots" content=")[^"]*(">)/, `$1${robots}$2`);
  html = setMetaContent(html, /(<link rel="canonical" href=")[^"]*(" id="canonical-tag">)/, `$1${canonical}$2`);
  html = setMetaContent(html, /(<meta property="og:title" content=")[^"]*(">)/, `$1${escapeAttr(ogMeta.title || title)}$2`);
  html = setMetaContent(html, /(<meta property="og:description" content=")[^"]*(">)/, `$1${escapeAttr(ogMeta.description || description)}$2`);
  html = setMetaContent(html, /(<meta property="og:url" content=")[^"]*(">)/, `$1${canonical}$2`);
  html = setMetaContent(html, /(<meta property="og:locale" content=")[^"]*(">)/, `$1${localeDef.og}$2`);
  /* Route-based share image — og:image + twitter:image. og:image:width/height
     stay 1200×630 (static in the shell) since every image is c_fill 1200×630. */
  html = setMetaContent(html, /(<meta property="og:image" content=")[^"]*(">)/, `$1${escapeAttr(ogImage)}$2`);
  html = setMetaContent(html, /(<meta name="twitter:image" content=")[^"]*(">)/, `$1${escapeAttr(ogImage)}$2`);

  /* hreflang cluster + page schema land right before </head>. */
  let headExtra = '\n' + hreflangCluster(route.path) + '\n';
  const schema = buildSchema(route, locale, data, canonical);
  if (schema) {
    headExtra += `  <script type="application/ld+json" id="page-schema">${JSON.stringify(schema)}</script>\n`;
  }
  html = html.replace('</head>', headExtra + '</head>');

  /* Inject the fragment — the router re-renders (hydrates) over it on load. */
  html = html.replace(/<main id="app" role="main">[\s\S]*?<\/main>/,
    `<main id="app" role="main">\n${fragment}\n</main>`);

  html = localizeLinks(html, localeDef.prefix);

  return html;
}

function buildSitemap() {
  const entries = [];
  for (const route of ROUTES) {
    if (route.noindex) continue;
    if (route.optional && !existsSync(join(PUBLIC, 'pages', route.page))) continue;
    for (const l of LOCALES) {
      const loc = ORIGIN + l.prefix + route.path;
      const alternates = LOCALES.map((a) =>
        `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${ORIGIN}${a.prefix}${route.path}"/>`)
        .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${route.path}"/>`)
        .join('\n');
      entries.push(`  <url>\n    <loc>${loc}</loc>\n${alternates}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join('\n') + '\n</urlset>\n';
}

/* ----------------------------------------------------------------------- */

rmSync(DIST, { recursive: true, force: true });
cpSync(PUBLIC, DIST, { recursive: true });

/* Minify CSS in dist/ only — the source files keep their comments and
   whitespace for maintainability, while the production transfer is shrunk
   here. csso strips comments, collapses whitespace and restructures rules
   (landing.css drops ~58% after brotli), which directly shortens the
   render-blocking CSS download. Per-build fallback: if csso is unavailable
   the verbatim copy from cpSync stays in place, so the build never breaks. */
try {
  const { minify } = await import('csso');
  const cssDir = join(DIST, 'css');
  let before = 0, after = 0;
  for (const file of readdirSync(cssDir)) {
    if (!file.endsWith('.css')) continue;
    const p = join(cssDir, file);
    const src = readFileSync(p, 'utf8');
    const out = minify(src).css;
    before += src.length;
    after += out.length;
    writeFileSync(p, out);
  }
  console.log(`Minified CSS: ${(before / 1024).toFixed(0)}K -> ${(after / 1024).toFixed(0)}K raw.`);
} catch (err) {
  console.warn('CSS minify skipped (csso unavailable):', err.message);
}

const shell = readFileSync(join(PUBLIC, 'index.html'), 'utf8');
let pageCount = 0;

for (const route of ROUTES) {
  if (route.optional && !existsSync(join(PUBLIC, 'pages', route.page))) continue;
  for (const localeDef of LOCALES) {
    const outDir = join(DIST, ...(localeDef.prefix ? [localeDef.code] : []), ...route.path.split('/').filter(Boolean));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), renderPage(shell, route, localeDef));
    pageCount++;
  }
}

writeFileSync(join(DIST, 'sitemap.xml'), buildSitemap());
writeFileSync(join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /pages/\nDisallow: /data/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

console.log(`Prerendered ${pageCount} pages into dist/ (+ sitemap.xml, robots.txt).`);
