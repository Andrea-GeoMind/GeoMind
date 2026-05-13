# PROGRESS — `GEOMIND`

Fichier d'état persistant. **Source de vérité** : cocher ici = ticket terminé, committé, pushé, audité.

---

## État global

Sprint 2 → Sprint 3 en cours. TKT-001 à TKT-008 terminés. TKT-008.5 terminé. TKT-009 terminé. TKT-010 terminé. TKT-011 terminé. TKT-012 terminé. TKT-013 terminé. TKT-014 terminé. TKT-015 terminé. TKT-016 terminé. TKT-017 terminé. TKT-018 terminé. TKT-019 terminé. TKT-020 terminé. TKT-021 terminé.

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
