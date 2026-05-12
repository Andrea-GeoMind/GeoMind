# Onboarding Wizard (étapes 1 et 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter le wizard onboarding 3 étapes (bienvenue → formulaire site → confirmation) déclenché automatiquement après la vérification email d'un nouvel utilisateur.

**Architecture:** Le wizard vit dans `app/(app)/onboarding/page.tsx` (auth obligatoire via le layout parent). La navigation entre étapes se fait par le query param `?step=1|2|3`. L'étape 2 soumet un Server Action qui crée le site et émet deux events Inngest (`site/crawl.requested` + `site/discovery.requested`).

**Tech Stack:** Next.js 15 App Router (Server Components + Server Actions), react-hook-form + Zod, Inngest, Supabase Auth, Drizzle.

---

## Fichiers touchés

| Fichier | Action | Rôle |
|---|---|---|
| `lib/validations/site.ts` | Modifier | Ajouter `onboardingSiteSchema` avec `language` + `country` |
| `app/(auth)/actions.ts` | Modifier | `emailRedirectTo` pointe vers `/auth/callback?next=/onboarding` |
| `components/features/onboarding/StepProgress.tsx` | Créer | Barre de progression 3 étapes |
| `components/features/onboarding/WelcomeStep.tsx` | Créer | Étape 1 : message de bienvenue + CTA |
| `components/features/onboarding/AddSiteStep.tsx` | Créer | Étape 2 : formulaire site (nom, URL, langue, pays) |
| `app/(app)/onboarding/actions.ts` | Créer | Server Action : créer site + émettre events Inngest |
| `app/(app)/onboarding/page.tsx` | Créer | Page orchestratrice — lit `?step` et rend le bon composant |

---

## Task 1 : Étendre le schéma de validation

**Files:**
- Modify: `lib/validations/site.ts`
- Test: `tests/unit/validations/site.test.ts` (créer)

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// tests/unit/validations/site.test.ts
import { describe, it, expect } from 'vitest'
import { siteSchema, onboardingSiteSchema } from '@/lib/validations/site'

describe('siteSchema', () => {
  it('accepts valid name + url', () => {
    expect(siteSchema.safeParse({ name: 'Mon site', url: 'https://exemple.fr' }).success).toBe(true)
  })
})

describe('onboardingSiteSchema', () => {
  it('accepts valid full payload', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
      language: 'fr',
      country: 'FR',
    })
    expect(result.success).toBe(true)
  })

  it('rejects language longer than 2 chars', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
      language: 'fre',
      country: 'FR',
    })
    expect(result.success).toBe(false)
  })

  it('rejects country longer than 2 chars', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
      language: 'fr',
      country: 'FRA',
    })
    expect(result.success).toBe(false)
  })

  it('defaults language to fr and country to FR when omitted', () => {
    const result = onboardingSiteSchema.safeParse({
      name: 'Mon site',
      url: 'https://exemple.fr',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.language).toBe('fr')
      expect(result.data.country).toBe('FR')
    }
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd "/Users/hophophop/Desktop/GeoMind 2.0/.claude/worktrees/wizardly-moore-23ca3d"
pnpm test tests/unit/validations/site.test.ts
```
Expected: FAIL — `onboardingSiteSchema` not defined.

- [ ] **Step 3 : Implémenter**

```ts
// lib/validations/site.ts
import { z } from 'zod'

export const siteSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long (100 car. max)'),
  url: z
    .string()
    .url('URL invalide — ex: https://exemple.fr')
    .refine((u) => /^https?:\/\//.test(u), {
      message: "Seuls les protocoles http:// et https:// sont autorisés",
    }),
})

export const onboardingSiteSchema = siteSchema.extend({
  language: z.string().length(2, 'Code langue sur 2 caractères (ex: fr)').default('fr'),
  country: z.string().length(2, 'Code pays sur 2 caractères (ex: FR)').default('FR'),
})

export type SiteInput = z.infer<typeof siteSchema>
export type OnboardingSiteInput = z.infer<typeof onboardingSiteSchema>
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
pnpm test tests/unit/validations/site.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/validations/site.ts tests/unit/validations/site.test.ts
git commit -m "feat(onboarding): add onboardingSiteSchema with language + country"
```

---

## Task 2 : Rediriger les nouveaux utilisateurs vers l'onboarding

**Files:**
- Modify: `app/(auth)/actions.ts`

- [ ] **Step 1 : Modifier `emailRedirectTo` dans `signUp`**

Changer la ligne `emailRedirectTo` pour que le callback post-email redirige vers `/onboarding` :

```ts
// app/(auth)/actions.ts — remplacer uniquement la ligne emailRedirectTo dans signUp
emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
```

Le fichier complet après modification :

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export async function signUp(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  })

  if (error) return { error: error.message }

  redirect('/verify-email')
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(
  email: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password%3Fmode%3Dupdate`,
  })

  if (error) return { error: error.message }

  redirect('/reset-password?sent=true')
}

export async function updatePassword(
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  redirect('/dashboard')
}
```

- [ ] **Step 2 : Vérifier typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3 : Commit**

```bash
git add app/\(auth\)/actions.ts
git commit -m "feat(onboarding): redirect new users to /onboarding after email confirmation"
```

---

## Task 3 : Composant StepProgress

**Files:**
- Create: `components/features/onboarding/StepProgress.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// components/features/onboarding/StepProgress.tsx
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Bienvenue' },
  { label: 'Votre site' },
  { label: 'Analyse' },
]

type Props = {
  currentStep: 1 | 2 | 3
}

export function StepProgress({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isActive && 'border-2 border-primary bg-background text-primary',
                  !isCompleted && !isActive && 'border-2 border-muted bg-background text-muted-foreground'
                )}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-5 h-0.5 w-16 transition-colors',
                  stepNumber < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2 : Typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3 : Commit**

```bash
git add components/features/onboarding/StepProgress.tsx
git commit -m "feat(onboarding): add StepProgress component"
```

---

## Task 4 : Composant WelcomeStep (étape 1)

**Files:**
- Create: `components/features/onboarding/WelcomeStep.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// components/features/onboarding/WelcomeStep.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WelcomeStep() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenue sur GEOMIND
        </h1>
        <p className="max-w-md text-muted-foreground">
          Découvrez si votre site est cité par les IA comme ChatGPT, Perplexity ou
          Gemini — et obtenez un plan d&apos;action concret pour améliorer votre
          visibilité.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-left text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
          <span>Renseignez votre site web</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">2</span>
          <span>Nous analysons votre visibilité dans les IA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">3</span>
          <span>Recevez votre score GEO et vos recommandations</span>
        </div>
      </div>

      <Button size="lg" onClick={() => router.push('/onboarding?step=2')} className="w-full max-w-xs">
        Commencer
      </Button>
    </div>
  )
}
```

- [ ] **Step 2 : Typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3 : Commit**

```bash
git add components/features/onboarding/WelcomeStep.tsx
git commit -m "feat(onboarding): add WelcomeStep component"
```

---

## Task 5 : Server Action onboarding

**Files:**
- Create: `app/(app)/onboarding/actions.ts`

- [ ] **Step 1 : Créer le Server Action**

```ts
// app/(app)/onboarding/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAddSite } from '@/lib/quotas'
import { createSite } from '@/lib/db/queries/sites'
import { onboardingSiteSchema } from '@/lib/validations/site'
import { inngest } from '@/lib/inngest/client'

export async function createSiteOnboardingAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = onboardingSiteSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
    language: formData.get('language') || 'fr',
    country: formData.get('country') || 'FR',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const allowed = await canAddSite(user.id)
  if (!allowed)
    return {
      error: 'Limite de sites atteinte pour votre plan. Passez au plan supérieur.',
    }

  const site = await createSite({ userId: user.id, ...parsed.data })

  await inngest.send([
    {
      name: 'site/crawl.requested',
      data: { siteId: site.id, userId: user.id },
    },
    {
      name: 'site/discovery.requested',
      data: { siteId: site.id, userId: user.id },
    },
  ])

  redirect('/onboarding?step=3')
}
```

- [ ] **Step 2 : Typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3 : Commit**

```bash
git add app/\(app\)/onboarding/actions.ts
git commit -m "feat(onboarding): server action creates site + emits Inngest events"
```

---

## Task 6 : Composant AddSiteStep (étape 2)

**Files:**
- Create: `components/features/onboarding/AddSiteStep.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// components/features/onboarding/AddSiteStep.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onboardingSiteSchema } from '@/lib/validations/site'
import { createSiteOnboardingAction } from '@/app/(app)/onboarding/actions'

type FormData = z.infer<typeof onboardingSiteSchema>

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'Royaume-Uni' },
  { value: 'US', label: 'États-Unis' },
]

export function AddSiteStep() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(onboardingSiteSchema),
    defaultValues: { language: 'fr', country: 'FR' },
  })

  function onSubmit(data: FormData) {
    setServerError(null)
    const fd = new FormData()
    fd.set('name', data.name)
    fd.set('url', data.url)
    fd.set('language', data.language)
    fd.set('country', data.country)

    startTransition(async () => {
      const result = await createSiteOnboardingAction(fd)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Votre site web</h2>
        <p className="text-muted-foreground">
          Renseignez le site dont vous souhaitez auditer la visibilité IA.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du site</Label>
          <Input
            id="name"
            placeholder="Mon agence web"
            autoFocus
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://exemple.fr"
            {...register('url')}
          />
          {errors.url && (
            <p className="text-sm text-destructive">{errors.url.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Langue du site</Label>
            <select
              id="language"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('language')}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            {errors.language && (
              <p className="text-sm text-destructive">{errors.language.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays cible</Label>
            <select
              id="country"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('country')}
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country.message}</p>
            )}
          </div>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Retour
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Lancement de l\'analyse...' : 'Analyser mon site'}
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2 : Typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3 : Commit**

```bash
git add components/features/onboarding/AddSiteStep.tsx
git commit -m "feat(onboarding): add AddSiteStep form component"
```

---

## Task 7 : Page onboarding orchestratrice

**Files:**
- Create: `app/(app)/onboarding/page.tsx`

- [ ] **Step 1 : Créer la page**

```tsx
// app/(app)/onboarding/page.tsx
import type { Metadata } from 'next'
import { StepProgress } from '@/components/features/onboarding/StepProgress'
import { WelcomeStep } from '@/components/features/onboarding/WelcomeStep'
import { AddSiteStep } from '@/components/features/onboarding/AddSiteStep'

export const metadata: Metadata = {
  title: 'Onboarding — GEOMIND',
}

type Props = {
  searchParams: Promise<{ step?: string }>
}

export default async function OnboardingPage({ searchParams }: Props) {
  const { step: stepParam } = await searchParams
  const step = (Number(stepParam) || 1) as 1 | 2 | 3

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-10">
        <div className="flex justify-center">
          <StepProgress currentStep={step} />
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {step === 1 && <WelcomeStep />}
          {step === 2 && <AddSiteStep />}
          {step === 3 && <AnalysisStartedStep />}
        </div>
      </div>
    </div>
  )
}

function AnalysisStartedStep() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
        <span className="text-3xl">🚀</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Analyse en cours !</h2>
        <p className="text-muted-foreground">
          Votre site est en cours d&apos;analyse. Vous recevrez une notification
          dès que votre score GEO est prêt.
        </p>
      </div>
      <a
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Aller au tableau de bord
      </a>
    </div>
  )
}
```

- [ ] **Step 2 : Typecheck + lint + tests**

```bash
pnpm typecheck && pnpm lint && pnpm test
```
Expected: tous verts.

- [ ] **Step 3 : Commit final**

```bash
git add app/\(app\)/onboarding/page.tsx
git commit -m "feat(onboarding): add onboarding page orchestrating 3-step wizard"
```

---

## Checklist de vérification spec

- [x] **Nouveau user redirigé vers `/onboarding?step=1`** — `signUp` pointe `emailRedirectTo` vers `/auth/callback?next=/onboarding`, le callback route lit `?next` et redirige
- [x] **Étape 1 : message de bienvenue + CTA "Continuer"** — `WelcomeStep.tsx`, bouton "Commencer" → `?step=2`
- [x] **Étape 2 : formulaire site (nom + URL + langue + pays)** — `AddSiteStep.tsx`, 4 champs avec validation Zod
- [x] **À la soumission : crée le site** — `createSiteOnboardingAction` appelle `createSite`
- [x] **Émet `site.crawl.requested` + `site.discovery.requested`** — `inngest.send([...])` avec les deux events
- [x] **Passe à l'étape 3** — `redirect('/onboarding?step=3')` après succès
- [x] **Barre de progression** — `StepProgress` présente sur toutes les étapes
