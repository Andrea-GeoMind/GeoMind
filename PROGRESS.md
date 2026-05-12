# PROGRESS — `GEOMIND`

Fichier d'état persistant. **Source de vérité** : cocher ici = ticket terminé, committé, pushé, audité.

---

## État global

Sprint 2 → Sprint 3 en cours. TKT-001 à TKT-008 terminés. TKT-008.5 terminé. TKT-009 terminé. TKT-010 terminé. TKT-011 terminé.

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
