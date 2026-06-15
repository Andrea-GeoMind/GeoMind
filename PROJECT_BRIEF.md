# PROJECT BRIEF — GEOMIND

> Document de synthèse exhaustif destiné à un transfert de contexte (autre instance Claude / préparation de soutenance incubateur).
> **Tout ce qui suit est vérifié dans le code** (commit `dd49c18`, branche `main`, 2026-06-15). Les chemins de fichiers sont cités pour chaque point important. Quand une chose n'existe pas dans le code, c'est écrit « non implémenté ».

---

## 1. Vue d'ensemble

**Pitch (1 phrase)** : GeoMind est un SaaS B2B français qui mesure si le site d'un commerçant est cité comme source par les moteurs de réponses IA (ChatGPT, Perplexity, Gemini, Claude), explique pourquoi, et fournit un plan d'action concret pour améliorer cette visibilité.

**Description produit** : On donne une URL → GeoMind génère des questions neutres sur le secteur, les envoie aux 4 grandes IA, analyse les réponses pour détecter si le domaine du client apparaît dans les sources citées, audite la « lisibilité IA » technique et éditoriale du site, puis produit 4 scores et un plan d'action priorisé. Verbatim de la landing (`app/(marketing)/page.tsx`) :
> « Quand quelqu'un pose une question à ChatGPT ou Perplexity, l'IA cite ses sources. La visibilité IA, c'est être dans ces sources. GEOMIND mesure si votre site est cité, et où vous pouvez progresser. »

**Problème résolu** : la discipline GEO (Generative Engine Optimization) est neuve et opaque. Les grands groupes ont des équipes SEO/GEO ; les TPE/PME et indépendants n'ont ni l'expertise ni les outils. GeoMind est explicitement positionné pour eux (verbatim FAQ landing : *« Les grands groupes ont des équipes SEO/GEO. Les indépendants et PME, non. C'est pour eux qu'on a créé GEOMIND. »*).

**Cible** : TPE, PME, indépendants — France uniquement en V1. Utilisateurs **non-techniques** (la vulgarisation est un axe produit explicite : glossaire 💡, traduction des crédits en « ≈ X analyses ou Y questions à GEO », coûts affichés en langage humain — cf. `lib/credits-shared.ts:formatCreditsAsUsage`).

**Proposition de valeur** : « Sache où tu es cité dans les IA. Comprends pourquoi pas. Améliore ta visibilité avec un plan d'action concret. »

**Marché / domaine** : geomind.fr — France V1. Modèle freemium SaaS.

### État d'avancement réel (déduit du code, pas des intentions)

**MVP fonctionnel avancé / pré-production à bêta.** Faisceau d'indices concordants :
- **Pipeline métier complet et branché de bout en bout** : crawl → découverte → interrogation des 4 IA → parsing citations → scoring → recommandations → monitoring récurrent. Tout est implémenté (cf. §3).
- **Plomberie de production présente** : webhooks Stripe idempotents (`app/api/stripe/webhooks/route.ts`), Sentry configuré (`sentry.*.config.ts`, `instrumentation.ts`), PostHog (`lib/posthog.ts`), PWA Serwist (`app/sw.ts`), RLS sur les tables métier, journal d'audit RGPD (`audit_logs`), crons de monitoring Inngest.
- **Système de facturation réel** : crédits, packs, abonnements, essai Pro 7 jours, reset mensuel via webhook — tout codé (`lib/credits.ts`, `lib/plans.ts`).
- **Réserves** : `package.json` `"version": "0.1.0"`. La présence massive de fichiers d'audit/QA à la racine (`AUDIT.md`, `QA.md`, `MERGE_BLOCKER.md`, `FINAL_REPORT.md`, `PROGRESS.md`) indique un produit en durcissement actif, pas encore stabilisé en prod grand public. L'OAuth Google nécessite encore une config console (noté dans les commits). Pas de preuve de trafic/clients réels dans le code.

**Conclusion** : produit techniquement complet au niveau MVP+, en phase de durcissement qualité avant ouverture. Déployé en continu sur Vercel (geomind.fr).

---

## 2. Architecture technique

### Stack (versions exactes — lues dans `package.json`)

| Couche | Choix | Version (package.json) |
|---|---|---|
| Framework | Next.js (App Router) | `^15.3.2` |
| UI runtime | React / React DOM | `^19.1.0` |
| Langage | TypeScript (strict) | `^5.8.3` |
| Styling | Tailwind CSS | `^3.4.17` |
| Primitives UI | Radix (`dialog`, `label`, `slot`, `toast`) + lucide-react `^0.511.0` + class-variance-authority + clsx + tailwind-merge | — |
| ORM | Drizzle ORM | `^0.45.2` (+ drizzle-kit `^0.31.10`) |
| Driver PG | `postgres` (postgres.js) | `^3.4.9` |
| BDD | PostgreSQL via Supabase (région EU, RLS) | — |
| Auth / SSR | `@supabase/ssr` `^0.10.3` + `@supabase/supabase-js` `^2.105.4` | — |
| Background jobs | Inngest | `^4.3.0` |
| Paiement | Stripe | `^22.1.1` |
| Crawl web | Firecrawl (`@mendable/firecrawl-js`) | `^4.22.2` |
| LLM | **Pas de Vercel AI SDK** : appels HTTP directs à OpenRouter + Perplexity (cf. connecteurs) | — |
| Email | Resend | `^6.12.3` |
| Validation | Zod | `^4.4.3` |
| Forms | react-hook-form `^7.75.0` + `@hookform/resolvers` `^5.2.2` | — |
| Monitoring | Sentry (`@sentry/nextjs`) | `^10.53.1` |
| Analytics | PostHog (`posthog-js` `^1.373.4` + `posthog-node` `^5.34.1`) | — |
| PWA | Serwist (`@serwist/next` + `serwist`) | `^9.5.11` |
| Tests unitaires | Vitest | `^3.1.3` |
| Tests e2e | Playwright (`@playwright/test`) | `^1.52.0` |
| Lint | ESLint `^9.27.0` (flat config) + Prettier `^3.5.3` | — |
| Hébergement | Vercel | `vercel.json` présent |
| Package manager | pnpm (workspace) | — |

> **Écart vs CLAUDE.md** : le CLAUDE.md annonce « Vercel AI SDK + OpenRouter + Perplexity ». Le SDK Vercel AI **n'est pas** une dépendance ; les appels LLM sont des `fetch` HTTP directs vers OpenRouter et Perplexity (`lib/ai/connectors/*`). Le reste de la stack annoncée est conforme.

### Arborescence principale (commentée)

```
geomind/
├── app/
│   ├── (marketing)/            # public : landing, pricing, about, blog (3 guides GEO),
│   │                           #   outils/generateur-llms-txt, legal/{cgv,cookies,mentions,privacy}
│   ├── (auth)/                 # login, signup, verify-email, reset-password (+ actions.ts)
│   ├── (app)/                  # authentifié
│   │   ├── dashboard/          # hub post-login
│   │   ├── onboarding/         # wizard 1er site (create → discovery → validate-and-launch)
│   │   ├── settings/           # account / billing / usage
│   │   └── sites/[siteId]/     # 14 onglets par site (cf. §3)
│   ├── api/                    # endpoints (cf. §2 endpoints)
│   ├── auth/callback/          # callback OAuth / magic link
│   ├── opengraph-image.tsx, robots.ts, sitemap.ts, sw.ts   # SEO + PWA
│   └── global-error.tsx, not-found.tsx
├── components/                 # ui/ (shadcn manuels), charts/, features/
├── lib/
│   ├── db/        schema.ts (788 l.), client.ts, queries/   # Drizzle
│   ├── supabase/  server.ts, client.ts, admin.ts, middleware.ts
│   ├── ai/
│   │   ├── connectors/   base.ts + chatgpt/claude/gemini/perplexity
│   │   ├── prompts/      coach, discovery, neutral-prompts, publishers, recommendations, reputation
│   │   ├── parse.ts, cost.ts, structured.ts, schemas.ts, coach-suggestions.ts
│   ├── analysis/
│   │   ├── technical/rules/   # 30 règles GEO techniques (+ 3 helpers)
│   │   ├── content/rules/     # 26 règles GEO contenu
│   │   ├── scoring.ts, neutrality.ts, authority.ts, discovery.ts, publishers.ts,
│   │   ├── reputation.ts, competitors.ts, local.ts, pixel.ts, studio.ts,
│   │   ├── action-fixes.ts, monitoring.ts, alerts.ts, compare.ts, opportunities.ts …
│   ├── inngest/   client.ts + functions/ (8 fonctions, cf. §3)
│   ├── credits.ts, credits-shared.ts, plans.ts, quotas.ts   # facturation/quotas
│   ├── crawl/firecrawl.ts, email/ (Resend + templates), stripe.ts, env.ts, posthog.ts
├── drizzle/        # migrations générées (0001 → 0015+)
├── tests/          # unit (Vitest) + e2e (Playwright)
├── scripts/, docs/, methodologie-kit/
└── (racine) CLAUDE.md, PLAN.md, PROGRESS.md, roadmap.md, cahier-des-charges.md, AUDIT*.md, QA.md
```

### Schéma de base de données (Drizzle — `lib/db/schema.ts`, 788 l., 24 tables)

**Enums (pgEnum)** : `plan` (free/solo/pro/business/admin), `subscription_status`, `analysis_status` (pending/running/success/error), `ia_engine` (chatgpt/claude/gemini/perplexity), `reputation_status`, `sentiment` (positive/neutral/negative/unknown), `technical_issue_category`, `content_issue_category`, `issue_severity` (major/moderate/minor/opportunity), `credit_transaction_reason`, `citation_check_mode` (spontaneous/forced), `pixel_event_type` (pageview/action), `action_status` (todo/done/verified), `recommendation_issue_type`, `publisher_category`, `coach_role`.

**Tables (par domaine) :**

*Identité & facturation*
- **`profiles`** — miroir de `auth.users` (id posé par trigger). `email`, `fullName`, `avatarUrl`, `emailNotifications`. Racine de cascade RGPD.
- **`subscriptions`** — 1:1 user. `stripeCustomerId`, `stripeSubscriptionId`, `plan`, `status`, `currentPeriodEnd`. **Source de vérité du plan** (alimentée par webhooks Stripe).
- **`stripe_webhook_events`** — PK = event id Stripe. Idempotence (claim-avant-traitement).
- **`credit_balances`** — PK = userId. `monthlyCredits` (reset anniversaire) + `purchasedCredits` (n'expirent jamais) + `lastResetAt` + `lowCreditAlertedAt`.
- **`credit_transactions`** — journal immuable des mouvements (`amount` signé, `reason`, `metadata` jsonb).

*Site & découverte*
- **`sites`** — cœur du domaine. `name`, `url`, `language`, `country`, `isVerified`, `coachIntroSeen`, `pixelKey` (UNIQUE). Racine de cascade de quasi toutes les tables métier.
- **`firecrawl_pages`** — pages crawlées (`markdown`, `metadata`, `statusCode`). Unique (site_id, url).
- **`site_metadata`** — 1:1 site. `description` + `keywords[]` (résultat de la découverte).
- **`competitors`** — concurrents détectés. Unique (site_id, url).
- **`prompts`** — questions neutres. `text` + `isNeutral` (flag §6 : false si contient domaine/marque).

*Analyse & scores*
- **`analyses`** — audit complet. `status`, `rulesVersion` (V1=1/V2=2), `globalScore`, `authorityScore`, `technicalScore`, `contentScore`. Double cascade (site + user).
- **`authority_results`** — 1 record = 1 prompt × 1 IA. `engine`, `answer`, `promptIsNeutral`, `partialResponse`, `tokensInput/Output`, `costUsd` numeric(12,8).
- **`authority_sources`** — citations extraites d'une réponse. `url`, `domain`, `isClientDomain`.
- **`citation_checks`** — **série temporelle de visibilité** (clé de la valeur « suivi dans le temps »). `engine`, `mode` (spontaneous/forced), `cited` bool, `position`. Indexée (site_id, checked_at). `analysisId` en SET NULL (check hors-analyse possible).
- **`technical_issues`** / **`content_issues`** — 1 record = 1 règle violée. `ruleKey`, `category`, `title`, `description`, `sampleUrls[]`, `penalty`, `severity`, `effort`, `impact`, `pageUrl` (null = site-scope).
- **`recommendations`** — fiches générées par LLM. **Polymorphe** : `issueType` + `issueId` (FK sans contrainte) + `variant` (simplified=Haiku / complete=Sonnet). Unique (issue_id, variant).
- **`publishers`** — 15/analyse (5 médias, 5 communautés, 5 bases publiques). `name`, `url`, `category`, `pitchAngle`.

*Features avancées*
- **`reputation_runs`** / **`reputation_results`** — ce que les IA disent de l'entreprise. `sentiment`, `claims` jsonb, `knowsBusiness`.
- **`coach_messages`** — historique conversationnel du coach IA (`role`, `content`).
- **`coach_memory`** — mémoire persistante par (user, site), résumé roulant compressé tous les 10 messages. Unique (user_id, site_id).
- **`action_states`** — état durable du Plan d'action (survit à la recréation des issues). Clé (site, rule_key, page_url). `status` (todo→done→verified).
- **`pixel_events`** — tracking « Pixel GeoMind » : visites/actions venant des IA. `aiSource`, `visitorHash` (hash anonyme RGPD), `path`, `actionKind`. Indexé (site, created_at) / (site, ai_source).
- **`public_audits`** — audits express publics (cache 24 h/domaine, rate-limit par IP-hash).
- **`audit_logs`** — journal des mutations sensibles RGPD. `userId` **sans FK** (la trace survit à la suppression du compte).

**Cascades** : `profiles` → toutes les tables possédées ; `sites` → 12 tables ; `analyses` → 6 tables. **Seule exception** : `citation_checks.analysisId` est en `SET NULL` (préserve la série temporelle). Tables autonomes : `stripe_webhook_events`, `audit_logs`, `public_audits`.

> **Note d'intégrité** : `recommendations.issueId` est une **référence polymorphe sans contrainte FK** (résolue applicativement via `issueType`). La cohérence référentielle n'est pas garantie par la DB pour ce lien.

### Pages App Router (rôles)

*(marketing)* : landing, pricing, about, blog (index + 3 guides : « comment être cité par ChatGPT », « fichiers qui parlent aux IA », « GEO vs SEO »), outil public générateur llms.txt, 4 pages légales.
*(auth)* : login (email/password + magic link + Google OAuth), signup, verify-email, reset-password.
*(app)* : dashboard, onboarding (wizard), settings/{account, billing, usage}.

**14 onglets par site** (`app/(app)/sites/[siteId]/`) — chacun avec garde auth + ownership :
| Onglet | Rôle |
|---|---|
| overview | Jauges des 4 scores, maturité, action prioritaire, deltas vs analyse N-1, résumés Suivi + Pixel ; auto-ouvre le Coach après 1re analyse |
| authority | Score d'autorité, stats de citation par moteur, table croisée prompt×IA |
| technical | Issues techniques + correctifs prêts à coller (plan-gated) |
| content | Issues contenu + correctifs (plan-gated) |
| discovery | Édition description/mots-clés/concurrents/prompts ; lance découverte & analyse |
| publishers | Publishers suggérés (liste complète gated) |
| trends (Suivi) | Courbes : score global dans le temps, tendance citations 90 j, taux roulant 30 j |
| action-plan | Plan d'action unifié technique+contenu, correctifs prêts à coller, statut todo/done (fusion de l'ancien « Studio ») |
| coach | Assistant IA conversationnel « GEO » (Sonnet, mémoire, suggestions) |
| competitors | Share of voice vs concurrents, « pourquoi lui » par moteur |
| local | Prompts géolocalisés + checklist présence locale |
| pixel | Installer/gérer le pixel ; visites IA réelles |
| reputation | Sentiment par moteur, l'IA connaît-elle l'entreprise |
| report | Rapport PDF imprimable (white-label en option, plan-gated) |

### API endpoints

| Endpoint | Méthode | Input | Output / Rôle |
|---|---|---|---|
| `/api/analysis/[analysisId]/progress` | GET | analysisId | `{progress, step, status}` — progression réelle calculée depuis les lignes écrites (polling) |
| `/api/coach/[siteId]` | POST (stream) | `{content, analysisId?, focusedIssue?}` | Tokens streamés. Sonnet + web search, fallback Haiku. Rate-limit 30 msg/h, 2000 car. Crédits débités puis ajustés au coût réel, remboursés si échec. Compresse la mémoire tous les 10 msg |
| `/api/inngest` | GET/POST/PUT | — | Handler `serve` Inngest (enregistre les 8+ fonctions) |
| `/api/pixel` | POST/OPTIONS | `{k,t,r?,p?,a?}` (Zod) | Toujours 204. Stocke seulement le trafic IA. RGPD : visitorHash sha256, pas d'IP brute. Cap 5000 evt/site/h |
| `/api/pixel/script.js` | GET | — | Snippet JS <1 Ko sans cookie (cache 1 h, CORS *) |
| `/api/public-audit` | POST | `{url}` | `{domain, score, checks, cached}`. Sans auth/LLM/crédits. Anti-SSRF, cache 24 h, 5/h par IP |
| `/api/site/[siteId]/discovery-status` | GET | siteId | `{ready, data?}` — polling de fin de découverte |
| `/api/stripe/webhooks` | POST | raw + signature | Source de vérité abonnements. Idempotent (claim event.id). Gère checkout/subscription/invoice |
| `/auth/callback` | GET | `?code, ?next` | Échange code → session Supabase |

**Server Actions** (mutations) : auth (`signUp/signIn/Google/signOut/reset/updatePassword`), onboarding (création site + lancement analyse atomique avec consommation crédits), CRUD discovery, `runAnalysisAction` (re-analyse), `setActionStatusAction`, `generateCompleteRecommendation` (Sonnet, Pro+), `runReputationAction`, `activatePixelAction`, coach (intro/clear-memory), account (notifications/suppression RGPD).

### Intégrations externes (clés via env serveur, `lib/env.ts` validé par Zod — `.env.example`)

- **Supabase** — Postgres EU + Auth + RLS (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` réservée Inngest/admin).
- **OpenRouter** (`OPENROUTER_API_KEY`) — passerelle vers GPT-4o-mini-search, Claude Haiku/Sonnet, Gemini Flash.
- **Perplexity** (`PERPLEXITY_API_KEY`) — API directe, modèle `sonar`, `return_citations: true`.
- **Firecrawl** (`FIRECRAWL_API_KEY`) — crawl/scrape v2 (`map` + `scrape`).
- **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs) — abonnements + packs + Customer Portal.
- **Resend** (`RESEND_API_KEY`) — emails transactionnels (alertes, rapport mensuel, crédits bas).
- **Inngest** (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) — jobs asynchrones.
- **Sentry** (`SENTRY_DSN`) + **PostHog** (`NEXT_PUBLIC_POSTHOG_KEY/HOST`) — observabilité & analytics.

*Aucun secret côté client* (conforme règle métier §4). Modèles LLM utilisés (vérifiés dans `lib/ai/connectors/*` et `lib/ai/cost.ts`) :
| Usage | Modèle |
|---|---|
| ChatGPT (autorité) | `openai/gpt-4o-mini-search-preview` (OpenRouter) |
| Claude (autorité) | `anthropic/claude-haiku-4-5:beta` (OpenRouter) |
| Gemini (autorité) | `google/gemini-2.5-flash` (OpenRouter) |
| Perplexity (autorité) | `sonar` (API directe) |
| Découverte / reco simplifiées / publishers / reputation | `anthropic/claude-haiku-4-5` |
| Coach + recommandations complètes | `anthropic/claude-sonnet-4-6` (fallback Haiku) |

---

## 3. Fonctionnalités (IMPLÉMENTÉES, vérifiées dans le code)

### Le cœur GEO — pipeline complet (collecte → analyse → recommandations → reporting)

Orchestré par **Inngest** (aucun appel LLM synchrone — règle métier §1). Le bouton « Lancer l'analyse » émet `analysis.full.requested` → fonction `run-full-analysis` (`lib/inngest/functions/run-full-analysis.ts`). Chaque étape est un `step.run` durable, retryé individuellement.

**Étape 1 — Crawl / Découverte.** Firecrawl (`lib/crawl/firecrawl.ts`) : `map` (liste d'URLs) + `scrape` parallèle (markdown), upsert dans `firecrawl_pages` (5 pages à l'onboarding, 20 en re-analyse). Skip si crawl < 2 h. Puis `discovery.ts` fait **2 appels Claude Haiku structurés** (validés Zod) : (a) extraction `{description, keywords, competitors}`, (b) génération de 3 questions neutres qu'un prospect réel poserait.

**Étape 2 — Détection de neutralité** (`lib/analysis/neutrality.ts`, fonction pure). Chaque prompt est flaggé `isNeutral=false` s'il contient le domaine ou la marque (tokens extraits du hostname + nom du site, longueur > 2). **Seuls les prompts neutres alimentent le score** (règle métier §6) — sinon le client se citerait trivialement.

**Étape 3 — Interrogation des 4 IA** (`lib/analysis/authority.ts`). 4 connecteurs (interface commune `IAEngine`, `lib/ai/connectors/base.ts`). **Double mesure** :
- **Forcé** (tous les prompts neutres) : un suffixe `CITATION_SUFFIX` (« liste au moins 10 acteurs… avec leur URL ») est ajouté **à l'envoi seulement** (le prompt stocké reste neutre). Alimente le score + la table de citations.
- **Spontané** (échantillon de 3) : prompt brut, sans suffixe — mesure la citation naturelle. Stocké uniquement dans `citation_checks`.
Fan-out = 1 prompt × 1 moteur × 1 mode, exécuté via un pool **borné à 8** (`runWithConcurrency` — jamais de `Promise.all` non plafonné, règle §10). Chaque réponse est validée Zod ; un échec est compté, jamais bloquant. **Throttle free** : 3 prompts forcés, pas de salve spontanée (~÷4 du coût).

**Étape 4 — Parsing citations** (`lib/ai/parse.ts`). Perplexity → array `citations[]` ; OpenRouter → `annotations[].url_citation` ; fallback → liens markdown/URLs nues dans le texte. Chaque URL réduite au domaine nu. Détection client : `clientDomain = extractDomain(site.url)` comparé aux sources ; position = rang dans les sources. Écrit `authority_results` + `authority_sources` (forcé) et une ligne datée `citation_checks` (tous modes).

**Étape 5 — Scoring** (`lib/analysis/scoring.ts`, **pur et déterministe**, règle §9) :
- **Autorité** = `(citations client / appels forcés réussis) × 100`.
- **Technique** & **Contenu** = `100 − Σ pénalités plafonnées`. Pénalité par sévérité (`geo-rules.ts`) : major=12, moderate=6, minor=3, opportunity=0. Issues page-scope mises à l'échelle par `ceil(penalty × min(affected, pages)/pages)`. **Plafond de 30 par catégorie** (une mauvaise catégorie ne coule pas le score).
- **Global** = `(autorité + technique + contenu) / 3` (moyenne équipondérée des 3 piliers).
- Helpers : bandes de maturité (Débutant/En progression/Avancé/Expert à 40/70/90) + action prioritaire (pilier le plus faible).
- **30 règles techniques** (`lib/analysis/technical/rules/` — robots bloquant les bots IA, llms.txt manquant, sitemap, schema.org Organization/FAQ/Article/Product, HTTPS, breadcrumb, alt, H1, viewport mobile, temps de réponse…) et **26 règles contenu** (`content/rules/` — FAQ, définitions, listes structurées, fraîcheur, entités nommées, contenu comparatif, statistiques, bio auteur, titre/meta…).

**Étape 6 — Recommandations & Publishers.** `recommendations.ts` : par issue, génère un correctif simplifié via Haiku (pool borné à 5, Zod). `publishers.ts` : 1 appel Haiku → 15 publishers sectoriels (cibles de placement haute autorité). Recommandation complète (Sonnet) à la demande, réservée Pro+.

**Étape 7 — Monitoring récurrent** (`lib/inngest/functions/monitor-sites.ts`). 2 crons : **payants hebdo** (lundi 06:00 UTC, 3 prompts) et **gratuits mensuel** (1er du mois 07:00, 2 prompts). Exclut les sites gelés. Écrit dans `citation_checks` → c'est ce qui fait bouger les courbes et déclenche les alertes (1re citation / disparition par email).

**Coût maîtrisé** (`lib/ai/cost.ts`) : prix par modèle, `computeCost` pur, `logEstimatedBatchCost` avant chaque batch, alerte au-delà de ~5,5 $ (signal d'anomalie, règle §10). En cas d'échec d'analyse, **remboursement automatique des crédits**.

### Autres features implémentées

- **Audit express public** (`/api/public-audit` + `outils/generateur-llms-txt`) — audit GEO sans inscription via checks HTTP rapides (sans LLM), cache 24 h, rate-limit. Outil d'acquisition.
- **Coach IA « GEO »** — assistant conversationnel flottant, streaming SSE, mémoire persistante compressée (Haiku tous les 10 msg), suggestions contextuelles, Sonnet + fallback Haiku, crédits réels. (`/api/coach/[siteId]`, `lib/analysis/coach-context.ts`).
- **Plan d'action** — kanban unifié technique+contenu avec correctifs prêts à coller (« Studio » fusionné dedans), vérification de statut, état durable (`action_states`).
- **Réputation IA** (`reputation.ts`) — sentiment par moteur + détection d'hallucinations / « l'IA connaît-elle l'entreprise ».
- **Onglet Concurrents** — share of voice par moteur, « pourquoi lui ».
- **Onglet Local** — questions géolocalisées + checklist présence locale.
- **Pixel GeoMind** (`lib/analysis/pixel.ts`, `/api/pixel`) — preuve du ROI : tracking RGPD-safe des visites/actions venant réellement des IA (hash anonyme, sans cookie).
- **Suivi / Trends** — courbes de scores et de citations dans le temps (série `citation_checks`).
- **Alertes email** + **rapport mensuel automatique** (Resend + cron Inngest) + alerte crédits bas (20 %).
- **Export PDF** des rapports — standard (Pro) / white-label (Business).
- **SEO du cordonnier** — robots.ts, sitemap.ts, JSON-LD, Open Graph, opengraph-image.
- **PWA** (Serwist, `app/sw.ts`), **sidebar mobile** repliable.
- **Facturation complète** — crédits universels, packs one-shot, abonnements, essai Pro 7 j, reset mensuel par webhook, gel des sites après downgrade (lecture seule, jamais supprimés).
- **RGPD** — suppression compte/site en cascade, journal d'audit, hash anonymes pixel.
- **Sécurité** — RLS sur les tables métier, idempotence webhooks Stripe par event id, isolation anti prompt-injection du contenu crawlé, vérification ownership explicite côté Inngest.

---

## 4. Nouveautés récentes (git log, ~mai → 13 juin 2026)

L'historique montre un cycle intense de mai à mi-juin 2026, structuré en **Sprint 7 (crédits + plans V2 + règles V2 + coach V2)** puis **REFONTE-2026 (38 items)** puis **vagues QA/UX-FIXES**.

**Thème 1 — Fondations facturation & règles (Sprint 7, ~12 juin)**
- Système de **crédits universel** (`TKT-CREDITS`) : soldes mensuel + acheté, consommation atomique, remboursements.
- **Plans V2** (`TKT-PLANS-V2`) : nouveau modèle free/solo/pro/business/admin.
- **Règles GEO V2** : passage à 30 techniques + 26 contenu, scoring plafonné par catégorie, vue page par page, opportunités, badge méthodologie. Retrait de règles non-GEO (semantic-html5 indétectable depuis le markdown).
- **Coach V2** : mémoire inter-sessions, prompt v2, Sonnet + fallback, compression, crédits réels.

**Thème 2 — REFONTE-2026 (vagues 0→3, ~12-13 juin, PRs #37-49)**
- *Vague 0 (durcissement)* : RLS sur 12 tables manquantes, idempotence webhooks Stripe, isolation anti prompt-injection, SEO complet (robots/sitemap/JSON-LD/OG), honnêteté méthodologique (variance des IA), plan Gratuit = 1 analyse offerte à vie.
- *Vague 1 (mesure & suivi)* : refonte autorité (10 prompts, double mode spontané/forcé, moyenne 30 j), table `citation_checks`, monitoring récurrent, alertes email, onglet Suivi (courbes), rapport mensuel, plan d'action kanban, vulgarisation (glossaire, coûts affichés), sidebar mobile.
- *Vague 2 (acquisition & contenu)* : audit express public dans le hero, FAQ objections, blog (3 guides), À propos, générateur llms.txt public, export PDF, essai Pro 7 j, OAuth Google.
- *Vague 3 (features différenciantes)* : onglet Réputation (sentiment + hallucinations), onglet Local, **Score Agent-Ready** (depuis **retiré**), onglet Concurrents (share of voice), **Pixel GeoMind**, Studio de correctifs.

**Thème 3 — Tarification (12-13 juin)** : pages tarifaires et landing rebranchées sur la valeur réelle ; passage **49 € → 59 €** (Pro). `PROPOSITION-TARIFAIRE.md` en attente de validation.

**Thème 4 — UX-FIXES & QA (13 juin, le plus récent, PRs #50-55)**
- **Fusion du « Studio » dans le Plan d'action** ; engagement coach.
- **Correctifs prêts à coller** dans les fiches Technique & Contenu + bouton « Demander à GEO » + snippets étendus + masquage du « Comment corriger » générique quand un correctif existe.
- **Retrait de la feature Agent-Ready** (actée dans PLAN/PROGRESS/tarifs) + nav latérale groupée.
- Résumés Suivi & Pixel sur la Vue d'ensemble.
- Perf : suivi de progression léger (ne fait plus ramer le navigateur).
- Fixes facturation : **packs réservés aux abonnés**, **analyse gratuite allégée** (4 IA, 3 questions, sans 2e salve), retrait du mode test, fix prompt système du coach.

**Depuis la dernière grande version (REFONTE-2026)** : la couche mesure est devenue une **série temporelle** (plus un one-shot), la facturation est passée au **modèle de crédits**, et le produit a gagné ses features différenciantes (Réputation, Local, Concurrents, Pixel). Les dernières semaines sont du polissage UX + cohérence tarifaire, dont un **retrait notable** (Agent-Ready) — signe d'un recentrage produit avant soutenance.

---

## 5. Différenciation (sur la base de ce qui est réellement codé)

Vs Otterly / Peec AI / Profound / Scrunch (outils GEO majoritairement orientés grands comptes / marketeurs experts) :

1. **Cible non-technique assumée, en français** — vulgarisation native dans le code : crédits traduits en « ≈ X analyses / Y questions » (`formatCreditsAsUsage`), glossaire 💡, correctifs **prêts à coller par CMS**, erreurs humanisées. Les concurrents parlent à des équipes SEO ; GeoMind parle à un artisan.

2. **Du diagnostic à l'action exécutable** — au-delà de « vous n'êtes pas cité », GeoMind génère des **correctifs concrets prêts à copier** (fiches Technique/Contenu, Plan d'action kanban) + un **coach IA conversationnel** avec mémoire et contexte du site. C'est un copilote d'exécution, pas qu'un dashboard.

3. **Mesure honnête et rigoureuse de la citation** — double mode **spontané/forcé**, **détection de neutralité** qui exclut du score les prompts contenant la marque (anti-triche méthodologique), scoring **pur et déterministe** (idempotent), variance des IA assumée publiquement. La crédibilité de la mesure est traitée comme un actif.

4. **Pixel de preuve du ROI** — tracking RGPD-safe du trafic **réellement issu des IA** sur le site client (`pixel_events`, hash anonyme sans cookie). Boucle le diagnostic à un KPI business mesurable (visites/appels/formulaires venant de ChatGPT & co) — rare chez les concurrents.

5. **Audit GEO technique + éditorial intégré** — 56 règles GEO (30 tech + 26 contenu) couvrant la « crawlabilité IA » (robots/llms.txt/schema.org) ET la rédaction (FAQ, définitions, entités), là où beaucoup d'outils ne font que la mesure de citation.

6. **Couverture 4 moteurs unifiée** (ChatGPT, Claude, Gemini, Perplexity) avec modèles **éco** maîtrisés en coût + remboursement auto des analyses échouées — économie alignée sur des tickets TPE/PME (5-149 €) plutôt que sur des contrats entreprise.

7. **Acquisition produit-led** — audit express public sans inscription + générateur llms.txt gratuit + 3 guides GEO, branchés sur le SEO du produit lui-même.

> Réserve honnête : la mesure repose sur des modèles « search » via OpenRouter/Perplexity, pas sur le scraping des vraies surfaces produit de ChatGPT/Gemini. C'est un proxy raisonnable et économique, mais c'est un proxy (assumé dans la communication « variance des IA »).

---

## 6. Métriques & business (chiffres présents dans le code)

### Plans (`lib/plans.ts`)

| Plan | Prix mensuel | Prix annuel (/mois) | Sites | Crédits/mois | Pages analysées | Coach mémoire | Reco complètes | Publishers | Export PDF | Historique |
|---|---|---|---|---|---|---|---|---|---|---|
| **Gratuit** | 0 € | — | 1 | 0 *(bonus 1000 à vie)* | 0 (vue globale) | ✗ | ✗ | partiels | none | 30 j |
| **Solo** | 19 € | 15 € | 2 | 5 000 | 5 | ✓ | ✗ | full | none | 90 j |
| **Pro** | 59 € | 47 € | 5 | 20 000 | 10 | ✓ | ✓ | full | standard | 365 j |
| **Business** | 149 € | 119 € | 15 | 80 000 | 10 | ✓ | ✓ | full | white-label | ∞ |
| **Admin** | — | — | ∞ | ∞ | 10 | ✓ | ✓ | full | white-label | ∞ |

- Annuel = 12× le prix affiché, soit **−20 %** (commentaire `plans.ts`).
- Free = **1 analyse offerte à vie** (pas de renouvellement mensuel) ; sa valeur = `WELCOME_BONUS_CREDITS = 1 000` crédits crédités à vie.
- **Essai Pro 7 jours** (statut `trialing`).
- Sites au-delà de la limite après downgrade : **gelés en lecture seule** (jamais supprimés).

### Crédits (`lib/credits-shared.ts`)

- **Bonus de bienvenue** : **1 000 crédits** (à vie, n'expirent pas).
- **1 crédit ≈ 0,001 € de coût API réel** (marge ×2 incluse).
- Soldes : mensuel (reset à la date anniversaire via webhook Stripe + filet lazy à 32 j) + acheté (n'expire jamais). Consommation mensuel d'abord. **Atomique** (jamais de solde négatif). **Alerte à 20 %** restants.

**Coûts par opération (`CREDIT_COSTS`)** :
| Opération | Crédits |
|---|---|
| Analyse complète | 400 |
| Autorité seule | 150 |
| Technique seule | 20 |
| Contenu seul | 20 |
| Analyse page par page (/page) | 8 |
| Message coach (Haiku) | 10 |
| Message coach premium (Sonnet) | 30 |
| Recommandation complète (Sonnet) | 50 |
| Analyse de réputation | 150 |

**Packs de crédits** (achat one-shot Stripe, n'expirent jamais, **réservés aux abonnés**) :
| Pack | Crédits | Prix |
|---|---|---|
| Starter | 500 | 5 € |
| Growth | 2 000 | 15 € |
| Power | 8 000 | 49 € |

### Limites & garde-fous techniques (chiffrés dans le code)
- Concurrence appels LLM autorité : **8 max** ; recommandations : **5** ; monitoring : **2**.
- Coach : **30 messages/h**, **2000 caractères** max.
- Pixel : cap **5000 événements/site/heure**. Public-audit : **5/heure par IP**, cache **24 h**.
- Crawl : 5 pages (onboarding) / 20 pages (re-analyse), skip si < 2 h.
- Seuil d'alerte coût analyse : **~5,5 $** (Sentry).
- Crons monitoring : payants hebdo (3 prompts) / gratuits mensuel (2 prompts).

> Pas trouvé dans le code : objectifs de CA, nombre de clients, taux de conversion, CAC/LTV, projections financières (→ relèvent du business plan, pas du repo).

---

## Forces & faiblesses (état actuel)

### Forces
1. **Pipeline GEO complet et cohérent de bout en bout** — crawl → 4 IA → parsing → scoring déterministe → reco → monitoring récurrent, le tout orchestré proprement en Inngest (aucun LLM synchrone). C'est le vrai actif technique.
2. **Rigueur méthodologique sur la mesure** — neutralité des prompts, double mode spontané/forcé, scoring pur idempotent, série temporelle `citation_checks`. La crédibilité de la note est défendable face à un jury.
3. **Discipline d'ingénierie de production** — RLS, idempotence webhooks, remboursements auto, coûts trackés et plafonnés, audit log RGPD, validation Zod systématique des sorties LLM, env validé au boot.
4. **Différenciation produit réelle et exécutable** — correctifs prêts à coller, coach IA avec mémoire, Pixel de preuve du ROI, le tout pensé pour un utilisateur non-technique français.
5. **Couverture fonctionnelle large** déjà codée (14 onglets, audit public, blog, PWA, export PDF, facturation crédits complète).

### Faiblesses / dette technique
1. **Mesure = proxy, pas la vraie surface des IA** — les connecteurs interrogent des modèles « search » via OpenRouter/Perplexity, pas les interfaces ChatGPT/Gemini réelles. Économique et raisonnable, mais la variance est réelle (assumée mais structurelle).
2. **Incohérences de spécification résiduelles** — la note GEO globale est définie dans CLAUDE.md comme un taux de citation mais implémentée comme moyenne des 3 piliers ; le CLAUDE.md mentionne le Vercel AI SDK (non utilisé). Documentation interne pas encore alignée sur le code.
3. **Référence polymorphe sans FK** (`recommendations.issueId`) — intégrité référentielle non garantie par la DB, repose sur la discipline applicative.
4. **Produit encore en durcissement** — abondance de fichiers AUDIT/QA/MERGE_BLOCKER à la racine, `version 0.1.0`, OAuth Google non finalisé (config console requise), tarifs en attente de validation. Pas de signal de charge réelle / clients en prod dans le code.
5. **Volatilité produit récente** — features ajoutées puis retirées en quelques jours (Score Agent-Ready, Studio fusionné). Sain pour un MVP en recherche de PMF, mais signale un périmètre pas encore figé — à formuler comme « itération rapide » plutôt que « instabilité » devant l'incubateur.

---

*Brief généré le 2026-06-15 à partir d'une lecture directe du code (branche `main`, commit `dd49c18`). Sources principales : `package.json`, `lib/db/schema.ts`, `lib/plans.ts`, `lib/credits*.ts`, `lib/analysis/*`, `lib/ai/*`, `lib/inngest/functions/*`, `app/**`.*
