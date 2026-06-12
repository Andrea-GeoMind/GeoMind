# AUDIT COMPLET GEOMIND — Phase 1

> **Date** : 12 juin 2026
> **Méthode** : 5 explorations exhaustives du codebase (produit/conversion, UX/UI, fonctionnalités, technique/sécurité, SEO/GEO du site) + 1 étude de marché concurrentielle (web) + vérifications code (typecheck ✅ 0 erreur, ESLint ✅ propre, **511/511 tests unitaires verts**).
> **Légende** : ✅ bon tel quel · ⚠️ à améliorer · ❌ à corriger/supprimer · ➕ à ajouter
> **Priorités** : P0 critique · P1 fort impact · P2 nice-to-have
> **Effort** : S (< ½ jour) · M (½–2 jours) · L (> 2 jours)

---

## 0. SYNTHÈSE EXÉCUTIVE

**Le produit est solide, le marché est réel, mais GeoMind raconte aujourd'hui trois histoires incohérentes (landing / pricing / CGV), n'applique pas ses propres règles GEO à son propre site, et repose sur une sécurité base de données incomplète.**

### Les 5 constats majeurs

1. **💥 Conversion : la landing tue la vente.** Landing = 3 plans, Pro 49 €, "4 analyses/mois". Pricing réel = 4 plans, Pro 59 €, système de crédits. CGV = encore les plans V1. Un prospect qui compare abandonne (perception d'arnaque). **C'est le bug n°1 du produit.**
2. **🔓 Sécurité : 13 tables sur 18 sans RLS.** L'isolation des données ne tient que par les checks applicatifs — en violation de la règle n°11 du CLAUDE.md. Un refactoring malheureux expose les données clients.
3. **👞 Le cordonnier est mal chaussé.** geomind.fr viole ~11 de ses propres règles GEO : pas de robots.txt, pas de sitemap, pas de llms.txt, zéro Open Graph, zéro JSON-LD (alors que la landing a une FAQ de 8 questions !), pas de page À propos, pas de blog. Auto-score estimé : **55-60/100**. Indéfendable pour un outil qui vend exactement ça.
4. **🔬 Méthodologie : promesse > réalité.** Les "citations dans ChatGPT" sont mesurées via des API (gpt-4o-mini-search via OpenRouter ≠ ChatGPT web), sur seulement 3 prompts neutres, sans aucune mesure de variance entre deux runs. Étude SparkToro 01/2026 : < 1 % de chance que ChatGPT donne deux fois la même liste de marques. Risque de backlash client ("mon score a bougé de 12 points sans rien faire").
5. **🎯 Marché : le créneau est vacant et c'est le vôtre.** Le marché GEO explose (1 → 17 Md$ d'ici 2034, consolidation Adobe/Semrush, HubSpot/xFunnel). Tous les concurrents — y compris les français BotRank (75 €), Qwairy (59 €, en anglais), Hikoo (69 €) — parlent à des experts SEO et n'ont pas de plan gratuit. **Le segment "TPE française non-experte, < 50 €, en français, qui veut qu'on lui dise quoi faire et qu'on le fasse pour elle" n'est servi par personne.** GeoMind (freemium + coach pédagogique + plan d'action) est déjà le mieux placé — à condition de pousser la logique jusqu'au bout : générer les correctifs, pas seulement les diagnostiquer.

### Ce qui est déjà très bon (à ne pas toucher)

- **Coach GEO** : le meilleur composant du produit. Voix calibrée, anti-injection, mémoire compressée, suggestions contextuelles. Aucun concurrent SMB n'a ça.
- **Orchestration Inngest** : 7 étapes, scores atomiques, remboursement auto des crédits en cas d'échec.
- **Système de crédits** : atomique (SQL conditionnel), transparent, centralisé dans `lib/plans.ts`.
- **57 règles GEO (31 tech + 26 contenu)** : couverture E-E-A-T moderne, scoring plafonné sain, déterministe.
- **Hygiène de code** : TypeScript strict 0 erreur, lint propre, 511 tests verts, env validée par Zod.
- **Onboarding** : 3 étapes fluides, value prop immédiate, édition libre du profil GEO.

---

## 1. PRODUIT & PROPOSITION DE VALEUR

| # | Constat | Verdict | Priorité | Effort |
|---|---------|---------|----------|--------|
| 1.1 | Headline "Vos clients cherchent dans ChatGPT. Êtes-vous trouvable ?" — claire en 5 s, même pour un non-expert | ✅ | — | — |
| 1.2 | FAQ landing pédagogique (8 Q/R, vulgarise GEO, adresse les objections) | ✅ | — | — |
| 1.3 | **Incohérence landing ↔ pricing ↔ CGV** : 3 plans/49 € vs 4 plans/59 € vs plans V1 dans les CGV ([page.tsx:325](app/(marketing)/page.tsx), [cgv/page.tsx:31](app/(marketing)/legal/cgv/page.tsx)) | ❌ | **P0** | S |
| 1.4 | Landing parle encore en quotas ("4 analyses/mois") alors que le produit est passé aux crédits | ❌ | **P0** | S |
| 1.5 | ROI jamais démontré : aucun cas d'usage concret (plombier, boutique…), aucun avant/après, aucun chiffre | ➕ | P1 | M |
| 1.6 | Aucun comparatif "GEO vs SEO" ni "vs Semrush/Ahrefs" — l'objection n°1 d'un marketeur n'est pas traitée | ➕ | P1 | S |
| 1.7 | Preuve sociale générique ("2 400+ sites", "4,8/5 Trustpilot") sans aucun témoignage nommé | ⚠️ | P1 | M* |
| 1.8 | Jargon résiduel : badge "Audit GEO" non expliqué avant la FAQ ; "prompts" jamais défini côté marketing | ⚠️ | P1 | S |
| 1.9 | Promesse "60 secondes" vs réalité ~3 min (crawl 20-40 s + analyse 2-4 min) — honnêteté à ajuster | ⚠️ | P2 | S |
| 1.10 | **Méthodologie survendue** : "testé dans ChatGPT/Claude/Gemini" alors que ce sont des API ≠ interfaces web. Aucun disclaimer | ❌ | **P0** | S |

\* M si témoignages réels disponibles ; sinon dépend de l'acquisition de premiers clients.

**Impact attendu** : la correction de 1.3 + 1.4 seule élimine le point d'abandon principal du tunnel. L'ajout de 1.5 + 1.6 répond aux deux objections types (patron TPE : "c'est utile pour moi ?" ; marketeuse PME : "pourquoi pas Ahrefs ?").

---

## 2. UX / UI

| # | Constat | Verdict | Priorité | Effort |
|---|---------|---------|----------|--------|
| 2.1 | Auth (login/signup/reset/verify) : validation claire, messages précis, friction minimale | ✅ | — | — |
| 2.2 | Onboarding 3 étapes + modal plein écran avec progression : excellent flow | ✅ | — | — |
| 2.3 | **Erreurs avalées en silence pendant crawl/analyse** : `.catch(() => {/* silencieux */})` dans [OnboardingFlowModal.tsx:329](components/features/onboarding/OnboardingFlowModal.tsx) — pas de timeout visible, l'utilisateur peut attendre indéfiniment et part | ❌ | **P0** | M |
| 2.4 | Messages d'erreur d'analyse génériques ("Une erreur inattendue est survenue") sans cause ni action | ⚠️ | P1 | M |
| 2.5 | **Jargon brut dans les issues** : "Missing canonical tag", "Schema.org markup missing", "Heading hierarchy broken" — aucune explication inline pour un non-dev (5-7 termes par page) | ⚠️ | P1 | M |
| 2.6 | Tableau de citations sans légende (✓/⚠/✗ non expliqués) | ⚠️ | P1 | S |
| 2.7 | Coût en crédits jamais affiché au moment d'agir ("Relancer l'analyse" ne dit pas "−400 crédits") | ⚠️ | P1 | S |
| 2.8 | **Sidebar non repliable sur mobile** (fixe ~256 px) — écrase le contenu < 640 px ; pas de test mobile documenté | ⚠️ | P1 | M |
| 2.9 | Bandeau Discovery trop dense (2 phrases techniques sur la neutralité des prompts) | ⚠️ | P2 | S |
| 2.10 | Coach GEO : voix, suggestions, mémoire, état verrouillé pendant analyse — remarquable | ✅ | — | — |
| 2.11 | Empty states tous soignés (dashboard, issues, coach, publishers) | ✅ | — | — |
| 2.12 | Design system cohérent (tokens, dark mode, gradients indigo/violet) ; accessibilité de base correcte (labels, focus, aria-live) | ✅ | — | — |
| 2.13 | Onglet "GEO" ambigu (c'est le coach) → renommer "Coach" ou "Assistant" | ⚠️ | P2 | S |
| 2.14 | Pas de connexion Google/OAuth (mot de passe = friction + oublis) | ➕ | P2 | M |

**Impact attendu** : 2.3 est le seul vrai "tueur silencieux" — un crawl qui échoue au premier essai = client perdu à jamais. 2.5 + 2.6 + 2.7 réduisent la friction principale pour la cible non-experte.

---

## 3. FONCTIONNALITÉS (garder / améliorer / supprimer / ajouter)

### Existantes

| Fonctionnalité | Verdict | Détail | Priorité | Effort |
|---|---|---|---|---|
| Découverte (description, keywords, concurrents, prompts) | **Garder** ⚠️ | Bon concept ; mais **3 prompts seulement** = fiabilité statistique faible | P1 | M |
| Autorité (4 moteurs, parsing citations) | **Améliorer** ❌ | API ≠ web réel ; variance inter-runs jamais mesurée ; score présenté comme exact | **P0** (disclaimer + test variance) | S+M |
| Règles techniques (31) | **Garder** ✅ | Excellente couverture ; afficher "X pages analysées sur Y détectées" (biais d'échantillonnage invisible) | P1 | S |
| Règles contenu (26) | **Garder** ✅ | E-E-A-T moderne ; pattern-matching parfois naïf (stats par regex) — acceptable en V1 | P2 | L |
| Scoring (4 notes, labels maturité, comparaison N vs N-1) | **Garder** ✅ | Mathématiquement sain, pur, testé | — | — |
| Coach GEO | **Garder** ✅➕ | Le différenciateur. Manque : boucle de feedback ("as-tu appliqué ma reco ? je revérifie") | P1 | M |
| Publishers (15 par secteur) | **Améliorer** ⚠️ | Liste brute sans priorisation ni moyen de contact — valeur réelle limitée | P1 | M |
| Recommandations IA | **Garder** ⚠️ | Vérifier le branchement complet UI ↔ données générées | P1 | S |
| Crédits + plans | **Garder** ⚠️ | Solide techniquement ; 4 plans = trop pour la cible (standard marché : 3) ; packs 3-6× plus chers que l'abo | P2 | S |
| PWA Serwist | **Interroger** ⚠️ | Quelle valeur pour la cible ? Coût de maintenance vs usage réel à mesurer (PostHog) | P2 | — |

### À ajouter — par ordre d'impact différenciant

| ➕ Fonctionnalité | Pourquoi | Priorité | Effort |
|---|---|---|---|
| **Suivi récurrent automatique** (réanalyse mensuelle/hebdo + email de tendance) | Transforme l'outil "one-shot" en abonnement justifié. Table stakes chez tous les concurrents. **La rétention en dépend.** | **P0** | M |
| **Graphe de tendance historique** (scores sur 5-10 analyses) | La réponse honnête à la crise de la mesure : "tendance 30 jours" > score du jour. Quick win, données déjà en base | P1 | S |
| **Correctifs générés, pas seulement diagnostiqués** : bouton "Générer mon fichier" (JSON-LD prêt à coller, llms.txt, FAQ réécrite, meta descriptions) | LA tendance 2026 ("measurement without action is theater") et LE gap pour les non-experts. Le coach sait déjà le faire en chat — le productiser | **P1** | M-L |
| **Alertes email** ("vous venez d'être cité !", "votre score a baissé") | Table stakes concurrentiel ; Resend déjà en place | P1 | M |
| **Export PDF** (standard Pro, white-label Business) | Déjà vendu dans le pricing (!) — actuellement introuvable. Débloquerait le persona agence/freelance | P1 | M-L |
| **Score comparé aux concurrents** (audit léger des concurrents détectés → "vous êtes 3e sur 5") | Les concurrents sont déjà détectés mais inexploités. Fort levier émotionnel ("mon concurrent est cité, pas moi") | P1 | L |
| **Mistral / Le Chat comme 5e moteur** | Seul BotRank le fait. Argument "100 % français" cohérent avec le positionnement | P2 | M |
| **Tracking des crawlers IA** (GPTBot, ClaudeBot, PerplexityBot dans les logs) | Différenciateur Profound/Scrunch, rare en SMB ; preuve tangible que "ça marche" | P2 | L |
| **Sentiment des mentions** | Présent chez quasi tous les concurrents — gap table-stakes à terme | P2 | M |
| **Plugin WordPress** | Stickiness ×5 pour la cible TPE (majorité sous WP) | P2 | L |

### À ne PAS faire (pièges)

- ❌ Course au nombre de moteurs/prompts (course aux armements capitalistique — Profound a levé 155 M$).
- ❌ Panel data / enterprise (SOC2, SSO) — pas votre segment.
- ❌ Scraping headless des vraies interfaces ChatGPT/Claude : 10× le coût, contraire aux ToS. Le bon fix est l'honnêteté méthodologique (disclaimer + tendances), pas la fraude technique.

---

## 4. CONVERSION & BUSINESS

| # | Constat | Verdict | Priorité | Effort |
|---|---------|---------|----------|--------|
| 4.1 | Freemium réel (1 analyse gratuite sans CB) — quasi unique sur le marché FR, arme d'acquisition n°1 | ✅ | — | — |
| 4.2 | Positionnement prix : sous TOUS les concurrents FR (Cockpyt 49 €, Qwairy 59 €, Hikoo 69 €, BotRank 75 €) | ✅ | — | — |
| 4.3 | Cohérence des prix entre pages (cf. 1.3) | ❌ | **P0** | S |
| 4.4 | Crédits opaques côté marketing ("500 crédits" = ? pour un patron) → toujours traduire en "≈ X analyses" | ⚠️ | P1 | S |
| 4.5 | Différenciation Solo vs Pro vs Business pas racontée en bénéfices métier ("pour qui ?") | ⚠️ | P1 | S |
| 4.6 | Pas d'essai Pro temporaire (7 j) — le free → paid n'a pas de pont | ➕ | P1 | M |
| 4.7 | Pas de lead magnet (guide PDF gated, audit minute par email) — zéro nurturing | ➕ | P2 | M |
| 4.8 | Toggle annuel −20 % + FAQ billing : bien fait | ✅ | — | — |
| 4.9 | Packs de crédits affichés "Bientôt disponible" — soit livrer, soit retirer | ⚠️ | P1 | S |

**Positionnement recommandé** (issu de l'étude de marché) : *« Le seul outil de visibilité IA pensé pour les patrons, pas pour les experts SEO. En français, gratuit pour commencer, et il fait le travail avec vous. »* Trois piliers : prix/freemium, pédagogie radicale, action automatisée (correctifs générés).

---

## 5. TECHNIQUE (architecture, sécurité, dette)

### Sécurité

| # | Constat | Gravité | Priorité | Effort |
|---|---------|---------|----------|--------|
| 5.1 | **RLS absente sur 13 tables** (`sites`, `analyses`, `prompts`, `recommendations`, `coach_messages`…) — seules 5 tables sur 18 protégées. Violation règle CLAUDE.md n°11 | 🔴 Critique | **P0** | S-M |
| 5.2 | **Contenu crawlé injecté dans les prompts LLM sans isolation** ([discovery.ts](lib/ai/prompts/discovery.ts)) — prompt injection possible depuis n'importe quelle page web analysée. (Le coach, lui, est bien protégé avec `<donnees_site>`) | 🔴 Critique | **P0** | S |
| 5.3 | **Webhooks Stripe abonnements sans idempotence** : un replay de `customer.subscription.updated` peut dupliquer les crédits mensuels ([webhooks/route.ts](app/api/stripe/webhooks/route.ts)). Les packs sont, eux, idempotents | 🟡 Élevé | **P0** | M |
| 5.4 | Réponses des moteurs IA stockées sans validation Zod (violation règle n°8) | 🟡 Élevé | P1 | S |
| 5.5 | Pas de réservation de crédits avant déclenchement Inngest (race condition légère) | 🟡 Élevé | P1 | M |
| 5.6 | Rate limiting coach par user seulement (30/h) ; pas de circuit breaker OpenRouter | 🟡 Élevé | P1 | M |
| 5.7 | Aucune table d'audit pour les mutations sensibles (suppression compte, refunds) | 🟠 Moyen | P2 | M |
| 5.8 | Ownership checks applicatifs systématiques, aucun secret côté client, env validée | ✅ | — | — |

### Architecture & dette

| # | Constat | Verdict | Priorité | Effort |
|---|---------|---------|----------|--------|
| 5.9 | Respect des règles CLAUDE.md : LLM via Inngest only, quotas serveur, prompts centralisés, scoring pur | ✅ | — | — |
| 5.10 | Refund tout-ou-rien : échec à l'étape 7/7 rembourse 400 crédits alors que 6 étapes ont coûté | ⚠️ | P2 | M |
| 5.11 | `lib/db/schema.ts` monolithique (568 lignes) | ⚠️ | P2 | S |
| 5.12 | Détection post-hoc des prompts non-neutres incomplète (générés par LLM, le flag est figé à la génération) | ⚠️ | P2 | M |
| 5.13 | Tests : 511 unitaires verts + e2e Playwright réels | ✅ | — | — |

---

## 6. SEO / GEO DU SITE LUI-MÊME ("le cordonnier")

**geomind.fr viole ses propres règles.** Table de correspondance règle produit → propre site :

| Règle que GeoMind vérifie chez ses clients | geomind.fr la respecte ? | Priorité | Effort |
|---|---|---|---|
| robots.txt présent | ❌ absent | **P0** | S |
| Sitemap XML | ❌ absent | **P0** | S |
| llms.txt | ❌ absent | P1 | S |
| Schema.org FAQPage (la landing a 8 Q/R !) | ❌ absent | **P0** | S |
| Schema.org Organization | ❌ absent | P1 | S |
| Open Graph | ❌ absent | P1 | S |
| Twitter Card | ❌ absent | P2 | S |
| Meta description par page (pricing, design sans metadata) | ❌ partiel | P1 | S |
| Canonical / metadataBase | ⚠️ implicite | P2 | S |
| Page À propos (E-E-A-T) | ❌ absente | P1 | M |
| Couverture thématique (blog, guides) | ❌ 6 pages, zéro contenu | P1 | L |
| Dates de publication | ❌ absentes | P2 | S |
| H1 unique, hiérarchie hn, lang, viewport, fonts | ✅ | — | — |

**Impact** : au-delà du référencement, c'est un argument de vente — "passez geomind.fr dans GeoMind" doit donner 95+, pas 55. Et un risque inverse : un prospect malin qui teste le site de l'outil dans l'outil découvre l'incohérence.

---

## 7. MARCHÉ & CONCURRENCE (résumé de l'étude web)

- **Marché** : ~1,5 Md$ en 2026, CAGR ~45 %. Consolidation : Adobe/Semrush (1,9 Md$), HubSpot/xFunnel, Cision/Trajaan. Fenêtre favorable aux niches locales.
- **Enterprise** (Profound 2 000 $+, Scrunch 250 $+, Evertune 3 000 $, Bluefish) : hors segment, ne pas concourir.
- **Mid-market** (Peec 85 €, Otterly 29 $, AthenaHQ 295 $, Rankscale 20 €) : self-serve mais pensés pour des SEO-savvy ; Peec est explicitement critiqué comme "tracking, not optimization".
- **Français** : BotRank 75-89 € (le plus complet, agent "Bob"), Qwairy 59 € (excellent mais interface en anglais), Hikoo 69 €, Cockpyt 49 €, Meteoria 75 €. **Aucun plan gratuit, tous orientés experts.**
- **Table stakes** que GeoMind n'a pas encore : tendance temporelle, alertes, sentiment, rapports exportables, suivi concurrents scoré.
- **Tendances 2026** : passage de la mesure à l'action (correctifs auto), commerce agentique, agent analytics, crise du non-déterminisme (pédagogie honnête = opportunité).

---

## 8. PLAN PRIORISÉ CONSOLIDÉ

### 🔴 P0 — Critique (bloquant scale/vente) — ~1 semaine

| # | Action | Domaine | Effort |
|---|--------|---------|--------|
| P0-1 | Aligner landing + CGV sur les plans V2 réels (4 plans, 19/59/149 €, crédits traduits en analyses) | Conversion/Légal | S |
| P0-2 | RLS policies sur les 13 tables manquantes | Sécurité | S-M |
| P0-3 | Isoler le contenu crawlé en balises `<donnees_site>` dans les prompts discovery | Sécurité | S |
| P0-4 | Idempotence webhooks Stripe sur les événements subscription | Sécurité | M |
| P0-5 | robots.txt + sitemap.ts + JSON-LD FAQPage + Open Graph sur geomind.fr | SEO/GEO | S |
| P0-6 | Timeout + erreurs visibles dans le modal d'onboarding (fin des catch silencieux) | UX | M |
| P0-7 | Disclaimer méthodologie ("mesures via API, tendance > score instantané") + test de variance documenté (1 site × 3 runs) | Produit/Confiance | S+M |

### 🟠 P1 — Fort impact (différenciation & rétention) — ~3-4 semaines

| # | Action | Domaine | Effort |
|---|--------|---------|--------|
| P1-1 | Suivi récurrent automatique (réanalyse planifiée + email tendance) | Feature/Rétention | M |
| P1-2 | Graphe de tendance historique des scores | Feature | S |
| P1-3 | Correctifs générés en un clic (JSON-LD, llms.txt, FAQ, metas) | Feature/Différenciation | M-L |
| P1-4 | Tooltips de vulgarisation sur tous les titres d'issues + légende citations + coûts crédits affichés | UX | M |
| P1-5 | Cas d'usage TPE/PME/freelance + comparatif "GEO vs SEO/Ahrefs" sur la landing | Conversion | M |
| P1-6 | Export PDF (déjà vendu dans le pricing !) | Feature | M-L |
| P1-7 | Alertes email (cité / score en baisse / analyse terminée) | Feature | M |
| P1-8 | Messages d'erreur d'analyse contextualisés (timeout, site inaccessible, rate limit) | UX | M |
| P1-9 | Page À propos + metadata pricing + llms.txt + Schema Organization | SEO/GEO | M |
| P1-10 | Validation Zod des réponses moteurs + réservation crédits avant Inngest | Technique | M |
| P1-11 | Sidebar mobile repliable + passe responsive (iPhone SE, iPad) | UX | M |
| P1-12 | Publishers priorisés avec mode de contact | Feature | M |
| P1-13 | Transparence échantillonnage ("5 pages analysées sur 47") | Produit/Confiance | S |
| P1-14 | Essai Pro 7 jours + clarification "pour qui" de chaque plan | Business | M |

### 🟡 P2 — Nice to have (après P0+P1)

Blog/guides GEO (L) · Score comparé concurrents (L) · Mistral/Le Chat 5e moteur (M) · Sentiment (M) · Tracking crawlers IA (L) · OAuth Google (M) · Lead magnet PDF (M) · Réduction 4→3 plans à étudier (S) · Refund prorata (M) · Split schema.ts (S) · Table d'audit (M) · Renommer onglet "GEO" → "Coach" (S) · Plugin WordPress (L) · Vidéo démo 60 s (L, externalisable)

---

## 9. QUESTIONS OUVERTES À ARBITRER ENSEMBLE

1. **Méthodologie Authority** : disclaimer honnête + bascule vers "tendance 30 jours" (recommandé), ou investissement lourd pour se rapprocher du réel ?
2. **3 prompts neutres** : c'est peu. Monter à 5-10 prompts (coût ×2-3 par analyse) pour fiabiliser le score ?
3. **4 plans ou 3** : garder Solo 19 € comme pont freemium → payant, ou simplifier ?
4. **PWA Serwist** : conserver ou retirer (mesurer l'usage réel avant) ?
5. **Témoignages** : en avez-vous de réels ? Les chiffres "2 400+ sites / 4,8 Trustpilot" sont-ils vrais ? (S'ils sont factices : à retirer d'urgence, risque légal et réputationnel.)
6. **Blog** : qui produit le contenu (vous, IA assistée, externalisé) ?
