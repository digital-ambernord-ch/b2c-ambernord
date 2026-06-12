# MASTER PROMPT — AmberNord B2C: Audit-Fix Implementation

You are working in the AmberNord B2C repository (Vanilla JS SPA, Cloudflare Pages: `index.html` shell + `pages/*.html` fragments + `data/{de,en,fr,it}/*.json` i18n + `js/router.js`, `js/i18n.js`, CSS). Implement ALL phases below. Work on branch `audit-fixes`, one conventional commit per phase. Do not redesign the visual identity (dark Nordic premium stays). Do not touch B2B repos/pages.

**Important:** The old-string anchors below were transcribed from screen recordings — treat them as fuzzy anchors. Locate each by grepping a distinctive 3–5 word fragment across `data/de/` and `pages/`. If an anchor is not found, search close variants. NEVER skip an item silently — list unmatched items in the final report.

---

## PHASE 0 — Discovery + required input

1. Map the repo: routes in `router.js`, all page fragments, all i18n JSON files, how buy-button URLs (Stripe) are stored, where announcement bars / cookie banner / meta tags live. Print a short summary before editing.
2. **Ask the user for the following before Phase 1** (proceed with the stated fallback if no answer):
   - **Impressum data:** legal entity name, postal address, UID (CHE-…), contact e-mail. *Fallback:* build the page with `[[FIRMA]] [[ADRESSE]] [[UID]] [[EMAIL]]` placeholders and add a TODO.
   - **Bio control-body code** (e.g. CH-BIO-…, producer LT-EKO-001) for the trust bar. *Fallback:* omit the code, show only "Bio-zertifiziert".
   - **Vitamin C mg per 25 ml portion** (for the FAQ answer). *Fallback:* "ein Mehrfaches des Tagesbedarfs" without a number + TODO.
   - **Lab values for Vitamin A (beta-carotene) and Vitamin E** in the ready 1:10 drink. Sets flags `IF_A` / `IF_E`. *Fallback:* both FALSE → use the non-A/non-E variants below.
   - **Sugar analysis** of the ready 1:10 drink (<0.5 g/100 ml?). *Fallback:* FALSE → replace every "zuckerfrei" with "ohne Zuckerzusatz".
   - **YouTube video ID** for the Ritual section ("Das Elixier in Bewegung"). *Fallback:* remove the whole placeholder section.
   - **Stripe subscription Payment Links / price IDs** for The Habit abo (63.00 CHF/Mt.) and The Protocol abo (119.00 CHF/Mt.). The user confirmed subscriptions exist — these links are REQUIRED for the abo toggle. Also confirm where the current one-time payment links live.

---

## PHASE 1 — Legal copy rewrite (German = source of truth)

### Red-line rulebook (apply to EVERY string, including any instance not listed below)

FORBIDDEN for this food product, no exceptions: disease names or symptoms (Infektionen, Entzündungen, Trockene-Auge-Syndrom), risk reduction ("senkt das Risiko"), organ/cell repair ("Regeneration der Leberzellen", "regeneriert die Schleimhäute"), cholesterol or blood-vessel improvement ("Cholesterin-Profil optimieren", "Elastizität der Blutgefässe verbessern"), blue-light/eye-fatigue protection ("Schutz vor Blaulicht", "Augenermüdung"), microbiome/digestion effects ("Darmflora", "optimieren die Verdauung"), instant effects ("Sofort-Effekt", "ab dem 1. Schluck"), "nachweislich" attached to any non-authorized effect, serotonin/tryptophan mechanisms, "unzerstörbarer … Schild", "stärkt das Immunsystem" as a bare verb.

ALLOWED and to be used as the only effect language — the authorized claim cores, verbatim, never paraphrased:
- "Vitamin C trägt zu einer normalen Funktion des Immunsystems bei."
- "Vitamin C trägt zur Verringerung von Müdigkeit und Ermüdung bei."
- "Vitamin C trägt dazu bei, die Zellen vor oxidativem Stress zu schützen."
- "Vitamin C trägt zu einem normalen Energiestoffwechsel bei."
- "Vitamin C trägt zur normalen psychischen Funktion bei."
- "Vitamin C trägt zu einer normalen Kollagenbildung für eine normale Funktion der Haut / der Blutgefässe bei."
- IF_A: "Vitamin A trägt zur Erhaltung normaler Sehkraft / normaler Haut / normaler Schleimhäute bei."
- IF_E: "Vitamin E trägt dazu bei, die Zellen vor oxidativem Stress zu schützen."

Free zone (no restrictions): composition facts ("bis zu 42 % Omega-7", "190+ bioaktive Verbindungen", "18 von 22 Aminosäuren", "9× mehr Vitamin C als Zitrusfrüchte"), taste, ritual, origin, craft, Zero-Waste. The careful research language on the Wissenschaft page ("Studien deuten darauf hin…", "wird … untersucht") stays as is.

### Itemized replacements (DE)

**Ticker / announcement (index.html):**
- DELETE the review ticker ("Wirkung nach 14 Tagen spüren — Bewertung schenken…") entirely. Only ONE announcement bar remains: the 2-für-1 promo bar, dismissible, dismissal persisted in localStorage.

**Homepage hero:**
- Subheadline → single roman (non-italic) line: `Kaltgepresstes Bio-Sanddorn-Konzentrat · 190+ Bioaktivstoffe · 30 Sekunden am Tag.`
- Bullet "Spürbare Energie durch 190+ Bioaktivstoffe" → `Vitamin C trägt zur Verringerung von Müdigkeit und Ermüdung bei — Energie ohne Crash`
- Bullet "Omega-7 für Haut & Darm — eine der seltensten Quellen der Natur" → `Omega-7 — eine der seltensten Quellen der Natur, bis zu 42 % im Fruchtfleischöl`

**Homepage benefit card Omega-7:** remove "Ein wichtiger natürlicher Baustein für Haut und Schleimhäute." → body becomes: `Eine der seltensten pflanzlichen Quellen für Palmitoleinsäure (Omega-7) — bis zu 42 % im Fruchtfleischöl. Ein zentraler Baustein der Lipid-Matrix.` (The Immunsystem card already uses the correct Vitamin-C claim — keep.)

**Homepage 1:10 section**, sentence "Das Ergebnis: Tiefe Hydratation, spürbar weniger Müdigkeit und Zellschutz vor oxidativem Stress." → `Das Ergebnis: tiefe Hydratation — und Vitamin C, das zur Verringerung von Müdigkeit und zum Schutz der Zellen vor oxidativem Stress beiträgt.`

**Ritual page — the 9 cards ("Die Wissenschaft hinter dem Ritual"), replace bodies (and titles where noted):**
1. Zelluläre Energie & Vitalität → `Vitamin C trägt zu einem normalen Energiestoffwechsel und zur Verringerung von Müdigkeit und Ermüdung bei. Konstante Energie — ohne Spike, ohne Crash. Perfekt für anhaltende Performance im Alltag.`
2. Zelluläres Skin-Revival → `Vitamin C trägt zu einer normalen Kollagenbildung für eine normale Funktion der Haut bei — flankiert von Vitamin A, Vitamin E und der seltenen Omega-7-Fettsäure aus der ganzen Beere.`
3. Kognitive Klarheit & Fokus → `Vitamin C trägt zur normalen psychischen Funktion und zur Verringerung von Müdigkeit und Ermüdung bei — klarer Kopf statt Nachmittags-Tief.`
4. Title → `Immun-Resilienz`; body → `Hochdosiertes natürliches Vitamin C trägt zu einer normalen Funktion des Immunsystems bei — an jedem der 365 Tage.`
5. IF_A: title `Schleimhaut-Schutz`, body `Vitamin A trägt zur Erhaltung normaler Schleimhäute bei — Unterstützung von innen, Tag für Tag.` ELSE: title `Die ganze Beere`, body `Bioaktive Pflanzenstoffe und natürliche Ballaststoffe — kombiniert, wie die Natur sie angelegt hat. Nichts isoliert, nichts synthetisch.`
6. Aktive Zellprotektion → IF_E: `Vitamin C und Vitamin E tragen dazu bei, die Zellen vor oxidativem Stress zu schützen — Ihr täglicher Zellschutz im Ritual.` ELSE same sentence with Vitamin C only.
7. Title `Deep Detox & Leberfunktion` → `Zero-Waste-Reinheit`; body → `Ohne Zuckerzusatz, ohne künstliche Aromen, ohne synthetische Zusätze. Die ganze Beere — Öle aus Fruchtfleisch und Kern, kaltgepresst. 100 % Natur.`
8. Title `Kardiovaskuläre Langlebigkeit` → `Kollagen & Gefässe`; body → `Vitamin C trägt zu einer normalen Kollagenbildung für eine normale Funktion der Blutgefässe bei — die stille Basis jeder Longevity-Routine.`
9. Title `Der Digitale Schild` → IF_A: title `Sehkraft im Bildschirm-Alltag`, body `Vitamin A trägt zur Erhaltung normaler Sehkraft bei — natürliche Carotinoide und Vitamin-A-Bausteine aus der ganzen Beere.` ELSE: title `Carotinoid-Matrix`, body `Natürliche Carotinoide aus Fruchtfleisch und Schale — die goldene Farbpalette der ganzen Beere.` (Always keep 9 cards so the 3×3 grid stays intact.)

**Ritual Schritt 01 ("Die goldene Morgenregel")** — remove the "enorme Dosis / stark vitalisierender Effekt / Nachtruhe" mechanics → `Verankern Sie das Ritual in der ersten Tageshälfte — als fester Bestandteil Ihrer Morgenroutine, am besten vor dem Frühstück.`

**Story page:**
- Delete "… und den Schutz vor dem ‚Trockene-Auge-Syndrom' bei intensiver Bildschirmarbeit" — end that sentence at `…Rekordkonzentration von bis zu 42 % erreicht.`
- "Der «Goldene Bentley» der Natur" → `Die Königsklasse der Beeren`

**Product page The Protocol:** "Schützen Sie Ihre Augen vor blauem Licht und stärken Sie Ihre Immun-Resilienz auf dem höchsten natürlichen Niveau." → IF_A: `Vitamin A trägt zur Erhaltung normaler Sehkraft, Vitamin C zu einer normalen Funktion des Immunsystems bei — Ihr Fundament für 60 Tage.` ELSE: `Vitamin C trägt zu einer normalen Funktion des Immunsystems bei — Ihr Fundament für 60 Tage.`

**Product page The Habit:** "Verabschieden Sie sich von toxischen Energie-Löchern durch künstliche Energy-Drinks und synthetisches Taurin." → `Die natürliche Alternative zu künstlichen Energy-Drinks — ohne Zuckerzusatz, ohne synthetisches Taurin.`

**Shop overview cards:**
- Starter block "IHR SOFORT-EFFEKT" → heading `IHR EINSTIEG`, bullets: `Der erste Schluck: hell, sauer, lebendig — Sanddorn in Reinform.` / `Eine der seltenen Quellen aller 4 Omega-Fettsäuren (3, 6, 7 & 9).` / `10 Tage Ritual — exakt eine Flasche.`
- Habit "DIE TRANSFORMATION" bullets: "Messbarer Fokus ohne Nachmittags-Tief." → `Vitamin C trägt zur Verringerung von Müdigkeit bei — Schluss mit dem Nachmittags-Tief.` / "Flutet die Zellen mit seltenem Omega-7." → `Bis zu 42 % Omega-7 — eine der reichsten Quellen der Natur.` / "Schützt und regeneriert die Schleimhäute." → IF_A: `Vitamin A trägt zur Erhaltung normaler Schleimhäute bei.` ELSE: `Die volle Matrix der ganzen Beere — Öle aus Fruchtfleisch und Kern.` / keep "30 Tage kompromisslose Performance."
- Protocol: "…bauen Sie einen unzerstörbaren immunologischen Schild auf." → `Vitamin C trägt täglich zu einer normalen Funktion des Immunsystems bei — 60 Tage am Stück.` "MEISTER-LEVEL" bullets: "Lückenloser Zellschutz für Monate." → `Vitamin C trägt zum Schutz der Zellen vor oxidativem Stress bei — 60 Tage lückenlos.` / "Der natürliche Schild gegen Blaulicht." → IF_A: `Vitamin A trägt zur Erhaltung normaler Sehkraft bei.` ELSE: `Natürliche Carotinoide aus der ganzen Beere.`

**Copy minors (sweep all files):** "bis zu 3 Liter" → `über 2.5 Liter`; "bis zu 18 Liter" → `über 16 Liter`; every "zuckerfrei" → `ohne Zuckerzusatz` (unless sugar flag TRUE); every "Plätze" → `Sets`; "Kunden bewertungen." → `Kundenstimmen.`; reviews subline → `Verifizierte Erfahrungen aus der Schweiz — nach mindestens 14 Tagen täglicher Anwendung. Jede Bewertung wird anhand der Bestellnummer geprüft.`; "Sichern dir" → `Sichern Sie sich`; on the 2-für-1 page convert ALL du-forms to Sie (e.g. "damit du in Ruhe entscheidest" → `damit Sie in Ruhe entscheiden`). Sweep the whole DE locale for stray du-forms (` dir `, ` dich `, `deine`).

**Founder review → Story.** Remove the founder review from the Bewertungen data. Insert a trimmed version on the Story page under heading `Warum ich AmberNord täglich trinke` (signature "Eriks Matisons, Gründer", NO star rating). Delete these sentences from it: the scalp/shaving sentence ("…meine Kopfhaut ist nach dem Rasieren…"), the 15-hours/eyes sentence, "Die Verdauung ist ruhiger, die Haut wirkt besser… ermüden deutlich weniger. Die Ausdauer ist spürbar höher.", "Schon während des Trinkens habe ich gespürt, wie Energie in den Körper kommt…", and "Ich habe die Konkurrenz getestet — keine kommt heran". Keep taste, the 1:10 description, the 5–10 ml daily habit, and the closing "kompromissloses Superkonzentrat" line.

**Bewertungen page logic:** review by "B." displays first. Render the aggregate score ONLY when verified review count ≥ 5; below that threshold show `{n} verifizierte Bewertungen` without an average.

**FAQ page:** add a new category `Bestellung & Versand` with these Q&A (write full accordion entries):
1. *Was kostet der Versand und wie schnell liefern Sie?* — `Versand in 24 h ab Logistikzentrum Aarau. The Habit und The Protocol: kostenloser Versand in der ganzen Schweiz. The Starter: zzgl. Versandkosten (werden im Checkout angezeigt).`
2. *Wie funktioniert die 30-Tage-Geld-zurück-Garantie?* — `Nicht überzeugt? Melden Sie sich innert 30 Tagen nach Erhalt per E-Mail — Sie erhalten den vollen Kaufpreis zurück, unkompliziert und ohne Begründung.`
3. *Welche Zahlungsarten akzeptieren Sie?* — `TWINT, Visa, Mastercard, Apple Pay, Google Pay und PayPal — alle Zahlungen laufen verschlüsselt über Stripe.`
4. *Wie kann ich mein Abo ändern oder kündigen?* — `Jederzeit, ohne Frist: über den Link in Ihrer Bestellbestätigung oder per E-Mail. Die nächste nicht versendete Lieferung wird gestoppt.`
5. *Ist AmberNord für Schwangere, Stillende oder bei Medikamenteneinnahme geeignet?* — `Sanddorn ist ein Lebensmittel. Bei Schwangerschaft, Stillzeit oder regelmässiger Medikamenteneinnahme besprechen Sie neue Nahrungsroutinen grundsätzlich mit Ihrer Ärztin oder Ihrem Arzt.`
6. *Ab welchem Alter ist das Elixier geeignet?* — `Als normales Lebensmittel grundsätzlich für die ganze Familie; Kindern empfehlen wir eine stärkere Verdünnung nach Geschmack.`
7. *Wie lagere ich die Flasche nach dem Öffnen?* — `Im Kühlschrank aufbewahren und innerhalb von 10 Tagen geniessen — wir verzichten vollständig auf künstliche Konservierungsstoffe.`
Rewrite the B12 answer to: `Sanddorn enthält B12-ähnliche Verbindungen (Analoga). Als verlässliche B12-Quelle gilt er nach heutigem Stand nicht — wer Vitamin B12 gezielt supplementieren muss, sollte dies separat tun.` Insert the Phase-0 Vitamin-C number into the "Wie viel Vitamin C enthält eine Portion?" answer.

---

## PHASE 2 — Propagate to EN / FR / IT

Apply every Phase-1 change to `data/en`, `data/fr`, `data/it`. Tone: FR = vous, IT = Lei (fix `PROVATE ORA` → `Provi ora`), EN = neutral imperative. Prices: dot decimal in ALL languages (`24.90 CHF` — Swiss convention; fix any `24,90`). The claim cores must use the official register wording per language, verbatim:

EN: "Vitamin C contributes to the normal function of the immune system / to the reduction of tiredness and fatigue / to the protection of cells from oxidative stress / to normal energy-yielding metabolism / to normal psychological function / to normal collagen formation for the normal function of skin / of blood vessels." IF_A: "Vitamin A contributes to the maintenance of normal vision / normal skin / normal mucous membranes."

FR: "La vitamine C contribue au fonctionnement normal du système immunitaire / à réduire la fatigue / à protéger les cellules contre le stress oxydatif / à un métabolisme énergétique normal / à des fonctions psychologiques normales / à la formation normale de collagène pour assurer la fonction normale de la peau / des vaisseaux sanguins." IF_A: "La vitamine A contribue au maintien d'une vision normale / d'une peau normale / de muqueuses normales."

IT: "La vitamina C contribuisce alla normale funzione del sistema immunitario / alla riduzione della stanchezza e dell'affaticamento / alla protezione delle cellule dallo stress ossidativo / al normale metabolismo energetico / alla normale funzione psicologica / alla normale formazione del collagene per la normale funzione della pelle / dei vasi sanguigni." IF_A: "La vitamina A contribuisce al mantenimento della normale capacità visiva / di una pelle normale / di membrane mucose normali."

Flag any obviously machine-translated strings you encounter for native review (list in final report, do not block).

---

## PHASE 3 — Locale URLs, prerender, SEO

1. **Router:** treat a leading path segment `en|fr|it` as locale (DE = root, no `/de/`). Strip it before route matching; expose `getLocale()`/`localePath(path)`; ALL internal links and the language switcher go through `localePath` and preserve the current route (`/story/` ↔ `/fr/story/`). No automatic geo/language redirects.
2. **Prerender:** create `scripts/prerender.mjs` + `package.json` (`"build": "node scripts/prerender.mjs"`, output `dist/`). For every route × locale (~40 pages): copy static assets, write `dist/{locale?}/{route}/index.html` containing: the shell with the page fragment injected into `<main>` (router hydrates over it), localized `<title>` + meta description, **self-referencing canonical** (`https://ambernord.ch/...`), og:title/description/url/image, og:locale, and the full hreflang cluster on every page: `de-CH` → root, `en` → `/en/...`, `fr-CH` → `/fr/...`, `it-CH` → `/it/...`, `x-default` → root.
3. **Structured data:** JSON-LD per page type — `Product` on PDPs (name, image, description, brand AmberNord, offers: price, priceCurrency CHF, availability InStock), `Organization` (+ founder) on home, `FAQPage` on FAQ.
4. **noindex for previews:** `functions/_middleware.js` — if request hostname ends with `.pages.dev`, add header `X-Robots-Tag: noindex, nofollow`.
5. Generate `sitemap.xml` (all locales) + `robots.txt`. Note in the report that the user must set CF Pages build command to `npm run build`, output dir `dist`. Keep the repo runnable without the build step for local dev.

---

## PHASE 4 — UI / conversion

1. **Abo toggle** (Habit + Protocol, PDP and shop cards): radio group above the CTA — `◯ Einmalkauf 69.00 CHF` / `◉ Abo 63.00 CHF/Monat — Sie sparen 6.– (–9 %) · jederzeit kündbar` (Protocol: 129.00 / `119.00 — Sie sparen 10.– (–8 %)`). Default = Einmalkauf. The single CTA switches label and href between the one-time Stripe link and the subscription link from Phase 0. Delete the current static "MIT ABO SPAREN" info strips. Fix the wrong percentages everywhere.
2. **CTA hierarchy:** primary buy buttons are ALWAYS filled amber (including all three shop cards); outline style only for secondary actions. Unify labels: nav = `Jetzt bestellen` (remove the contextual "Zum Ritual" swap); shop cards/PDP primary = `Jetzt bestellen — {price} CHF` (abo mode: `Abo starten — {price} CHF/Monat`); end-of-page section CTAs = `Ritual wählen →`; 2-für-1 keeps `Aktion sichern`.
3. **Homepage products section:** at ≥768 px render the three cards as a static grid (reuse the shop-card component); the one-at-a-time carousel/constellation only below 768 px. No state where zero cards are visible.
4. **Reveal animations:** content must be visible without JS (default CSS `opacity:1`; animation classes applied by JS only). GSAP: trigger `start: 'top 85%'`, animate transform + short fade only, stagger ≤ 0.4 s, `gsap.matchMedia` (no pinning < 768 px), full `prefers-reduced-motion` bypass. On route change render the fragment immediately (no ~1 s black gap) — animate after paint.
5. **Header:** brand logo only — remove the overlapping green bio badge (it stays in the hero eyebrow). Add `alt`/`aria-label` to logo and social icons.
6. **PDP trust bar** near the buy box: `Bio-zertifiziert ({code}) · Laborgeprüft · Versand in 24 h aus Aarau` + payment icon row (TWINT, Visa, MC, Apple Pay, Google Pay, PayPal).
7. **Hero:** implement the single-line subhead from Phase 1, bullets in the sans UI font (not italic serif), add a subtle dark scrim gradient behind the hero text for contrast.
8. **Ritual video section:** per Phase 0 — YouTube facade embed (thumbnail + click-to-load) or delete section.
9. **Infographics (Wissenschaft):** wrap all infographic images in a lightbox (click to zoom, backdrop/ESC close, works on touch) + meaningful alt texts.
10. **Story layout (desktop):** founder photo as a proper column next to the text (no floating gap); quote collapsed to the first 4 sentences with a `Mehr lesen` expander.
11. **Footer:** add `Impressum` link + create `/impressum/` page in all 4 locales from Phase-0 data (entity, address, UID, e-mail, plus note "Plattform der EU-Streitbeilegung" not required for CH — omit); add a trust row: payment icons + `Versand aus der Schweiz`.

---

## PHASE 5 — QA + report

1. Forbidden-term grep across ALL locales (fail = occurrence outside the Wissenschaft research-context sentences): `Infektion`, `Entzündung`, `Cholesterin`, `Blaulicht`, `blauem Licht`, `Leberzellen`, `Regeneration der`, `Trockene-Auge`, `Syndrom`, `Darmflora`, `optimieren die Verdauung`, `nachweislich`, `Sofort-Effekt`, `ab dem 1. Schluck`, `senkt das Risiko`, `unzerstörbar`, `zuckerfrei` (if flag FALSE), `Plätze`, `Bentley`, `Sichern dir`. DE-only du-form grep: ` dir `, ` dich `, `deine`. Exception: `Blutgefässe` is allowed ONLY inside the authorized collagen claim sentence.
2. Run the build; verify for 5 sample URLs (root, `/fr/`, a PDP, FAQ, `/en/ritual/`) that the emitted HTML contains the correct localized title, self-canonical, hreflang cluster, and injected content.
3. Click-path check: language switcher preserves route; all internal links locale-aware; abo toggle switches CTA href correctly; lightbox opens/closes; announcement bar dismiss persists.
4. Final report: table of every changed file, every UNMATCHED anchor from Phase 1, open TODOs (placeholders, missing lab values, native-review flags), and the two manual steps for the user (CF Pages build settings; verify Stripe subscription links in test mode).
