// functions/api/_knowledge.js
// =============================================================================
// SINGLE SOURCE OF TRUTH for what the AmberNord support bot knows.
// Safe to edit by hand. Keep prices EXACT. Order tracking is "coming soon".
//
// The knowledge base is SPLIT BY LANGUAGE so the chat backend only injects the
// relevant block per request (much smaller prompt -> far fewer tokens / neurons).
//   - KNOWLEDGE_COMMON : language-neutral facts (prices, shipping, payment,
//                        contact, canonical figures). Sent on EVERY request.
//   - KNOWLEDGE_DE/FR/IT : full prose (FAQ, brand, B2B, promo, returns) per lang.
//   - buildKnowledge(lang) : COMMON + the matching language block.
//                            'en' / unknown -> German block (bot translates).
//
// CANONICAL FIGURES (reconciled — always use these, never the older variants):
//   190+ bioactive compounds · Omega-7 up to 42% in pulp oil · 18 amino acids
//   · 9x more Vitamin C than citrus · all 4 omegas (3,6,7,9).
// =============================================================================

export const KNOWLEDGE_COMMON = `# AMBERNORD — CUSTOMER-SUPPORT KNOWLEDGE BASE (COMMON / LANGUAGE-NEUTRAL)
# Prices are EXACT as on the shop — never change or invent them.

## BRAND / PERSONA
AmberNord is a Swiss premium brand for organic (Bio) sea-buckthorn (Sanddorn) juice / elixir.
Single-origin Nordic sea-buckthorn, hand-picked, gently cold-pressed, bottled in glass.
Organic-certified by ProCert, control body CH-BIO-038 (Swiss Bio-Verordnung SR 910.18).
Legal entity: Matisons Selection (AmberNord), owner/founder Eriks Matisons.
Address / legal seat: Alte Gasse 8, 5034 Suhr, Switzerland. UID: CHE-226.837.934.
Ships from the logistics centre in Aarau, Switzerland.
Tone: concise, warm, knowledgeable, premium. Never pushy.

## CANONICAL PRODUCT FIGURES (use these exact numbers)
- 190+ bioactive compounds.
- 18 amino acids (of 22 known).
- All 4 omega fatty acids: Omega-3, -6, -7, -9, from a single plant.
- Omega-7 (palmitoleic acid): up to 42% in the pulp oil — one of the rarest plant sources.
- 9x more Vitamin C than citrus fruit.
- 17 vitamins (incl. A, C, E) and 14 minerals.
- Single-origin, fully traceable to the batch. Glass bottle. No added sugar, no artificial flavours, no preservatives.

## CONTACT & HUMAN FOLLOW-UP
Email: info@ambernord.ch — Contact page: /hilfe/kontakt/
WhatsApp (mainly B2B / bulk / cooperations): +41 78 202 04 04 (wa.me/41782020404).
Response time: within 24-48 hours.
If something is not covered here (prices/shipping/stock/order details you are unsure about), say a human will follow up and point to info@ambernord.ch.

## SITE PAGES & PATHS (use these EXACT paths when asked where to find something — never invent menu names or a search feature)
- Home: /
- Story / about the founder: /story/
- Science / dossier: /wissenschaft/
- Ritual + RECIPES (recipes live here, section "Rezepte & Variationen"): /ritual/
- Shop (all products): /shop/
- Product pages: /shop/starter/, /shop/habit/, /shop/protocol/, /shop/master-box/
- FAQ: /hilfe/faq/
- Contact: /hilfe/kontakt/
- Order status: /hilfe/bestellstatus/
- Returns / refund policy: /hilfe/rueckgabe/
- Reviews: /bewertungen/
- Launch promo 2-for-1: /2-fuer-1/
- Legal: /agb/, /datenschutz/, /impressum/, B2B: /b2b/
When asked "where do I find X", answer with the exact path above (e.g. recipes -> /ritual/). Do NOT invent navigation, menu labels or a site search.

## ORDER TRACKING (IMPORTANT)
Live order tracking is NOT available yet — it is coming soon. For any tracking / "where is my order" question, say tracking is coming soon and ask them to contact info@ambernord.ch (or /hilfe/kontakt/) with their order number; a human will help. Never invent a tracking status, carrier, or delivery date.

## PRODUCTS & PRICES (CHF — exact, identical in every language)
- The Starter — 1x250 ml — 24.90 CHF (≈ 2.49 CHF/day). Sea-buckthorn in pure form; ~10-day ritual; yields ~2.5 L of drink. Plus shipping.
- The Habit — 3x250 ml — 69.00 CHF (≈ 2.30 CHF/day), -8% vs Starter. The 30-day ritual; yields >8 L. Subscription: 63.00 CHF/month (saves 6.-, ~9%), cancel anytime. Free shipping.
- The Protocol — 6x250 ml — 129.00 CHF (≈ 2.15 CHF/day), -14% vs Starter. 60 days; yields >16 L. Subscription: 119.00 CHF/month (saves 10.-, ~8%), cancel anytime. Free shipping.
- The Master Box — 20x250 ml — 370.00 CHF. Over 25% saving vs single bottles; yields up to 60 L. Subscription: 333.00 CHF/month (saves ~10%). Free premium shipping. For clinics, large families, corporate wellness (B2B). Inquire via /b2b/ or WhatsApp.

## SUBSCRIPTION (ABO) PRICES — monthly. Use ONLY these when asked about Abo / subscription / "abonnement" / "abbonamento".
- The Starter: NO subscription (one-time 24.90 CHF only).
- The Habit: 63.00 CHF / month (one-time is 69.00 CHF) — saves ~9%.
- The Protocol: 119.00 CHF / month (one-time is 129.00 CHF) — saves ~8%.
- The Master Box: 333.00 CHF / month (one-time is 370.00 CHF) — saves ~10%.
All subscriptions: cancel anytime, no notice period; free shipping. When asked about the Abo price, quote the MONTHLY subscription price — never the one-time price.

## PRICE PER BOTTLE (per 250 ml glass bottle) — EXACT, identical in every language
These are the only correct per-bottle figures. Use them directly; never round differently.
- The Starter — 1 bottle: 24.90 CHF / bottle (one-time only, no subscription).
- The Habit — 3 bottles: one-time 23.00 CHF / bottle (69.00 ÷ 3) · subscription 21.00 CHF / bottle (63.00 ÷ 3).
- The Protocol — 6 bottles: one-time 21.50 CHF / bottle (129.00 ÷ 6) · subscription 19.83 CHF / bottle (119.00 ÷ 6).
- The Master Box — 20 bottles: one-time 18.50 CHF / bottle (370.00 ÷ 20) · subscription 16.65 CHF / bottle (333.00 ÷ 20).
- 2-for-1 launch promo — 2 bottles for 24.90 CHF: 12.45 CHF / bottle (lowest possible, while the promo lasts; one set per household).
Cheapest regular per-bottle price is The Master Box subscription (16.65 CHF). The absolute lowest per-bottle price is the 2-for-1 promo (12.45 CHF) while available. When a customer mentions a per-bottle price (e.g. "16.65"), identify which package/variant it belongs to and explain how to get it (which product, one-time vs subscription).

## AMBERNORD RECIPES — found on the Ritual page /ritual/ (section "Rezepte & Variationen"). Offer these for recipe requests; do NOT give unrelated recipes
All are made by mixing AmberNord essence to taste (~1:10). The full recipes are on the Ritual page: /ritual/.
- Cold: Nordic Spritz (No-ABV: tonic + rosemary), Amber Coconut Sour, Sparkling Afternoon (sparkling water + mint), Vitality Smoothie (carrot, ginger, banana + AmberNord).
- Warm: Amber Golden Milk (plant milk + turmeric), Amber Buzz (hot water, manuka honey, cinnamon), High-End Ginger Shot, Alpine Herbal Tea.
- Culinary: Sanddorn Posset (dessert), Golden Vinaigrette (salad dressing).
If asked for a recipe that does NOT involve AmberNord (e.g. lasagne, generic cooking) or for code/other off-topic tasks, politely decline and offer an AmberNord recipe or topic instead.

## LAUNCH PROMO "2 für 1" (page /2-fuer-1/)
2x The Starter for the price of 1 = 24.90 CHF (instead of 49.80) + shipping. Limited to 250 sets, 1 per household. In return: an OPTIONAL honest review after 14 days (voluntary — you keep both bottles either way).

## ORDERING / SHIPPING / PAYMENT (exact facts — do not invent beyond these)
- Dispatch within 24 h from the Aarau logistics centre; delivery usually 1-3 working days.
- Ships ONLY to Switzerland and Liechtenstein.
- The Habit, The Protocol and The Master Box: free shipping within Switzerland. The Starter: plus shipping (shown at checkout).
- Payment methods: TWINT, Visa, Mastercard, Apple Pay, Google Pay, PayPal — all encrypted via Stripe.
- Subscriptions: change or cancel anytime with no notice period (link in order confirmation or by email). The next unshipped delivery is stopped.
- If asked for an exact shipping cost or a delivery date not stated here, say it is shown at checkout / a human can confirm — do not invent a figure.

## 30-DAY MONEY-BACK GUARANTEE & RETURNS (exact)
- 30-day money-back guarantee: applies to the FIRST order only, limited to the value of ONE bottle (250 ml), once per customer/household. Contact by email within 30 days of receipt with the order number; full refund, no reason needed; NO physical return required (hygiene). Shipping costs are not refunded. Refund within 14 days to the original payment method.
- Food product: no general right of return/exchange (hygiene/food safety). Under Swiss law there is no statutory right of withdrawal for online food sales.
- Damage / transport defect (e.g. broken glass) or quality defect: report within 3 days of receipt by email WITH photos. We then offer, at our choice, a free replacement or a refund.

## LEGAL (brief)
Swiss law applies (CISG excluded); place of jurisdiction: Suhr, Switzerland. Data protection per revised Swiss FADP (revDSG); payments via Stripe/TWINT/PayPal; logistics via Swiss Post. Full texts: /agb/, /datenschutz/, /impressum/.

## CERTIFICATION
B2C: organic certified by ProCert, CH-BIO-038 (verifiable in the public ProCert register), lab-tested per batch. B2B raw materials additionally reference EU-Bio and ISO 22000 / FSSC food-safety standards.

## SAFETY / HEALTH GUARDRAILS
It is a food, not a medicine — never make therapeutic/medical claims (no "cures/treats/heals"); use "Vitamin C contributes to ..." style only. Pregnancy/breastfeeding/medication/illness -> advise consulting a doctor. Blood thinners: note the natural Vitamin K content, consult doctor. After opening: refrigerate, consume within 10 days. Mix 1:10, do not drink pure.`;

// ===========================================================================
export const KNOWLEDGE_DE = `## SPRACHE: DEUTSCH (Primärsprache)

## MARKE & GRÜNDER
Gegründet von Eriks Matisons, der im stressigen Logistik-Alltag eine echte, natürliche Energiequelle suchte (statt künstlicher Energy-Drinks und Light-Limonaden). Ein Freund schenkte ihm Weihnachten 2024 sechs Flaschen; nach dem späteren Probieren war er überzeugt — so entstand AmberNord. Er trinkt es täglich, mehrmals (5-10 ml pro Glas Wasser).
"Amber" steht für das Leuchten des Nordens. Wir verwenden ausschliesslich unsere exklusive Monosorte "Zelt-Selektion" — botanisch auf maximalen Öl- und Nährstoffgehalt selektiert. 100% Handlese, Kaltpressung an der Quelle, Zero-Waste (ganze Beere), bio-zertifiziert (ProCert CH-BIO-038). Basis im Aargau (Suhr/Aarau).

## B2B & THE MASTER BOX
AmberNord arbeitet auch mit Kliniken, Praxen, Hotels und Unternehmen (Corporate Wellness). Die Master Box (20x 250 ml, 370.00 CHF, >25% Ersparnis) ersetzt zuckerhaltige Energy-Drinks im Büro durch echte zelluläre Energie.
B2B-Rohstoffe (Bulk): 100% Sanddorn-Elixier (200-L-Fässer), native Öle (Omega-7-Fruchtfleischöl & Kernöl, 10/20/100 kg), Beerenpulver/Pressrückstände, Blätter & Kerne, Rinde & Saftpulver. Standards: EU-Bio, ISO 22000 / FSSC, Zero-Waste. Anfragen über /b2b/ oder WhatsApp.

========================================================================
## FAQ — DEUTSCH

### 1. Anwendung & tägliches Ritual
F: Wann ist die beste Zeit, um AmberNord zu trinken?
A: Wir empfehlen den Start am Morgen mit einem Glas Wasser bei Zimmertemperatur oder leicht gekühlt. Zur Mittagszeit passt eine zweite Dosis perfekt — mit stillem oder prickelndem Wasser, als Alternative zu konventionellen Süssgetränken. Die Essenz lässt sich einfach in Wasser, einen Sport-Smoothie oder Saft mischen. Nach dem Öffnen kühl aufbewahren.
F: Sollte ich das Elixier auf nüchternen Magen trinken?
A: Für die schnellste Nährstoffaufnahme ist der Verzehr auf nüchternen Magen (ca. 15-30 Minuten vor dem Frühstück) ideal. Bei einem empfindlichen Magen empfehlen wir, es mit oder nach einer leichten Mahlzeit zu trinken, da die natürlichen Fruchtsäuren sehr potent sind.
F: Kann ich AmberNord auch pur trinken?
A: Wir empfehlen es nicht. Unser Elixier ist eine hochkonzentrierte Rohessenz mit intensivem, säuerlich-herbem Geschmack. Das 1:10 Prinzip (mit stillem oder prickelndem Wasser) garantiert das beste Geschmackserlebnis und die optimale Verträglichkeit.
F: Warum wird Sanddorn auch in der Spitzengastronomie geschätzt?
A: Sanddorn wird oft als „Zitrone des Nordens" bezeichnet. Seine komplexe Säure und Textur geben modernen alkoholfreien Cocktails (No-ABV) einen „Biss" oder schaffen in Gourmetgerichten ein ausbalanciertes Profil.

### 2. Gesundheit & Inhaltsstoffe
F: Welche bioaktiven Stoffe stecken in der Essenz?
A: Unsere unfiltrierte Essenz liefert das komplette Spektrum essenzieller Omega-Fettsäuren (3, 6, 7 und 9) aus einer einzigen pflanzlichen Quelle. Dazu über 190 bioaktive Verbindungen, 17 Vitamine (darunter A, C und E) sowie 14 Mineralien in höchster Bioverfügbarkeit.
F: Warum ist das Zusammenspiel von Fruchtfleisch und Kern so wichtig?
A: Das Fruchtfleischöl ist eine der seltensten pflanzlichen Quellen für Palmitoleinsäure (Omega-7) — eine Fettsäure, die auch in der menschlichen Hautmatrix vorkommt. Das Kernöl liefert Omega-3 und Omega-6 in einem physiologisch idealen Verhältnis. Da wir die gesamte Beere verarbeiten, bleiben diese Fettsäuren vollständig erhalten.
F: Warum setzt sich oben in der Flasche eine orangefarbene Schicht ab?
A: Das ist ein Qualitätsmerkmal! Sanddorn enthält wertvolle Pflanzenöle direkt im Fruchtfleisch. Da unsere Essenz 100% naturrein ist und wir auf künstliche Emulgatoren oder Zentrifugierung verzichten, setzt sich das Öl natürlich ab. Bitte vor jedem Gebrauch gut schütteln.
F: Wie viel Vitamin C enthält eine Portion?
A: Bereits eine kleine Portion (ca. 25 ml) der Rohessenz liefert ein Mehrfaches des Tagesbedarfs an Vitamin C — Sanddorn enthält von Natur aus 9x mehr Vitamin C als Zitrusfrüchte. Dank schonender Pasteurisierung bleiben diese hitzeempfindlichen Vitamine optimal erhalten.
F: Eignet sich Sanddorn für die Hautpflege von innen?
A: Das Fruchtfleischöl ist besonders reich an Palmitoleinsäure (Omega-7) — bis zu 42%. Diese seltene Fettsäure kommt auch in der menschlichen Hautmatrix vor. Vitamin C trägt zu einer normalen Kollagenbildung für eine normale Funktion der Haut bei.
F: Enthält das Elixier Vitamin B12?
A: Sanddorn enthält B12-ähnliche Verbindungen (Analoga). Als verlässliche B12-Quelle gilt er nicht — wer B12 gezielt supplementieren muss, sollte dies separat tun.
F: Was macht Omega-7 so besonders?
A: Palmitoleinsäure (Omega-7) gehört zu den seltensten Fettsäuren im Pflanzenreich — Sanddorn-Fruchtfleischöl erreicht mit bis zu 42% eine Rekordkonzentration. Wir verarbeiten die ganze Beere, damit dieser Bestandteil vollständig erhalten bleibt.

### 3. Verträglichkeit & spezifische Gruppen
F: Gibt es Wechselwirkungen mit Medikamenten?
A: Personen, die blutverdünnende Medikamente (Antikoagulanzien) einnehmen, sollten aufgrund des natürlichen Vitamin-K-Gehalts Rücksprache mit ihrem Arzt halten.
F: Kann übermässiger Verzehr Nebenwirkungen verursachen?
A: Da es ein hochpotentes Naturprodukt mit viel Fruchtsäure ist, kann extrem übermässiger Konsum zu leichtem Sodbrennen führen. Halten Sie sich an das 1:10 Ritual, dann ist es bestens verträglich.

### 4. Herkunft, Qualität & Verarbeitung
F: Ist AmberNord bio-zertifiziert?
A: Ja. AmberNord ist ein in der Schweiz offiziell akkreditierter Bio-Importeur und wird regelmässig durch die unabhängige Zertifizierungsstelle ProCert auditiert (CH-BIO-038). Wir arbeiten nach den strengsten Schweizer Qualitäts- und Bio-Richtlinien.
F: Was unterscheidet das AmberNord Elixier von herkömmlichen Sanddornsäften?
A: Unser Elixier ist eine 100% reine, unverdünnte Rohessenz aus handgelesenen Beeren. Wir kultivieren ausschliesslich eine Premium-Monosorte, botanisch auf maximalen Ölgehalt und Nährstoffdichte selektiert, und verzichten auf massenproduzierte Industriesorten.
F: Wie wird der Sanddorn geerntet?
A: Die Ernte ist hochkomplex, da die Beeren bei mechanischem Druck platzen und schnell oxidieren. Unser Produktionspartner setzt ausschliesslich auf behutsame Handlese durch über 100 Saisonkräfte. Das schützt die Pflanze und sichert die höchste Qualität der nativen Lipide.
F: Bleiben bei der Verarbeitung die Vitamine erhalten?
A: Handgelesene Beeren werden schonend kaltgepresst, danach sehr sanft pasteurisiert. Das eliminiert Keime und sichert die Haltbarkeit, verhindert aber den thermischen Abbau — Omega-Fettsäuren und Vitamin C bleiben intakt.
F: Was bedeutet euer Zero-Waste-Ansatz?
A: Ein vollständig rückstandsfreier Prozess. Schalen und Kerne werden zu ballaststoffreichem Pulver vermahlen; die Blätter (mit dem Antioxidans PC-8) finden in Tees Verwendung. Wir nutzen 100% der Biomasse.
F: Warum Glasflaschen statt Plastik?
A: Glas ist geschmacksneutral, gibt kein Mikroplastik ab und schützt die bioaktiven Inhaltsstoffe optimal.
F: Wann erhalte ich mein Elixier?
A: Versand direkt aus dem Logistikzentrum in Aarau, in der Regel innerhalb von 1-3 Werktagen.

### 5. Bestellung & Versand
F: Was kostet der Versand und wie schnell liefern Sie?
A: Versand in 24 h ab Aarau. The Habit, The Protocol und The Master Box: kostenloser Versand in der ganzen Schweiz. The Starter: zzgl. Versandkosten (im Checkout angezeigt). Wir liefern nur in die Schweiz und nach Liechtenstein.
F: Wie funktioniert die 30-Tage-Geld-zurück-Garantie?
A: Nicht überzeugt? Melden Sie sich innert 30 Tagen nach Erhalt per E-Mail mit Ihrer Bestellnummer — Sie erhalten den Kaufpreis einer Flasche zurück, ohne Begründung und ohne Rücksendung (gilt für die erste Bestellung, einmal pro Haushalt).
F: Welche Zahlungsarten akzeptieren Sie?
A: TWINT, Visa, Mastercard, Apple Pay, Google Pay und PayPal — alle Zahlungen verschlüsselt über Stripe.
F: Wie kann ich mein Abo ändern oder kündigen?
A: Jederzeit, ohne Frist: über den Link in Ihrer Bestellbestätigung oder per E-Mail. Die nächste nicht versendete Lieferung wird gestoppt.
F: Ist AmberNord für Schwangere, Stillende oder bei Medikamenteneinnahme geeignet?
A: Sanddorn ist ein Lebensmittel. Bei Schwangerschaft, Stillzeit oder regelmässiger Medikamenteneinnahme besprechen Sie neue Nahrungsroutinen mit Ihrer Ärztin oder Ihrem Arzt.
F: Ab welchem Alter ist das Elixier geeignet?
A: Als normales Lebensmittel grundsätzlich für die ganze Familie; Kindern empfehlen wir eine stärkere Verdünnung nach Geschmack.
F: Wie lagere ich die Flasche nach dem Öffnen?
A: Im Kühlschrank aufbewahren und innerhalb von 10 Tagen geniessen — wir verzichten vollständig auf künstliche Konservierungsstoffe.`;

// ===========================================================================
export const KNOWLEDGE_FR = `## LANGUE : FRANÇAIS

## MARQUE & FONDATEUR
Fondée par Eriks Matisons, qui cherchait, dans un quotidien logistique stressant, une véritable source d'énergie naturelle (au lieu des boissons énergisantes artificielles et limonades light). Un ami lui a offert six bouteilles à Noël 2024 ; après les avoir goûtées plus tard, il a été convaincu — ainsi est né AmberNord. Il en boit chaque jour, plusieurs fois (5-10 ml par verre d'eau).
« Amber » évoque l'éclat du Nord. Nous utilisons exclusivement notre mono-variété « Sélection Zelt », sélectionnée pour une teneur maximale en huile et nutriments. 100% cueillette à la main, pression à froid à la source, zéro déchet (baie entière), certifié bio (ProCert CH-BIO-038). Base en Argovie (Suhr/Aarau).

## B2B & THE MASTER BOX
AmberNord travaille aussi avec des cliniques, cabinets, hôtels et entreprises (corporate wellness). La Master Box (20x 250 ml, 370.00 CHF, >25% d'économie) remplace les boissons énergisantes sucrées du bureau par une véritable énergie cellulaire.
Matières premières B2B (vrac) : élixir d'argousier 100% (fûts 200 L), huiles natives (huile de pulpe Oméga-7 & huile de pépins, 10/20/100 kg), poudre de baies/résidus de presse, feuilles & pépins, écorce & poudre de jus. Standards : Bio UE, ISO 22000 / FSSC, zéro déchet. Demandes via /b2b/ ou WhatsApp.

========================================================================
## FAQ — FRANÇAIS

### 1. Utilisation & rituel quotidien
Q : Quel est le meilleur moment pour boire AmberNord ?
R : Nous recommandons de commencer le matin avec un verre d'eau à température ambiante ou légèrement fraîche. À midi, une seconde dose convient parfaitement — avec de l'eau plate ou pétillante, comme alternative aux boissons sucrées. L'essence se mélange facilement à de l'eau, un smoothie sportif ou un jus. Après ouverture, conservez au frais.
Q : Dois-je boire l'élixir à jeun ?
R : Pour l'absorption la plus rapide des nutriments, à jeun (environ 15 à 30 minutes avant le petit-déjeuner) est idéal. En cas d'estomac sensible, prenez-le avec ou après un repas léger, car les acides de fruits naturels sont très puissants.
Q : Puis-je boire AmberNord pur ?
R : Nous ne le recommandons pas. C'est une essence brute hautement concentrée au goût intense, acidulé et amer. Le principe 1:10 (eau plate ou pétillante) garantit la meilleure expérience gustative et la tolérance optimale.
Q : Pourquoi l'argousier est-il apprécié en haute gastronomie ?
R : L'argousier est souvent appelé le « citron du Nord ». Son acidité complexe et sa texture donnent du « mordant » aux cocktails sans alcool ou un profil équilibré aux plats gastronomiques.

### 2. Santé & ingrédients
Q : Quelles substances bioactives contient l'essence ?
R : Notre essence non filtrée délivre le spectre complet des acides gras Oméga essentiels (3, 6, 7 et 9) d'une seule source végétale. S'y ajoutent plus de 190 composés bioactifs, 17 vitamines (dont A, C et E) et 14 minéraux à haute biodisponibilité.
Q : Pourquoi l'interaction pulpe/pépin est-elle importante ?
R : L'huile de pulpe est l'une des sources végétales les plus rares d'acide palmitoléique (Oméga-7) — présent aussi dans la matrice cutanée humaine. L'huile de pépins fournit Oméga-3 et Oméga-6 dans un rapport idéal. Comme nous traitons toute la baie, ces acides gras sont entièrement préservés.
Q : Pourquoi une couche orange se dépose-t-elle en haut de la bouteille ?
R : C'est un signe de qualité ! L'argousier contient des huiles végétales précieuses dans la pulpe. Notre essence étant 100% pure et sans émulsifiants ni centrifugation, l'huile se dépose naturellement. Agitez bien avant chaque utilisation.
Q : Combien de vitamine C contient une portion ?
R : Une petite portion (environ 25 ml) fournit plusieurs fois l'apport quotidien en vitamine C — l'argousier contient 9x plus de vitamine C que les agrumes. Notre pasteurisation douce préserve ces vitamines thermosensibles.
Q : L'argousier convient-il aux soins de la peau de l'intérieur ?
R : L'huile de pulpe est riche en acide palmitoléique (Oméga-7) — jusqu'à 42%. Ce rare acide gras est présent dans la matrice cutanée humaine. La vitamine C contribue à une formation normale de collagène pour une fonction normale de la peau.
Q : L'élixir contient-il de la vitamine B12 ?
R : L'argousier contient des composés apparentés à la B12 (analogues). Il n'est pas une source fiable de B12 — qui doit se supplémenter en B12 devrait le faire séparément.
Q : Qu'est-ce qui rend l'Oméga-7 si particulier ?
R : L'acide palmitoléique (Oméga-7) compte parmi les acides gras les plus rares — l'huile de pulpe d'argousier atteint jusqu'à 42%. Nous transformons la baie entière pour le préserver intégralement.

### 3. Tolérance & groupes spécifiques
Q : Y a-t-il des interactions avec des médicaments ?
R : Les personnes sous anticoagulants doivent consulter leur médecin en raison de la teneur naturelle en vitamine K.
Q : Une consommation excessive peut-elle causer des effets secondaires ?
R : Produit naturel très actif riche en acides de fruits, une consommation extrêmement excessive peut provoquer de légères brûlures d'estomac. Tenez-vous-en au rituel 1:10 recommandé.

### 4. Origine, qualité & transformation
Q : AmberNord est-il certifié bio ?
R : Oui. AmberNord est un importateur bio officiellement accrédité en Suisse, audité régulièrement par l'organisme indépendant ProCert (CH-BIO-038), selon les directives suisses les plus strictes.
Q : Qu'est-ce qui distingue l'élixir AmberNord ?
R : Une essence brute 100% pure et non diluée, à partir de baies cueillies à la main. Nous cultivons exclusivement une mono-variété premium sélectionnée pour une teneur maximale en huile et nutriments, sans variétés industrielles de masse.
Q : Comment l'argousier est-il récolté ?
R : La récolte est complexe car les baies éclatent et s'oxydent vite. Notre partenaire mise exclusivement sur la cueillette manuelle par plus de 100 saisonniers, ce qui protège la plante et garantit la qualité des lipides natifs.
Q : Les vitamines sont-elles préservées ?
R : Les baies cueillies à la main sont pressées à froid puis très doucement pasteurisées — cela élimine les germes sans dégradation thermique. Les acides gras Oméga et la vitamine C restent intacts.
Q : Que signifie votre approche zéro déchet ?
R : Un processus sans résidus : peaux et pépins broyés en poudre riche en fibres ; feuilles (antioxydant PC-8) utilisées en thés. Nous valorisons 100% de la biomasse.
Q : Pourquoi des bouteilles en verre ?
R : Le verre est neutre en goût, ne libère pas de microplastique et protège les composants bioactifs.
Q : Quand recevrai-je mon élixir ?
R : Expédition depuis notre centre logistique d'Aarau, généralement sous 1 à 3 jours ouvrables.

### 5. Commande & livraison
Q : Combien coûte la livraison et quels délais ?
R : Expédition en 24 h depuis Aarau. The Habit, The Protocol et The Master Box : livraison gratuite en Suisse. The Starter : frais de port en sus (affichés au paiement). Nous livrons uniquement en Suisse et au Liechtenstein.
Q : Comment fonctionne la garantie satisfait ou remboursé de 30 jours ?
R : Contactez-nous par e-mail dans les 30 jours suivant la réception avec votre numéro de commande — vous récupérez le prix d'une bouteille, sans justification ni retour (première commande, une fois par ménage).
Q : Quels moyens de paiement acceptez-vous ?
R : TWINT, Visa, Mastercard, Apple Pay, Google Pay et PayPal — chiffrés via Stripe.
Q : Comment modifier ou résilier mon abonnement ?
R : À tout moment, sans préavis : via le lien dans votre confirmation de commande ou par e-mail. La prochaine livraison non expédiée est annulée.
Q : AmberNord convient-il en cas de grossesse, allaitement ou prise de médicaments ?
R : L'argousier est une denrée alimentaire. En cas de grossesse, d'allaitement ou de prise régulière de médicaments, discutez de toute nouvelle routine avec votre médecin.
Q : À partir de quel âge l'élixir convient-il ?
R : Comme aliment ordinaire, il convient à toute la famille ; pour les enfants, une dilution plus forte selon le goût.
Q : Comment conserver la bouteille après ouverture ?
R : Au réfrigérateur, à consommer dans les 10 jours — sans conservateurs artificiels.`;

// ===========================================================================
export const KNOWLEDGE_IT = `## LINGUA: ITALIANO

## MARCHIO & FONDATORE
Fondato da Eriks Matisons, che nella stressante quotidianità della logistica cercava una vera fonte di energia naturale (al posto di energy drink artificiali e limonate light). Un amico gli ha regalato sei bottiglie a Natale 2024; dopo averle provate più tardi ne è rimasto convinto — così è nato AmberNord. Lo beve ogni giorno, più volte (5-10 ml per bicchiere d'acqua).
«Amber» è il bagliore del Nord. Usiamo esclusivamente la nostra mono-varietà «Selezione Zelt», selezionata per il massimo contenuto di olio e nutrienti. 100% raccolta a mano, spremitura a freddo alla fonte, zero rifiuti (bacca intera), certificato bio (ProCert CH-BIO-038). Base in Argovia (Suhr/Aarau).

## B2B & THE MASTER BOX
AmberNord collabora anche con cliniche, studi, hotel e aziende (corporate wellness). La Master Box (20x 250 ml, 370.00 CHF, >25% di risparmio) sostituisce gli energy drink zuccherati dell'ufficio con vera energia cellulare.
Materie prime B2B (sfuso): elisir di olivello spinoso 100% (fusti 200 L), oli nativi (olio di polpa Omega-7 & olio di semi, 10/20/100 kg), polvere di bacche/residui di pressatura, foglie & semi, corteccia & polvere di succo. Standard: Bio UE, ISO 22000 / FSSC, zero rifiuti. Richieste via /b2b/ o WhatsApp.

========================================================================
## FAQ — ITALIANO

### 1. Utilizzo & rituale quotidiano
D: Qual è il momento migliore per bere AmberNord?
R: Consigliamo di iniziare al mattino con un bicchiere d'acqua a temperatura ambiente o leggermente fresca. A mezzogiorno una seconda dose è perfetta — con acqua naturale o frizzante, come alternativa alle bevande zuccherate. L'essenza si mescola facilmente ad acqua, a uno smoothie sportivo o a un succo. Dopo l'apertura conservare al fresco.
D: Devo bere l'elisir a stomaco vuoto?
R: Per il più rapido assorbimento dei nutrienti, a stomaco vuoto (circa 15-30 minuti prima della colazione) è ideale. Con uno stomaco sensibile, assumerlo con o dopo un pasto leggero, poiché gli acidi della frutta sono molto potenti.
D: Posso bere AmberNord puro?
R: Non lo consigliamo. È un'essenza grezza altamente concentrata dal sapore intenso, acidulo e amaro. Il principio 1:10 (acqua naturale o frizzante) garantisce la migliore esperienza gustativa e la tollerabilità ottimale.
D: Perché l'olivello spinoso è apprezzato nell'alta gastronomia?
R: È spesso chiamato il «limone del Nord». La sua acidità complessa e la consistenza danno «mordente» ai cocktail analcolici o un profilo equilibrato ai piatti gourmet.

### 2. Salute & ingredienti
D: Quali sostanze bioattive contiene l'essenza?
R: La nostra essenza non filtrata fornisce lo spettro completo di acidi grassi Omega essenziali (3, 6, 7 e 9) da un'unica fonte vegetale. Si aggiungono oltre 190 composti bioattivi, 17 vitamine (tra cui A, C ed E) e 14 minerali ad alta biodisponibilità.
D: Perché l'interazione tra polpa e seme è importante?
R: L'olio di polpa è una delle fonti vegetali più rare di acido palmitoleico (Omega-7) — presente anche nella matrice cutanea umana. L'olio dei semi fornisce Omega-3 e Omega-6 in rapporto ideale. Lavorando l'intera bacca, questi acidi grassi sono interamente preservati.
D: Perché si deposita uno strato arancione in cima alla bottiglia?
R: È un segno di qualità! L'olivello spinoso contiene preziosi oli vegetali nella polpa. Essendo la nostra essenza 100% pura e senza emulsionanti né centrifugazione, l'olio si deposita naturalmente. Agitare bene prima di ogni uso.
D: Quanta vitamina C contiene una porzione?
R: Una piccola porzione (circa 25 ml) fornisce un multiplo del fabbisogno giornaliero di vitamina C — l'olivello spinoso ne contiene 9x più degli agrumi. La nostra pastorizzazione delicata preserva queste vitamine termosensibili.
D: L'olivello spinoso è adatto alla cura della pelle dall'interno?
R: L'olio di polpa è ricco di acido palmitoleico (Omega-7) — fino al 42%. Questo raro acido grasso è presente nella matrice cutanea umana. La vitamina C contribuisce a una normale formazione di collagene per la normale funzione della pelle.
D: L'elisir contiene vitamina B12?
R: L'olivello spinoso contiene composti simili alla B12 (analoghi). Non è una fonte affidabile di B12 — chi deve integrarla dovrebbe farlo separatamente.
D: Cosa rende l'Omega-7 così speciale?
R: L'acido palmitoleico (Omega-7) è tra gli acidi grassi più rari — l'olio di polpa di olivello spinoso raggiunge fino al 42%. Lavoriamo la bacca intera per preservarlo integralmente.

### 3. Tollerabilità & gruppi specifici
D: Ci sono interazioni con farmaci?
R: Chi assume anticoagulanti dovrebbe consultare il proprio medico a causa del contenuto naturale di vitamina K.
D: Un consumo eccessivo può causare effetti collaterali?
R: Prodotto naturale molto potente ricco di acidi della frutta: un consumo estremamente eccessivo può provocare un leggero bruciore di stomaco. Si attenga al rituale 1:10 raccomandato.

### 4. Origine, qualità & lavorazione
D: AmberNord è certificato bio?
R: Sì. AmberNord è un importatore biologico ufficialmente accreditato in Svizzera, verificato regolarmente dall'organismo indipendente ProCert (CH-BIO-038), secondo le più severe linee guida svizzere.
D: Cosa distingue l'elisir AmberNord?
R: Un'essenza grezza 100% pura e non diluita da bacche raccolte a mano. Coltiviamo esclusivamente una mono-varietà premium selezionata per il massimo contenuto di olio e nutrienti, senza varietà industriali di massa.
D: Come viene raccolto l'olivello spinoso?
R: La raccolta è complessa perché le bacche scoppiano e si ossidano rapidamente. Il nostro partner punta esclusivamente sulla raccolta manuale da oltre 100 stagionali, proteggendo la pianta e garantendo la qualità dei lipidi nativi.
D: Le vitamine restano integre?
R: Le bacche raccolte a mano vengono spremute a freddo e poi pastorizzate molto delicatamente — elimina i germi senza degradazione termica. Acidi grassi Omega e vitamina C restano intatti.
D: Cosa significa il vostro approccio a rifiuti zero?
R: Un processo senza residui: bucce e semi macinati in polvere ricca di fibre; foglie (antiossidante PC-8) usate in tè. Utilizziamo il 100% della biomassa.
D: Perché bottiglie di vetro?
R: Il vetro è neutro al gusto, non rilascia microplastica e protegge i componenti bioattivi.
D: Quando riceverò il mio elisir?
R: Spedizione dal nostro centro logistico di Aarau, di norma entro 1-3 giorni lavorativi.

### 5. Ordine & spedizione
D: Quanto costa la spedizione e in quanto tempo consegnate?
R: Spedizione in 24 h da Aarau. The Habit, The Protocol e The Master Box: spedizione gratuita in Svizzera. The Starter: spese di spedizione escluse (indicate al checkout). Consegniamo solo in Svizzera e Liechtenstein.
D: Come funziona la garanzia soddisfatti o rimborsati di 30 giorni?
R: Contattateci per e-mail entro 30 giorni dal ricevimento con il numero d'ordine — riceverete il prezzo di una bottiglia, senza motivazione né reso (primo ordine, una volta per nucleo familiare).
D: Quali metodi di pagamento accettate?
R: TWINT, Visa, Mastercard, Apple Pay, Google Pay e PayPal — criptati tramite Stripe.
D: Come posso modificare o disdire l'abbonamento?
R: In qualsiasi momento, senza preavviso: tramite il link nella conferma d'ordine o per e-mail. La prossima consegna non ancora spedita viene sospesa.
D: AmberNord è adatto in gravidanza, allattamento o in caso di assunzione di farmaci?
R: L'olivello spinoso è un alimento. In gravidanza, allattamento o assunzione regolare di farmaci, discutete le nuove abitudini alimentari con il vostro medico.
D: A partire da quale età è adatto l'elisir?
R: Come normale alimento è adatto a tutta la famiglia; per i bambini consigliamo una diluizione maggiore secondo il gusto.
D: Come conservo la bottiglia dopo l'apertura?
R: In frigorifero, da consumare entro 10 giorni — senza conservanti artificiali.`;

// ===========================================================================
// Picks COMMON + one language block. 'en' and unknown -> German (the model is
// instructed to reply in the user's language, translating as needed).
const LANG_BLOCKS = { de: KNOWLEDGE_DE, fr: KNOWLEDGE_FR, it: KNOWLEDGE_IT };

export function buildKnowledge(lang) {
  const key = String(lang || 'de').slice(0, 2).toLowerCase();
  const block = LANG_BLOCKS[key] || KNOWLEDGE_DE;
  return KNOWLEDGE_COMMON + '\n\n' + block;
}

// Back-compat: a full bundle (all languages) if ever needed.
export const KNOWLEDGE = [KNOWLEDGE_COMMON, KNOWLEDGE_DE, KNOWLEDGE_FR, KNOWLEDGE_IT].join('\n\n');
