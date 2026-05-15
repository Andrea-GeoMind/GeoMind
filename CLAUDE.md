# GEOMIND — Instructions pour Claude Code

> Ce fichier est lu automatiquement par Claude Code au démarrage de chaque session.
> Il doit rester à la racine du repo et être maintenu à jour.

---

## 1. Contexte du projet

GEOMIND est un SaaS B2B français qui audite la visibilité d'un site web dans les moteurs de réponses IA (ChatGPT, Perplexity, Gemini, Claude). Cible : TPE, PME et indépendants. Le produit mesure si le site du client est cité dans les réponses IA, identifie les points faibles GEO (Generative Engine Optimization), et fournit des recommandations actionnables.

**Promesse client** : "Sache où tu es cité dans les IA. Comprends pourquoi pas. Améliore ta visibilité avec un plan d'action concret."

**Domaine** : geomind.fr
**Marché** : France uniquement en V1
**Modèle économique** : freemium SaaS (Gratuit / Pro 49€ / Business 149€)

---

## 2. Stack technique

| Couche | Choix | Version cible |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript strict | Next 15+, React 19+ |
| Hébergement | Vercel | Pro plan |
| UI | shadcn/ui + Tailwind CSS + Radix + lucide-react | Latest |
| Base de données | PostgreSQL via Supabase (région EU, RLS activée) | Serverless |
| ORM | Drizzle (queries serveur typées + migrations) | Latest |
| Auth | Supabase Auth (email/password + magic link + OAuth) | Latest |
| Client Supabase Next.js | `@supabase/ssr` (Server Components + Server Actions) | Latest |
| Background jobs | Inngest | Latest |
| Paiement | Stripe + Stripe Customer Portal | API 2024+ |
| LLM | Vercel AI SDK + OpenRouter + Perplexity API direct | Latest |
| Crawl web | Firecrawl (API v2) | Latest |
| Email transactionnel | Resend | Latest |
| Validation runtime | Zod | Latest |
| Monitoring erreurs | Sentry | Latest |
| Analytics produit | PostHog | Latest |
| PWA | Serwist | Latest |
| Tests unitaires | Vitest | Latest |
| Tests e2e | Playwright | Latest |
| Lint / Format | ESLint + Prettier | Latest |
| Package manager | pnpm | 9+ |

---

## 3. Commandes essentielles

```bash
pnpm install                    # installation
pnpm dev                        # serveur dev (http://localhost:3000)
pnpm build                      # build production
pnpm start                      # serveur production local
pnpm typecheck                  # TypeScript (zero erreur exigé avant commit)
pnpm lint                       # ESLint
pnpm format                     # Prettier
pnpm test                       # Vitest (tests unitaires)
pnpm test:e2e                   # Playwright (tests e2e)
pnpm db:generate                # générer une migration Drizzle
pnpm db:push                    # appliquer le schéma à la DB (dev only)
pnpm db:migrate                 # appliquer les migrations (prod)
pnpm db:studio                  # ouvrir Drizzle Studio
pnpm inngest:dev                # lancer le dev server Inngest local
```

Avant chaque commit : `pnpm typecheck && pnpm lint && pnpm test`. Aucun de ces 3 ne doit échouer.

---

## 4. Conventions de code

### TypeScript
- **Mode strict obligatoire**, jamais de `any` ni de `@ts-ignore`. Si un type est trop complexe, déclarer une interface dédiée.
- Préférer `type` pour les unions/intersections, `interface` pour les objets extensibles.
- `unknown` plutôt que `any` quand le type est vraiment inconnu, puis narrow avec Zod ou type guards.
- Pas de "magic strings" pour les enums : utiliser `as const` ou les enums Drizzle.

### React / Next.js
- **Server Components par défaut**. `'use client'` uniquement quand nécessaire (état local, événements DOM, hooks browser).
- Pas de classes, fonctions uniquement.
- Server Actions pour les mutations simples, Inngest pour tout traitement >5 secondes.
- Layouts dans `app/`, composants partagés dans `components/`.
- Forms : `react-hook-form` + Zod resolver, jamais de gestion d'état manuelle.

### Fichiers et nommage
- Fichiers : `kebab-case.ts` ou `kebab-case.tsx`.
- Composants : `PascalCase` à l'intérieur des fichiers.
- Hooks : préfixe `use-` (fichier) et `use` (function).
- Variables/fonctions : `camelCase`.
- Constantes globales : `SCREAMING_SNAKE_CASE`.
- 1 composant exporté par défaut par fichier (sauf primitives shadcn).

### Tailwind
- Ordre des classes : layout → box-model → couleur → typographie → effet/état.
- Utiliser `cn()` de `lib/utils.ts` (clsx + tailwind-merge) pour les classes conditionnelles.
- Pas de styles inline (`style={{}}`), tout passe par Tailwind ou un fichier CSS dédié si vraiment nécessaire.
- Variables CSS uniquement dans `app/globals.css` pour les tokens de design.

### Imports
- Ordre : externes (react, next, ...) → alias `@/...` → relatifs.
- Toujours utiliser l'alias `@/` pour les imports internes (jamais `../../...`).

---

## 5. Règles métier critiques (NE JAMAIS VIOLER)

1. **Jamais d'appel LLM synchrone dans une route ou Server Action.** Tout appel LLM passe par une fonction Inngest. La route déclenche le job et retourne immédiatement avec un identifiant d'analyse à poller.

2. **Jamais de confiance au client pour les quotas/plans.** Toute vérification de plan (peut-il lancer une analyse ? combien de sites a-t-il ?) passe par `lib/quotas.ts` qui lit la DB. Le frontend peut afficher des limites pour l'UX, mais la vérité est serveur.

3. **Stripe webhooks = source de vérité.** L'état d'abonnement d'un user vient toujours de la table `subscriptions`, jamais d'un cookie ou d'un état client.

4. **Aucun secret côté client.** Toutes les clés API (OpenRouter, Perplexity, Firecrawl, Stripe, Resend) sont en variables d'environnement serveur. Les routes API et Server Actions sont les seules à y accéder.

5. **Prompts système versionnés et centralisés.** Tous les prompts envoyés aux LLMs sont dans `lib/ai/prompts/`, avec un commentaire qui explique leur rôle. Pas de prompts hardcodés ailleurs dans le code.

6. **Détection des prompts non-neutres obligatoire.** Avant tout envoi à un LLM, vérifier si le prompt contient le domaine ou la marque du client. Si oui : flagger `is_neutral=false` en DB, afficher un warning à l'utilisateur, et exclure du calcul de la note GEO.

7. **Toutes les données utilisateur sont supprimables (RGPD).** Suppression d'un site = cascade vers analyses, issues, recommandations, conversations IA. Suppression d'un compte = cascade vers tous les sites.

8. **Toutes les sorties LLM sont validées par Zod.** Quand on attend du JSON structuré d'un LLM, on définit un schéma Zod et on parse. Si le parse échoue, on retry avec un message d'erreur correctif, jamais on accepte un format inattendu en silence.

9. **Calcul de scores idempotent.** Le même set de réponses LLM doit toujours donner le même score. Les fonctions de scoring dans `lib/analysis/scoring.ts` sont pures, testées, et n'ont aucun side-effect.

10. **Gérer le coût.** Avant chaque batch d'appels LLM, logger le coût estimé. Sentry alerte si une analyse coûte plus de 5€ (signal d'anomalie). Toujours utiliser les modèles "éco" (Haiku, Flash, GPT-4o-mini, Sonar de base) sauf appel explicite à un modèle premium.

11. **RLS activée par défaut sur toutes les tables `public.*`.** Aucune table métier ne doit être accessible sans policy. Les policies se basent sur `auth.uid()`. Pour les jobs Inngest qui n'ont pas de session user, utiliser le client Supabase avec `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS) **uniquement côté serveur** et **vérifier l'ownership explicitement en code** avant toute mutation cross-user.

12. **Drizzle pour les queries, `@supabase/ssr` pour l'auth.** Les Server Components / Server Actions lisent la session via `createServerClient` (cookies). Les queries data passent par Drizzle (typage fort + migrations). Pas de `supabase.from('table').select()` côté serveur sauf cas exceptionnel — la duplication ORM/SDK casse le typage.

13. **Convention événements Inngest : point obligatoire.** Tous les événements Inngest utilisent la convention `domain.action.state` avec des points (ex : `site.crawl.requested`, `site.discovery.requested`, `analysis.full.requested`). Jamais de slashes. Le bouton "Lancer l'analyse" émet `analysis.full.requested` → déclenche `run-full-analysis` (orchestrateur complet).

---

## 6. Structure du repo

```
geomind/
├── CLAUDE.md                       ← ce fichier
├── README.md                       ← onboarding humain
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── drizzle.config.ts
├── .env.example                    ← toutes les variables d'env documentées
├── app/
│   ├── (marketing)/                ← routes publiques
│   │   ├── page.tsx                ← landing
│   │   ├── pricing/page.tsx
│   │   └── legal/{cgv,privacy,mentions,cookies}/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (app)/                      ← routes authentifiées
│   │   ├── layout.tsx              ← protection auth + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── onboarding/page.tsx     ← wizard premier site
│   │   ├── sites/
│   │   │   └── [siteId]/
│   │   │       ├── layout.tsx      ← tabs Vue d'ensemble/Autorité/Tech/Contenu
│   │   │       ├── page.tsx        ← redirige vers overview
│   │   │       ├── overview/page.tsx
│   │   │       ├── authority/page.tsx
│   │   │       ├── technical/page.tsx
│   │   │       ├── content/page.tsx
│   │   │       ├── discovery/page.tsx   ← édition prompts/concurrents
│   │   │       └── publishers/page.tsx
│   │   └── settings/
│   │       ├── account/page.tsx
│   │       ├── billing/page.tsx
│   │       └── usage/page.tsx
│   └── api/
│       ├── stripe/webhooks/route.ts
│       └── inngest/route.ts        ← Inngest webhook
├── components/
│   ├── ui/                         ← shadcn primitives (Button, Card, Dialog, ...)
│   ├── charts/                     ← Recharts wrappers
│   └── features/
│       ├── auth/
│       ├── sites/
│       ├── analysis/
│       ├── authority/
│       ├── technical/
│       ├── content/
│       └── publishers/
├── lib/
│   ├── db/
│   │   ├── schema.ts               ← schéma Drizzle complet
│   │   ├── client.ts               ← instance Drizzle
│   │   └── queries/                ← queries typées par domaine
│   ├── supabase/
│   │   ├── server.ts               ← createServerClient (Server Components / Actions)
│   │   ├── client.ts               ← createBrowserClient ('use client')
│   │   ├── admin.ts                ← createClient(service_role) — Inngest only
│   │   └── middleware.ts           ← refresh session cookies dans middleware.ts
│   ├── stripe.ts                   ← config Stripe + helpers
│   ├── ai/
│   │   ├── connectors/
│   │   │   ├── base.ts             ← interface IAEngine commune
│   │   │   ├── chatgpt.ts
│   │   │   ├── claude.ts
│   │   │   ├── gemini.ts
│   │   │   └── perplexity.ts
│   │   ├── prompts/
│   │   │   ├── discovery.ts        ← extraction description/keywords/competitors
│   │   │   ├── neutral-prompts.ts  ← génération prompts neutres
│   │   │   ├── search-query.ts     ← prompt envoyé aux IAs pour interroger
│   │   │   └── recommendations.ts  ← génération recos statiques
│   │   ├── parse.ts                ← parsing sources/citations
│   │   ├── cost.ts                 ← tracking coûts par appel
│   │   └── structured.ts           ← helpers Zod ↔ structured output
│   ├── crawl/
│   │   └── firecrawl.ts            ← wrapper Firecrawl
│   ├── analysis/
│   │   ├── discovery.ts            ← orchestration analyse découverte
│   │   ├── authority.ts            ← orchestration analyse autorité
│   │   ├── technical/
│   │   │   ├── index.ts            ← runner principal
│   │   │   └── rules/              ← 1 fichier par règle GEO technique
│   │   ├── content/
│   │   │   ├── index.ts
│   │   │   └── rules/
│   │   ├── publishers.ts           ← détection publishers par secteur
│   │   ├── scoring.ts              ← calcul des 4 notes (global, autorité, tech, contenu)
│   │   └── compare.ts              ← comparaison analyse N vs N-1
│   ├── quotas.ts                   ← vérification des limites par plan
│   ├── plans.ts                    ← définition des plans (limites)
│   ├── inngest/
│   │   ├── client.ts
│   │   └── functions/
│   │       ├── crawl-site.ts
│   │       ├── run-discovery.ts
│   │       ├── run-full-analysis.ts
│   │       ├── run-authority-only.ts
│   │       ├── run-technical-only.ts
│   │       └── run-content-only.ts
│   ├── email/
│   │   ├── client.ts               ← config Resend
│   │   └── templates/              ← templates React Email
│   ├── utils.ts
│   ├── types.ts                    ← types partagés
│   └── env.ts                      ← validation des variables d'env (Zod)
├── drizzle/                        ← migrations générées
├── public/                         ← assets statiques + manifest PWA
└── tests/
    ├── unit/                       ← Vitest
    └── e2e/                        ← Playwright
```

---

## 7. Glossaire du domaine

| Terme | Définition |
|---|---|
| **Site** | Un site web enregistré par un utilisateur. 1 user = 1 à 10 sites selon le plan. |
| **Analyse** | Un audit GEO complet d'un site (découverte + 3 piliers). Une analyse a un statut : `pending`, `running`, `success`, `error`. |
| **Découverte** | Première analyse qui génère la description, les mots-clés, les concurrents et les prompts neutres. Précède toute analyse complète. |
| **Prompt** | Une question neutre utilisée pour interroger les IAs. Marqué `is_neutral=true/false` selon qu'il contient ou non le nom de domaine ou de marque. |
| **Citation** | Apparition du domaine du client dans la liste des sources d'une réponse IA. |
| **Point faible** / **Issue** | Problème détecté lors d'une analyse Technique ou Contenu. Cliquable pour ouvrir la fiche de recommandation. |
| **Publisher** | Site éditorial à fort signal d'autorité pour les IAs (Wikipédia, Reddit, médias). Suggéré au client pour stratégie de placement. |
| **Note GEO globale** | (nb citations / nb total réponses IA) × 100. Affichée sur la vue d'ensemble. |
| **Note Autorité** | Score pondéré (top 3 = 3pts, top 10 = 2pts, ailleurs = 1pt), normalisé sur 100. Affichée dans l'onglet Autorité. |
| **Note Technique / Contenu** | 100 − Σ pénalités par règle GEO violée. Affichées dans leurs onglets respectifs. |

---

## 8. Variables d'environnement

Voir `.env.example` pour la liste exhaustive. Catégories :

- **Database** : `DATABASE_URL` (Supabase Postgres — connection pooler URI)
- **Supabase** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (réservée Inngest + scripts admin)
- **Email** : `RESEND_API_KEY`, `EMAIL_FROM`
- **Stripe** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID`
- **LLM** : `OPENROUTER_API_KEY`, `PERPLEXITY_API_KEY`
- **Crawl** : `FIRECRAWL_API_KEY`
- **Jobs** : `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **Observabilité** : `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

Toutes les variables sont validées par Zod dans `lib/env.ts` au démarrage. Si une variable manque ou est invalide, l'app crash explicitement (mieux qu'une erreur sournoise plus tard).

---

## 9. Workflow recommandé pour développer un ticket

1. Lire le ticket dans `roadmap.md` (objectif + fichiers + critères d'acceptation).
2. Si nouveau modèle de données : modifier `lib/db/schema.ts`, puis `pnpm db:generate` + `pnpm db:push`.
3. Implémenter le code en respectant les règles métier (section 5).
4. Écrire au moins 1 test unitaire par nouvelle fonction métier (scoring, parsing, quotas).
5. Si nouvelle page : tester manuellement en local (`pnpm dev`).
6. Vérifier `pnpm typecheck && pnpm lint && pnpm test` → tous verts.
7. Commit avec un message clair (format : `feat(authority): add ranking calculation`).

---

## 10. Anti-patterns à éviter

- ❌ `useState` dans un Server Component (compile error mais éviter d'y arriver).
- ❌ Appeler une API LLM dans `getServerSideProps` ou un Server Component (latence + coût caché).
- ❌ Stocker un état utilisateur sensible dans `localStorage` (XSS).
- ❌ Faire confiance à `searchParams` ou un cookie pour autoriser une action.
- ❌ Mettre à jour la DB depuis le client sans passer par une Server Action ou route API.
- ❌ Hardcoder des prix ou des limites de plan ailleurs que dans `lib/plans.ts`.
- ❌ Catcher une erreur silencieusement (`catch {}`). Toujours logger via Sentry.
- ❌ Faire un `Promise.all` non plafonné sur des appels LLM (risque de cramer du crédit).

---

## 11. Liens utiles

- Documentation Next.js App Router : https://nextjs.org/docs/app
- Documentation shadcn/ui : https://ui.shadcn.com
- Documentation Drizzle : https://orm.drizzle.team
- Documentation Supabase Auth : https://supabase.com/docs/guides/auth
- Documentation Inngest : https://www.inngest.com/docs
- Documentation Vercel AI SDK : https://ai-sdk.dev
- Documentation OpenRouter : https://openrouter.ai/docs
- Documentation Firecrawl : https://docs.firecrawl.dev
- Documentation Stripe : https://stripe.com/docs

---

**Dernière mise à jour de ce fichier** : à incrémenter à chaque évolution structurelle du projet.
