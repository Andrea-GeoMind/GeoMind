# PROGRESS — `GEOMIND`

Fichier d'état persistant. **Source de vérité** : cocher ici = ticket terminé, committé, pushé, audité.

---

## État global

Tous sprints terminés. TKT-001 à TKT-033 terminés. geomind.fr est en production sur Vercel (cdg1), domaine validé, E2E smoke 10/10 ✅. Sentry DSN réel, PostHog EU réel, Inngest synced geomind.fr ✅. Reste : Stripe Live (bloqué SIRET), Perplexity (déféré).

---

## Sprint 1 — Fondations (Semaine 1)

### Décisions arbitrées (2026-05-11)

| # | Décision | Conséquence |
|---|----------|-------------|
| 1 | pnpm installé via corepack (v11.0.9) | Pas de conflit avec le node_modules global |
| 2 | Composants shadcn/ui créés manuellement (CLI bloqué par nom de dossier) | components.json présent, shadcn CLI utilisable pour la suite |
| 3 | `typedRoutes` déplacé de `experimental` vers root config (Next.js 15.5) | Supprime le warning au démarrage |

### Tickets

- [x] **TKT-001** — Setup initial (Next.js 15, TypeScript strict, Tailwind, shadcn/ui, ESLint, Prettier, pnpm)
- [x] **TKT-002** — Validation des variables d'environnement (Zod + lib/env.ts + .env.example)
- [x] **TKT-003** — Setup Supabase + Drizzle + schéma initial + RLS (2026-05-12)
- [x] **TKT-004** — Supabase Auth + clients SSR + Resend transactionnel (2026-05-12)
- [x] **TKT-005** — Layouts marketing / auth / app + Sidebar + garde auth (2026-05-12)

---

## Sprint 2 — Sites et crawl (Semaine 2)

### Tickets

- [x] **TKT-006** — CRUD sites + quotas plan + Server Actions (2026-05-12)
- [x] **TKT-007** — Wrapper Firecrawl + table firecrawl_pages (2026-05-12)
- [x] **TKT-008** — Setup Inngest + fonction crawl-site (2026-05-12)

---

## Sprint 3 — Analyse de découverte (Semaine 3)

### Tickets

- [x] **TKT-008.5** — Design system GEOMIND : tokens CSS globals.css, Figtree+JetBrains Mono, logos SVG, favicon.svg, 4 composants signatures aux bons chemins (ScoreGauge, ScoreCard, NeutralPromptBadge, IssueSeverityBadge) + page démo /design (2026-05-12)
- [x] **TKT-010** — Connecteurs LLM 4 IAs + parse + cost (2026-05-12)
- [x] **TKT-009** — Wizard onboarding 3 étapes : StepProgress, WelcomeStep, AddSiteStep, page orchestratrice `?step=1|2|3`, Server Action crée site + émet events Inngest (2026-05-12)
- [x] **TKT-011** — Analyse de découverte Inngest : tables site_metadata/competitors/prompts, callStructured (Zod+retry), prompts versionnés, détection neutralité, runDiscoveryFunction (2026-05-12)
- [x] **TKT-012** — UI édition découverte : page /sites/[siteId]/discovery, 4 éditeurs client (description autosave, keywords chips, competitors add/delete, prompts add/delete + badge neutralité temps réel), Server Actions Zod + ownership, banner pédagogique (2026-05-12)
- [x] **TKT-013** — Bouton lancer analyse : tables analyses/authority_results/authority_sources, canRunFullAnalysis quota, runAnalysisAction (ownership+quota+createAnalysis+inngest.send), RunAnalysisButton (toast succès + redirect /overview), Inngest function run-authority-analysis (boucle prompts neutres × 4 IAs, pool ≤8 concurrents, détection isClientDomain), 123 tests verts — PR #5 merged (2026-05-13)
- [x] **TKT-014** — Orchestrateur Inngest run-full-analysis : crawl → discovery (skip si site_metadata existe) → authority → technical + content (parallèle) → recommendations → scoring → publishers, updateAnalysisScores atomique, quota non décrémenté en cas d'erreur, computeScores pure function, stubs technical/content/publishers/recommendations, 129 tests verts — PR #6 merged (2026-05-13)
- [x] **TKT-015** — Analyse autorité : boucle N prompts neutres × 4 IAs (pool ≤8 concurrents), stockage authority_results + authority_sources, détection isClientDomain, log erreurs IA (continue sans lever), fix estimation coût batch (N×4 appels, modèles exacts par engine), 129 tests verts — PR #7 merged (2026-05-13)
- [x] **TKT-016** — Scoring : 4 fonctions pures (computeAuthorityScore, computeTechnicalScore, computeContentScore, computeGlobalScore), computeScores refactorisé, updateAnalysisTechnicalScore + updateAnalysisContentScore DB, scores persistés après chaque sous-analyse dans run-full-analysis, 150 tests verts (27 nouveaux) — PR #8 merged (2026-05-13)
- [x] **TKT-017** — Page Vue d'ensemble : ScoreGauge lg (score global), 3 ScoreCards cliquables (autorité/technique/contenu) avec delta vs analyse précédente, OverviewPolling (router.refresh toutes les 5s pendant pending|running), skeletons pendant analyse en cours, computeDeltas pure function, layout site avec tab nav, 154 tests verts — PR #9 merged (2026-05-13)
- [x] **TKT-018** — Onglet Autorité : helpers purs buildEngineStats/buildCrossTable, bar chart CSS par moteur IA, tableau croisé prompts × IAs scrollable (✅/❌/⚠️), dialog réponse complète avec domaine client surligné en vert, bouton relancer avec check quota, page Server Component avec machine d'états complète, 160 tests verts — PR #10 merged (2026-05-13)
- [x] **TKT-019** — 16 règles GEO technique : technicalIssueCategoryEnum + table technical_issues, 16 règles pures (accessibility/structure/schema_org/performance/network), runner runTechnicalAnalysis({ siteId, analysisId }) avec Promise.all + insertTechnicalIssues, Inngest caller mis à jour, js_required_for_content hors scope, 246 tests verts — PR #11 merged (2026-05-13)
- [x] **TKT-020** — onglet Technique : issues groupées par catégorie (Accessibilité/Structure/Schema.org/Performance), IssueCard cliquable avec badge sévérité, RecommendationSheet latéral (how/impact/effort pour 16 règles), overlay upgrade plan Free, getTechnicalIssuesByAnalysisId query — PR #12 merged (2026-05-13)
- [x] **TKT-021** — 10 règles GEO contenu : contentIssueCategoryEnum + table content_issues, 10 règles pures (readability/metadata/structure/coverage), runner runContentAnalysis({ siteId, analysisId }) avec Promise.all + insertContentIssues, migration 0002_content_issues.sql, fix Inngest caller, 289 tests verts (43 nouveaux) — PR #13 merged (2026-05-13)

---

## Sprint 5 — Contenu + Coach IA + Publishers (Semaine 5)

### Tickets

- [x] **TKT-022** — onglet Contenu : issues groupées par catégorie (Lisibilité/Métadonnées/Structure/Couverture), ContentIssueCard cliquable avec badge sévérité, ContentRecommendationSheet latéral (how/impact/effort pour 10 règles), overlay upgrade plan Free, getContentIssuesByAnalysisId query, CONTENT_RECOMMENDATIONS statiques — livré dans HOTFIX PR #14
- [x] **TKT-023** — table `recommendations` polymorphe (enum issue_type + unique issue_id/variant), migration 0003, prompt Markdown 3 sections par issue, RecommendationOutputSchema Zod, generateRecommendations (pool ≤5 Haiku, log coût, onConflictDoNothing), 292 tests verts — PR #15 merged (2026-05-14)
- [x] **TKT-024** — toggle "Version complète" Business : Server Action generateCompleteRecommendation (vérifie plan + ownership + cache DB), génère via Sonnet si absente, bouton toggle dans RecommendationSheet + ContentRecommendationSheet (désactivé badge Business pour Free/Pro), 292 tests verts — PR #16 merged (2026-05-14)
- [x] **TKT-025** — feature publishers : table `publishers` + enum `publisher_category`, detectPublishers() Haiku structured output (15 publishers : 5 médias FR / 5 communautés / 5 bases publiques, chacun avec pitch_angle), PublishersList (Free : 3 visibles reste flouté), onglet Publishers dans layout, migration DB appliquée, 292 tests verts — PR #17 merged (2026-05-14)
- [x] **TKT-026** — polling état analyse + toast notification : hook useToast + Toaster dans root layout, OverviewPolling déclenche toast succès/erreur sur transition de statut, RetryAnalysisButton dans bannière d'erreur, skeleton loaders in-progress, 292 tests verts — PR #18 merged (2026-05-14)
- [x] **TKT-027** — Stripe checkout, customer portal et webhooks : lib/stripe.ts (client v22 dahlia), subscriptions queries (upsert/cancel/lookup), Server Actions createCheckoutSession + createPortalSession, webhook route (subscription.created/updated/deleted + invoice.payment_succeeded/failed), page billing complète, 292 tests verts — PR #19 merged (2026-05-14)
- [x] **TKT-028** — quotas système complets + page Usage : lib/quotas.ts complété (canRunTabAnalysis, getRemainingAnalysesThisMonth, getSitesUsage, getUsageStats), page settings/usage avec barres de progression et alertes visuelles, 19 tests unitaires (311 verts) — PR #20 merged (2026-05-14)
- [x] **TKT-029** — PWA setup : @serwist/next + serwist, manifest.json (icônes 192/512/maskable/apple-touch), app/sw.ts (précache + runtime cache), next.config.mjs wrappé withSerwist, viewport themeColor, components/install-prompt.tsx (banner après 30s), 311 tests verts — PR #21 merged (2026-05-14)
- [x] **TKT-030** — pages légales + bannière cookies : CGV, Mentions légales (SIRET placeholder), Confidentialité RGPD, Cookies ; posthog-js + PostHogProvider (init conditionnel au consentement), CookieBanner (essentiels / analytics), CookieConsentButtons sur page cookies ; fix TS stripe.ts + plans.ts — commit f5213bb (2026-05-14)
- [x] **TKT-031.5** — polish pass UI avant production : landing page (H1 question-format, stats 2400+/4 IA/4,8/5, section « Comment ça marche » 3 étapes, CTA 60s sans CB), dashboard empty state + padding mobile p-4 sm:p-8, NoAnalysisState composant partagé (4 onglets), RetryAnalysisButton sur authority, ScoreGauge animation entrée arc-fill, CitationsTable sticky colonne 1 + hover lignes + scale icônes + hint scroll mobile, RunAnalysisButton Loader2 spinner + pulse overlay + bannière succès, SiteTabs active state, onboarding card responsive p-6 sm:p-8, pricing page complète 3 plans, zero-issue empty state (CheckCircle2) — prototype Claude Design HF (5 sections) — PR #23 + PR #24 + fix direct merged (2026-05-14)
- [x] **TKT-031** — observabilité production + QA : @sentry/nextjs configuré (client/server/edge + instrumentation.ts + withSentryConfig + user context authentifié), lib/posthog.ts server-side (trackEvent helper + 8 events : signup, site_created, discovery_started, analysis_started, plan_upgrade_started, plan_upgraded), NEXT_PUBLIC_SENTRY_DSN ajouté à env.ts + .env.example, checklist QA 55 items dans tests/qa-checklist.md, 312 tests verts — PR #22 merged (2026-05-14)
- [x] **TKT-032** — deploy production : vercel.json (région cdg1), GitHub App installée (installationId=132437207), repo Andrea-GeoMind/GeoMind connecté, build fix (outputFileTracingRoot supprimé), geomind.fr live sur Vercel cdg1, SSL ✅, Resend SPF/DKIM ✅, Supabase Site URL ✅, E2E smoke 10/10 Chromium ✅ — commits a36aff0 + 38f1515 sur main (2026-05-15)

---

## TKT-032 — Checklist deploy opérationnel

### 1. Vercel ✅
- [x] Repo GitHub `Andrea-GeoMind/GeoMind` connecté (GitHub App installationId=132437207)
- [x] Variables d'env Production saisies (DATABASE_URL, DIRECT_DATABASE_URL, NEXT_PUBLIC_SITE_URL, SUPABASE_*, STRIPE_*, OPENROUTER_*, PERPLEXITY_*, FIRECRAWL_*, INNGEST_*, RESEND_*, SENTRY_*, POSTHOG_*)
- [x] Build Production vert — commit a36aff0 (fix outputFileTracingRoot) — déploiement GNNLM7EsC Ready ✅

### 2. DNS — geomind.fr ✅
- [x] DNS déjà configuré (A record → Vercel, confirmé par `server: Vercel` + `x-vercel-id: cdg1::*`)
- [x] Vercel Domains : `geomind.fr` — Valid Configuration ✅, SSL Let's Encrypt actif ✅

### 3. Resend — SPF/DKIM ✅
- [x] Domaine `geomind.fr` vérifié dans Resend — statut "Verified" ✅

### 4. Supabase — URL de redirection auth ✅
- [x] `Site URL` → `https://geomind.fr` ✅
- [x] `Redirect URLs` → `https://geomind.fr/**` déjà présent ✅

### 5. Stripe (⚠️ bloqué — en attente SIRET auto-entrepreneur)
- [ ] Créer compte Stripe avec SIRET
- [ ] Activer mode Live
- [ ] Créer produit "GeoMind Pro" → prix récurrent 49€/mois → copier `STRIPE_PRO_PRICE_ID`
- [ ] Créer produit "GeoMind Business" → prix récurrent 149€/mois → copier `STRIPE_BUSINESS_PRICE_ID`
- [ ] Créer webhook endpoint `https://geomind.fr/api/stripe/webhooks` → événements : `customer.subscription.*` + `invoice.payment_*`
- [ ] Mettre à jour les 4 variables Stripe dans Vercel (sk_live_, whsec_, price_*×2)

### 6. Inngest ✅
- [x] Environnement Production Inngest actif
- [x] `INNGEST_EVENT_KEY` et `INNGEST_SIGNING_KEY` présents dans Vercel
- [x] Resync app → `https://geomind.fr/api/inngest` — Success 15/05/2026 00:40 ✅

### 7. Tests E2E post-deploy ✅
- [x] 10/10 tests smoke passent sur Chromium (landing, pricing, login, signup, légales ×4, auth-redirects ×2) — 2026-05-15
- [x] Clés Sentry réelles mises en place (SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN + SENTRY_ORG + SENTRY_PROJECT) — 2026-05-15
- [x] Clés PostHog réelles mises en place (NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST EU) — 2026-05-15
- [ ] Vérifier premier event Sentry reçu (après prochaine visite prod)
- [ ] Vérifier premier event PostHog reçu (après prochaine visite prod)

### 8. Clés placeholder à remplacer quand disponibles
- [ ] `PERPLEXITY_API_KEY` — clé réelle (actuellement OpenRouter, Perplexity déféré)
- [x] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` — DSN Sentry réel (ingest.de.sentry.io EU) ✅
- [x] `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` — clés PostHog EU réelles ✅

---

---

## Sprint 7 — V2 produit (post-launch)

- [ ] **TKT-CREDITS** — Système de crédits universel — spec `cahier-des-charges.md` §17 — `credit_balances` + `credit_transactions`, packs Stripe 5€/15€/49€, bonus bienvenue 1000 cr, reset à date anniversaire de facturation, remboursement auto si analyse échoue, badge sidebar + alerte 20% + équivalences humaines
- [ ] **TKT-PLANS-V2** — Nouveau modèle Gratuit / Solo 19€ / Pro 59€ / Business 149€ (+ annuel -20% : 15/47/119) — spec §17 — feature gates (page analysis, mémoire GEO, full reco, publishers, PDF + white-label Business, support prioritaire), downgrade = sites gelés lecture seule, impayé = 7j de grâce, migration sans grandfathering (Stripe jamais Live) — *dépend de TKT-CREDITS*
- [ ] **TKT-COACH-V2** — GEO, le coach IA : refonte complète en 4 lots (V2a Cerveau / V2b Corps / V2c Mémoire / V2d Magie) — spec détaillée dans `cahier-des-charges.md` §16 — fix accès Free, bouton flottant global, "Demander à GEO" depuis les issues, mémoire par site, Sonnet + web search + fallback, chips contextuelles, comparaison N vs N-1, décompte crédits réel — *dépend de TKT-CREDITS + TKT-PLANS-V2*
- [ ] **TKT-RULES-V2** — Règles GEO v2 en 4 lots (V2a Infra / V2b Technique / V2c Contenu / V2d UI) — spec `cahier-des-charges.md` §18 — constat : seulement 10+6 règles actives en V1 (16 désactivées) ; V2 : ~33 techniques + ~26 contenu (réintégration + nouvelles), analyse page par page (Solo 5 / Pro 10), scoring V2 (sévérités + plafonds par catégorie + `rules_version`), niveau « opportunité » avec garantie ≥ 3 par audit, quick wins en tête d'UI — *parallélisable avec TKT-CREDITS*

---

## Journal d'exécution

| Ticket | Statut | Date | Notes |
|--------|--------|------|-------|
| TKT-001 | ✅ | 2026-05-11 | typecheck 0 err, lint 0 err, 3 tests verts, dev → 200 — commit 49aa210 sur main |
| TKT-002 | ✅ | 2026-05-11 | lib/env.ts Zod v4 (17 vars), .env.example, 8 tests — 11 tests total — commit d42fdfd |
| TKT-004 | ✅ | 2026-05-12 | @supabase/ssr + Resend, 5 Server Actions, PKCE callback, 4 pages auth, 10 tests — 48 tests total — commit 5a0667b sur main |
| TKT-005 | ✅ | 2026-05-12 | Header/Footer marketing, layout (marketing)/(auth)/(app), Sidebar client (usePathname), garde auth Supabase — 24 tests stables |
| TKT-006 | ✅ | 2026-05-12 | CRUD sites Drizzle, quotas par plan, 2 Server Actions (quota+ownership check), SiteCard+SiteForm Client Components, lib/validations/site.ts — 60 tests (12 nouveaux) — commit f3ed2ab |
| TKT-007 | ✅ | 2026-05-12 | @mendable/firecrawl-js 4.22.2, table firecrawl_pages (unique site+url, jsonb metadata), crawlSite() + withRetry (backoff exp., stop 401/403), schemas Zod séparés (testables sans env) — 70 tests (10 nouveaux) — commit 59a20fb |
| TKT-008 | ✅ | 2026-05-12 | inngest@4.3.0, client.ts + functions/crawl-site.ts (event site/crawl.requested, step.run), app/api/inngest/route.ts, INNGEST_DEV=1 en dev, serverExternalPackages firecrawl/undici, script inngest:dev via npx — 46 tests stables — commit 5cc6411 |
| TKT-008.5 | ✅ | 2026-05-12 | Design system complet : tokens CSS (#FAF6EF crème, #2348B4 cobalt, #E07856 terracotta, score colors), Figtree+JetBrains Mono, logo.svg + logo-mark.svg, favicon.svg, composants aux bons chemins : ScoreGauge (charts/), ScoreCard (features/analysis/), NeutralPromptBadge (features/discovery/), IssueSeverityBadge (features/technical/), page démo /design — 92 tests verts — typecheck 0 err |
| TKT-010 | ✅ | 2026-05-12 | IAEngine interface + 4 connecteurs (ChatGPT/Claude/Gemini OpenRouter, Perplexity direct), parse.ts (annotations+citations+markdown fallback), cost.ts (computeCost pure + logEstimatedBatchCost), vi.mock env dans tests — 92 tests (46 nouveaux) — commit 22d6dce |
| TKT-009 | ✅ | 2026-05-12 | onboardingSiteSchema (language+country), emailRedirectTo → /onboarding, StepProgress + WelcomeStep + AddSiteStep + page orchestratrice (?step=1|2|3), Server Action createSiteOnboardingAction (crée site + inngest.send 2 events), AnalysisStartedStep — 97 tests verts — PR #2 merged |
| TKT-011 | ✅ | 2026-05-12 | tables site_metadata/competitors/prompts, callStructured (OpenRouter Haiku, Zod, retry x3), prompts LLM versionnés (lib/ai/prompts/), neutrality.ts (isPromptNeutral), runDiscovery orchestration, runDiscoveryFunction Inngest, crawl-site émet site.discovery.requested — 117 tests verts — PR #3 merged |
| TKT-012 | ✅ | 2026-05-12 | page Server Component /sites/[siteId]/discovery (auth+ownership), DescriptionEditor (textarea debounce 500ms), KeywordsEditor (chips+input), CompetitorsEditor (add/delete optimistic), PromptsEditor (add/delete + badge neutralité temps réel + warning pre-submit), 6 Server Actions (Zod, IDOR protection), updateSiteDescription/Keywords ciblés, insertCompetitor/Prompt, deleteXById(siteId) — 117 tests verts — PR #4 merged |
| TKT-013 | ✅ | 2026-05-13 | tables analyses/authority_results/authority_sources + enums, canRunFullAnalysis quota mensuelle, runAnalysisAction (ownership+quota+inngest.send), RunAnalysisButton (launched state + toast + redirect /overview après 2s), lib/analysis/authority.ts (pool ≤8, isClientDomain), Inngest run-authority-analysis — 123 tests verts (6 nouveaux) — PR #5 merged |
| TKT-015 | ✅ | 2026-05-13 | fix estimation coût batch N×4 appels + modèles exacts (chatgpt/claude/gemini/perplexity), tous critères TKT-015 déjà couverts par TKT-013 — 129 tests verts — PR #7 merged |
| TKT-016 | ✅ | 2026-05-13 | 4 fonctions pures scoring (authority/technical/content/global), computeScores refactorisé, 2 DB helpers, scores persistés incrémentalement dans run-full-analysis, 150 tests verts (27 nouveaux) — PR #8 merged |
| TKT-017 | ✅ | 2026-05-13 | Page Vue d'ensemble, ScoreGauge lg, 3 ScoreCards cliquables avec delta, OverviewPolling (5s), skeletons, computeDeltas pure, layout site tab nav, 154 tests verts — PR #9 merged |
| TKT-018 | ✅ | 2026-05-13 | Onglet Autorité, bar chart CSS, tableau croisé prompts × IAs, dialog réponse + surlignage domaine, bouton relancer quota, page Server Component machine d'états, 160 tests verts — PR #10 merged |
| TKT-019 | ✅ | 2026-05-13 | 16 règles GEO technique, table technical_issues, runner real, 246 tests verts — PR #11 merged |
| HOTFIX | ✅ | 2026-05-13 | Audit complet + 7 correctifs : page /content manquante (ContentIssuesList + ContentIssueCard + ContentRecommendationSheet + CONTENT_RECOMMENDATIONS), build TypeScript cassé (as Route), open redirect auth/callback, regex.test() flag global dialog, orderBy ASC→DESC issues, SiteMetadataUpsert.description nullable — 289 tests verts — PR #14 merged |
| UI-REDESIGN | ✅ | 2026-05-21 | Redesign complet Enterprise SaaS Indigo/Violet — palette #4F46E5→#7C3AED+emerald, Plus Jakarta Sans, dark mode revu, 24 pages + 30+ composants (auth/marketing/sidebar/dashboard/onboarding/settings/analyse), plan admin illimité (enum+script+DB), 312 tests verts — PR #29 merged |
| TKT-011.5 | ✅ | 2026-05-21 | Ticket 11.5 ajouté au roadmap — prompts orientés citation (GEO-aware prompt engineering) : patterns citation-inducing vs conceptuels, ≥14/20 prompts avec déclencheur de citation, modification ciblée neutral-prompts.ts — PR #30 merged |
| TKT-AUDIT-MVP | ✅ | 2026-05-22 | Audit complet pré-MVP + 11 bugs corrigés : crash onboarding (inngest try-catch), limites plan conformes CdC (free 1/1 lifetime, pro 3/4, business 10/30), quota free lifetime vs mensuel, page /sites redirect, settings layout+tabs manquants, account page RGPD (email+password+delete cascade), billing valeurs hardcodées, usage label "à vie", doublons liens auth forms, CGV descriptions — 312 tests verts — PR #31 merged |
| TKT-032.5 | ✅ | 2026-05-22 | Overlay fullscreen bloquant pendant les analyses : AnalysisLockProvider (Context React), AnalysisLoadingOverlay (z-9999, stepper 5 étapes, beforeunload handler), sidebar désactivée, AnalysisLockInit (ré-ouverture auto au reload), RunAnalysisButton+RetryAnalysisButton appellent lockAnalysis, OverviewPolling déverrouille à success/error — 312 tests verts — PR #32 merged |
| TKT-033 | ✅ | 2026-05-22 | Verrouillage écran onboarding step 3 : bouton "Voir le tableau de bord" supprimé, AnalysisStartedStep extracté en composant client dédié, beforeunload natif + bannière avertissement "ne pas fermer cet onglet" — commit a691e4d sur main |
| TKT-GEO-PROMPTS | ✅ | 2026-05-26 | Refonte prompts citation-inducing : NEUTRAL_PROMPTS_SYSTEM_PROMPT réécrit en 5 catégories (liste directe / comparatif / alternatives / annuaire / recommandation experte), chaque prompt demande ≥10 acteurs avec URLs. CITATION_SUFFIX ajouté dans authority.ts au moment de l'envoi aux LLMs. typecheck 0 err — PR #33 merged |
| TKT-037 | ✅ | 2026-05-26 | UX des scores : getScoreMaturity() (Débutant/En progression/Avancé/Expert), getPriorityAction() (pilier le plus faible → action cliquable), ScoreCard enrichie (badge maturité + description pédagogique), ScoreGauge seuils mis à jour (≥70=avancé, ≥40=progression, <40=débutant), overview : niveau maturité global + explication calcul + bannière action prioritaire — 321 tests verts (+9) — PR #33 merged |
| TKT-034 | ✅ | 2026-05-26 | Refonte design UI : landing hero 2 colonnes + aperçu produit interactif (score/piliers/action, pur Tailwind), trust bar en pills, steps numérotés ; ScoreCard remplacée (nombre large + barre de progression + flèche nav) ; hero score Autorité/Technique/Contenu unifiés avec header titre+sous-titre ; hiérarchie visuelle ≤3 niveaux partout ; 321 tests verts — PR #34 merged |
| TKT-035 | ✅ | 2026-05-26 | Coach IA : table coach_messages + migration Drizzle, quotas Free=0/Pro=20/Business=∞, Route Handler POST /api/coach/[siteId] streaming SSE OpenRouter (Haiku), system prompt contextualisé (scores+issues+priorité), CoachPanel client avec streaming optimiste, page /sites/[siteId]/coach (gates plan+analyse), onglet "Coach IA" — 342 tests verts (+21) — PR #35 merged |
| FIX-PROMPTS-3 | ✅ | 2026-05-27 | Réduction prompts neutres de 20 à 3 : NeutralPromptsOutputSchema `.length(3)`, prompt système (5 catégories → 3 styles), message utilisateur, tests unitaires — 342 tests verts — PR #36 merged |
| FIX-SLICE-AUDIT | ✅ | 2026-05-27 | Suppression slice(0,5) dans discovery-status route (affichait 5 prompts au lieu de 3), fix full-audit.sh (E2E chromium prod, SIGPIPE), fix vitest.config.ts (exclude .claire/.claude worktrees) — 342 tests verts |
| FIX-RSC-500 | ✅ | 2026-05-28 | Fix 500 au lancement de l'analyse : ScoreCard promu 'use client' + prop `clickable?: boolean`, onClick={() => {}} supprimé des 3 ScoreCards dans overview/page.tsx (Server Component ne peut pas sérialiser une fonction), DB calls dans runAnalysisAction enveloppés dans try/catch — 342 tests verts |
