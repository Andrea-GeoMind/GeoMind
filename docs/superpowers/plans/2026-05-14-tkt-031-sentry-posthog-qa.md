# TKT-031 — Sentry + PostHog + QA finale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sentry error reporting with user context, PostHog analytics events for key user actions, and a QA checklist covering all app flows.

**Architecture:** Sentry is installed via `@sentry/nextjs` with three config files (client/server/edge) and an `instrumentation.ts` hook. PostHog server-side helpers live in `lib/posthog.ts` and are called from Server Actions. The QA checklist is a standalone markdown file.

**Tech Stack:** `@sentry/nextjs`, `posthog-node`, Next.js instrumentation API, existing Sentry DSN + PostHog env vars already validated in `lib/env.ts`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `sentry.client.config.ts` | Create | Sentry browser init with replays |
| `sentry.server.config.ts` | Create | Sentry Node init |
| `sentry.edge.config.ts` | Create | Sentry Edge runtime init |
| `instrumentation.ts` | Create | Next.js hook that registers Sentry server/edge |
| `next.config.mjs` | Modify | Wrap config with `withSentryConfig` |
| `lib/posthog.ts` | Create | PostHog Node client + `trackEvent` helper |
| `app/(auth)/actions.ts` | Modify | Track `signup` event |
| `app/(app)/sites/actions.ts` | Modify | Track `site_created` event |
| `app/(app)/sites/[siteId]/analysis-actions.ts` | Modify | Track `analysis_started` event |
| `app/(app)/sites/[siteId]/discovery/launch-action.ts` | Modify | Track `discovery_started` event |
| `app/actions/stripe.ts` | Modify | Track `plan_upgrade_started` event |
| `app/api/stripe/webhooks/route.ts` | Modify | Track `plan_upgraded` event on `checkout.session.completed` |
| `tests/qa-checklist.md` | Create | Full manual QA checklist |

---

## Task 1: Install Sentry

**Files:**
- Modify: `package.json` (via pnpm install)

- [ ] **Step 1: Install `@sentry/nextjs`**

```bash
cd "/Users/hophophop/Desktop/GeoMind 2.0/.claude/worktrees/wonderful-lovelace-2cb463"
pnpm add @sentry/nextjs
```

Expected: `@sentry/nextjs` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Install `posthog-node` for server-side tracking**

```bash
pnpm add posthog-node
```

Expected: `posthog-node` appears in `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add @sentry/nextjs and posthog-node"
```

---

## Task 2: Sentry configuration files

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`

- [ ] **Step 1: Create `sentry.client.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  environment: process.env.NODE_ENV,
})
```

> Note: we expose the DSN as `NEXT_PUBLIC_SENTRY_DSN` (client-safe) while keeping `SENTRY_DSN` server-only. We need to add `NEXT_PUBLIC_SENTRY_DSN` to `lib/env.ts` — done in Task 3.

- [ ] **Step 2: Create `sentry.server.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  environment: process.env.NODE_ENV,
})
```

- [ ] **Step 3: Create `sentry.edge.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  environment: process.env.NODE_ENV,
})
```

- [ ] **Step 4: Commit**

```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts
git commit -m "feat(sentry): add client/server/edge config files"
```

---

## Task 3: Next.js instrumentation hook + env update

**Files:**
- Create: `instrumentation.ts`
- Modify: `lib/env.ts`

- [ ] **Step 1: Create `instrumentation.ts` at repo root**

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = async (
  err: { digest?: string } & Error,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(err, request, context)
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_SENTRY_DSN` to `lib/env.ts`**

Open `lib/env.ts`. In the `// ── Observabilité` section, add the public DSN variable after `SENTRY_DSN`:

```typescript
  SENTRY_DSN: z.url({ message: 'SENTRY_DSN doit être une URL valide' }),
  /** DSN côté client — même valeur que SENTRY_DSN, exposée publiquement (safe) */
  NEXT_PUBLIC_SENTRY_DSN: z.url({ message: 'NEXT_PUBLIC_SENTRY_DSN doit être une URL valide' }),
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add instrumentation.ts lib/env.ts
git commit -m "feat(sentry): add instrumentation hook + NEXT_PUBLIC_SENTRY_DSN env var"
```

---

## Task 4: Wrap next.config.mjs with Sentry

**Files:**
- Modify: `next.config.mjs`

Current content of `next.config.mjs` (for reference):
```js
import path from 'path'
import { fileURLToPath } from 'url'
import withSerwist from '@serwist/next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  serverExternalPackages: ['@mendable/firecrawl-js', 'undici', 'postgres'],
}

const withSerwistConfig = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwistConfig(nextConfig)
```

- [ ] **Step 1: Replace `next.config.mjs` with Sentry-wrapped version**

```js
import path from 'path'
import { fileURLToPath } from 'url'
import withSerwist from '@serwist/next'
import { withSentryConfig } from '@sentry/nextjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  serverExternalPackages: ['@mendable/firecrawl-js', 'undici', 'postgres'],
}

const withSerwistConfig = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSentryConfig(withSerwistConfig(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
```

- [ ] **Step 2: Add optional Sentry build vars to `lib/env.ts`**

These are build-time only (used by `withSentryConfig`), not validated at runtime. Add a comment in the env file below the Sentry section:

```typescript
  // SENTRY_ORG and SENTRY_PROJECT are build-time only (Sentry webpack plugin).
  // They are optional and not validated here — set in CI/Vercel env only.
```

- [ ] **Step 3: Run typecheck and build check**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs lib/env.ts
git commit -m "feat(sentry): wrap next.config with withSentryConfig"
```

---

## Task 5: PostHog server-side helper

**Files:**
- Create: `lib/posthog.ts`

- [ ] **Step 1: Create `lib/posthog.ts`**

```typescript
import { PostHog } from 'posthog-node'
import { env } from '@/lib/env'

let _client: PostHog | null = null

function getClient(): PostHog {
  if (!_client) {
    _client = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return _client
}

export type PostHogEvent =
  | 'signup'
  | 'site_created'
  | 'site_deleted'
  | 'discovery_started'
  | 'analysis_started'
  | 'analysis_completed'
  | 'plan_upgrade_started'
  | 'plan_upgraded'

export function trackEvent(
  userId: string,
  event: PostHogEvent,
  properties?: Record<string, unknown>
): void {
  const client = getClient()
  client.capture({
    distinctId: userId,
    event,
    properties: {
      $lib: 'posthog-node',
      ...properties,
    },
  })
  // Fire-and-forget flush — Server Actions are short-lived
  client.flushAsync().catch(() => {})
}
```

- [ ] **Step 2: Write a unit test**

Create `tests/unit/posthog.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('posthog-node', () => {
  const capture = vi.fn()
  const flushAsync = vi.fn().mockResolvedValue(undefined)
  const PostHog = vi.fn().mockImplementation(() => ({ capture, flushAsync }))
  return { PostHog }
})

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_POSTHOG_KEY: 'phc_test',
    NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.posthog.com',
  },
}))

describe('trackEvent', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('calls capture with the userId and event name', async () => {
    const { trackEvent } = await import('@/lib/posthog')
    const { PostHog } = await import('posthog-node')
    const instance = (PostHog as ReturnType<typeof vi.fn>).mock.results[0].value

    trackEvent('user-123', 'signup', { plan: 'free' })

    expect(instance.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: 'user-123',
        event: 'signup',
        properties: expect.objectContaining({ plan: 'free' }),
      })
    )
  })
})
```

- [ ] **Step 3: Run test**

```bash
pnpm test tests/unit/posthog.test.ts
```

Expected: 1 test PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/posthog.ts tests/unit/posthog.test.ts
git commit -m "feat(posthog): add server-side trackEvent helper with unit test"
```

---

## Task 6: Track `signup` event in auth actions

**Files:**
- Modify: `app/(auth)/actions.ts`

- [ ] **Step 1: Add `trackEvent` call in `signUp`**

In `app/(auth)/actions.ts`, import `trackEvent` and call it after a successful signup. The Supabase `signUp` returns a `user` object in `data` on success.

Replace the `signUp` function body:

```typescript
import { trackEvent } from '@/lib/posthog'

export async function signUp(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })

  if (error) return { error: error.message }

  if (data.user) {
    trackEvent(data.user.id, 'signup', { method: 'email' })
  }

  redirect('/verify-email')
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/actions.ts
git commit -m "feat(analytics): track signup event in auth action"
```

---

## Task 7: Track site and analysis events in Server Actions

**Files:**
- Modify: `app/(app)/sites/actions.ts`
- Modify: `app/(app)/sites/[siteId]/analysis-actions.ts`
- Modify: `app/(app)/sites/[siteId]/discovery/launch-action.ts`

- [ ] **Step 1: Track `site_created` in `app/(app)/sites/actions.ts`**

Add at the top:
```typescript
import { trackEvent } from '@/lib/posthog'
```

In `createSiteAction`, after `await createSite(...)`:
```typescript
  const site = await createSite({ userId: user.id, ...parsed.data })
  trackEvent(user.id, 'site_created', { url: parsed.data.url })
  revalidatePath('/dashboard')
```

Note: `createSite` currently returns `void`. If it doesn't return the site, just track with the userId.

Check `lib/db/queries/sites.ts` to confirm return type. If `createSite` returns `void`:
```typescript
  await createSite({ userId: user.id, ...parsed.data })
  trackEvent(user.id, 'site_created', { url: parsed.data.url })
```

- [ ] **Step 2: Track `analysis_started` in `analysis-actions.ts`**

In `app/(app)/sites/[siteId]/analysis-actions.ts`:

Add at the top:
```typescript
import { trackEvent } from '@/lib/posthog'
```

After `const analysis = await createAnalysis(...)` and before `inngest.send(...)`:
```typescript
  trackEvent(user.id, 'analysis_started', { siteId, analysisId: analysis.id })
```

- [ ] **Step 3: Track `discovery_started` in `launch-action.ts`**

In `app/(app)/sites/[siteId]/discovery/launch-action.ts`:

Add at the top:
```typescript
import { trackEvent } from '@/lib/posthog'
```

After `const site = await getSiteById(siteId)` check and before `inngest.send(...)`:
```typescript
  trackEvent(user.id, 'discovery_started', { siteId })
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/sites/actions.ts" "app/(app)/sites/[siteId]/analysis-actions.ts" "app/(app)/sites/[siteId]/discovery/launch-action.ts"
git commit -m "feat(analytics): track site_created, analysis_started, discovery_started events"
```

---

## Task 8: Track Stripe events

**Files:**
- Modify: `app/actions/stripe.ts`
- Modify: `app/api/stripe/webhooks/route.ts`

- [ ] **Step 1: Track `plan_upgrade_started` in `createCheckoutSession`**

In `app/actions/stripe.ts`, add at the top:
```typescript
import { trackEvent } from '@/lib/posthog'
```

In `createCheckoutSession`, before `redirectExternal(session.url)`:
```typescript
  trackEvent(user.id, 'plan_upgrade_started', { plan })
  redirectExternal(session.url)
```

- [ ] **Step 2: Read the Stripe webhooks route to find `checkout.session.completed`**

```bash
cat "/Users/hophophop/Desktop/GeoMind 2.0/.claude/worktrees/wonderful-lovelace-2cb463/app/api/stripe/webhooks/route.ts"
```

- [ ] **Step 3: Track `plan_upgraded` on successful checkout in the webhook route**

In `app/api/stripe/webhooks/route.ts`, locate the `checkout.session.completed` event handler. After the subscription is created/updated in DB, add:

```typescript
import { trackEvent } from '@/lib/posthog'

// Inside the checkout.session.completed case, after DB update:
const userId = session.metadata?.userId
if (userId) {
  trackEvent(userId, 'plan_upgraded', {
    plan: subscription.plan,
    stripeCustomerId: session.customer,
  })
}
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/actions/stripe.ts app/api/stripe/webhooks/route.ts
git commit -m "feat(analytics): track plan_upgrade_started and plan_upgraded events"
```

---

## Task 9: Set user context on Sentry for authenticated routes

**Files:**
- Modify: `app/(app)/layout.tsx`

This ensures every error in the authenticated part of the app is tagged with the user's Supabase ID.

- [ ] **Step 1: Read `app/(app)/layout.tsx`**

```bash
cat "/Users/hophophop/Desktop/GeoMind 2.0/.claude/worktrees/wonderful-lovelace-2cb463/app/(app)/layout.tsx"
```

- [ ] **Step 2: Add Sentry user context in the layout**

In the Server Component layout, after fetching the user from Supabase, call `Sentry.setUser`. Since this is a Server Component (no `'use client'`), use the server Sentry import:

```typescript
import * as Sentry from '@sentry/nextjs'

// Inside the layout function, after const { data: { user } } = await supabase.auth.getUser():
if (user) {
  Sentry.setUser({ id: user.id, email: user.email })
}
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/layout.tsx"
git commit -m "feat(sentry): set user context on authenticated routes"
```

---

## Task 10: QA checklist

**Files:**
- Create: `tests/qa-checklist.md`

- [ ] **Step 1: Create `tests/qa-checklist.md`**

```markdown
# Checklist QA — GEOMIND

> Effectuée manuellement sur chaque Vercel Preview ou en local (`pnpm dev`).
> Cocher chaque ligne après vérification. Une ligne non cochée = bloquant avant deploy.

## Auth

- [ ] Inscription email → email de vérification reçu → lien redirige vers `/onboarding`
- [ ] Connexion email/password valide → redirigé vers `/dashboard`
- [ ] Connexion email/password incorrect → message d'erreur affiché, pas de redirect
- [ ] "Mot de passe oublié" → email reçu → lien redirige vers `/reset-password?mode=update`
- [ ] Réinitialisation mot de passe → connexion avec nouveau mot de passe fonctionne
- [ ] Déconnexion → redirigé vers `/login`, session détruite (accès `/dashboard` redirige vers login)
- [ ] Accès direct à `/dashboard` sans session → redirigé vers `/login`

## Onboarding

- [ ] Wizard onboarding s'affiche après la vérification email (première connexion)
- [ ] Champ URL invalide → message d'erreur inline
- [ ] Champ URL valide → site créé → redirigé vers le dashboard
- [ ] Wizard onboarding complet sur mobile 375px (pas de débordement, boutons cliquables)

## Dashboard

- [ ] Liste des sites affichée correctement (0 sites → empty state visible)
- [ ] Bouton "Ajouter un site" → modal/formulaire s'ouvre
- [ ] Ajout d'un deuxième site → apparaît dans la liste
- [ ] Suppression d'un site → disparaît de la liste, confirmation demandée

## Découverte (Discovery)

- [ ] Bouton "Lancer la découverte" visible sur la page Discovery
- [ ] Clic → statut passe à `running` (spinner ou indicateur visible)
- [ ] Après complétion → description, mots-clés et concurrents affichés
- [ ] Prompts neutres générés et listés
- [ ] Édition d'un prompt → sauvegardé correctement

## Analyse complète

- [ ] Bouton "Lancer l'analyse" visible (actif si découverte complétée)
- [ ] Clic → statut passe à `running`
- [ ] Après complétion → Note GEO globale affichée sur la vue d'ensemble
- [ ] Onglet Autorité → tableau des citations affiché
- [ ] Onglet Technique → liste des issues affichée (ou "Aucun problème" si clean)
- [ ] Onglet Contenu → liste des issues affichée
- [ ] Onglet Publishers → liste des publishers suggérés
- [ ] Clic sur une issue → fiche recommandation s'ouvre

## Quotas & Plans

- [ ] Plan gratuit : limite de sites respectée (erreur affichée si dépassement)
- [ ] Plan gratuit : limite d'analyses respectée (erreur affichée si dépassement)
- [ ] Page `/settings/billing` → plans tarifaires affichés correctement
- [ ] Clic "Passer au Pro" → redirection Stripe Checkout
- [ ] Après paiement test (carte Stripe test `4242...`) → plan mis à jour dans l'UI
- [ ] Portail client Stripe accessible depuis `/settings/billing`

## Paramètres

- [ ] `/settings/account` → modification email fonctionne
- [ ] `/settings/account` → modification mot de passe fonctionne
- [ ] `/settings/usage` → compteurs d'utilisation corrects

## Observabilité

- [ ] Sentry : déclencher une erreur manuelle (ex : console.error + Sentry.captureException) → apparaît dans le dashboard Sentry avec userId
- [ ] PostHog : signup → event `signup` visible dans PostHog Live Events
- [ ] PostHog : création site → event `site_created` visible
- [ ] PostHog : lancement analyse → event `analysis_started` visible
- [ ] PostHog : consent "Tout accepter" → events capturés ; consent "Essentiel" → events bloqués

## Légal & Cookies

- [ ] Bannière cookies apparaît à la première visite
- [ ] "Tout accepter" → bannière disparaît, consent stocké en localStorage
- [ ] "Essentiel uniquement" → bannière disparaît, PostHog opt_out
- [ ] Pages `/legal/cgv`, `/legal/privacy`, `/legal/mentions`, `/legal/cookies` accessibles et non-vides
- [ ] Liens légaux visibles dans le footer (landing) ou menu

## PWA

- [ ] Manifest `/manifest.json` accessible et valide
- [ ] Sur mobile (Chrome Android) → invite d'installation affichée
- [ ] Sur macOS (Safari) → meta apple-web-app-capable présent
- [ ] Service worker enregistré en production (pas en dev)

## Performance & Accessibilité

- [ ] Lighthouse mobile > 85 sur la landing page
- [ ] Aucune erreur console JavaScript en production
- [ ] Aucun appel réseau en erreur (4xx/5xx) visible dans les DevTools Network
- [ ] Images avec alt text, boutons avec labels accessibles

## Responsive

- [ ] Dashboard lisible sur 375px
- [ ] Tableau Autorité scrollable horizontalement sur 375px
- [ ] Wizard onboarding complet sur 375px
- [ ] Navigation/sidebar repliable sur mobile

## Sécurité

- [ ] Accès à `/sites/{siteId}` avec un siteId appartenant à un autre user → 404 ou redirect
- [ ] Tentative de lancer une analyse pour un site non-propriétaire → erreur retournée
- [ ] Variables d'env sensibles absentes du bundle client (vérifier dans DevTools Sources)
```

- [ ] **Step 2: Commit**

```bash
git add tests/qa-checklist.md
git commit -m "docs(qa): add comprehensive QA checklist"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run all checks**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: 0 TypeScript errors, 0 lint errors, all tests green.

- [ ] **Step 2: Final commit if needed**

If any lint/type fixes were needed:
```bash
git add -A
git commit -m "fix(tkt-031): typecheck and lint fixes"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| `sentry.client.config.ts` | Task 2 |
| `sentry.server.config.ts` | Task 2 |
| `sentry.edge.config.ts` | Task 2 |
| `lib/posthog.ts` init with consent | Task 5 (server-side; consent handled by existing `posthog-provider.tsx` on client) |
| Event `signup` | Task 6 |
| Event `site_created` | Task 7 |
| Event `discovery_started` | Task 7 |
| Event `analysis_started` | Task 7 |
| Event `plan_upgrade_started` | Task 8 |
| Event `plan_upgraded` | Task 8 |
| Exception reported to Sentry with user context | Task 2 + Task 3 + Task 9 |
| QA checklist `tests/qa-checklist.md` | Task 10 |

All requirements covered.

### Notes

- `NEXT_PUBLIC_SENTRY_DSN` needs to be added to `.env.example` and `.env.local` (same value as `SENTRY_DSN` — safe to expose).
- `SENTRY_ORG` and `SENTRY_PROJECT` are optional build-time vars (Vercel env only, not validated by Zod).
- `posthog-node` uses fire-and-forget flush (`flushAsync().catch(() => {})`) — appropriate for Server Actions which are short-lived processes.
- The PostHog consent check for server-side events is not applicable (server tracks user actions, not page views). Client-side consent remains managed by `posthog-provider.tsx`.
