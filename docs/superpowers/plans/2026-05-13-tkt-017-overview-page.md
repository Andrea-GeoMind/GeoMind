# TKT-017 — Page Vue d'ensemble Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the overview page that displays the 4 GEO scores (global + 3 sub-scores), compares against the previous analysis, and polls every 5s while an analysis is in progress.

**Architecture:** Server Component page fetches data; a `OverviewPolling` client component (renders nothing) triggers `router.refresh()` every 5s when `status` is `pending | running`, causing the server component to re-run and pick up fresh DB state. A new `lib/analysis/compare.ts` holds the pure `computeDeltas` function. The site shell layout (tabs) is also introduced here since sub-score cards must link to tabs.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM, shadcn/ui (`Skeleton`), `lucide-react`, existing `ScoreGauge` and `ScoreCard` components.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/analysis/compare.ts` | Pure `computeDeltas` function |
| Create | `tests/unit/analysis/compare.test.ts` | Unit tests for computeDeltas |
| Modify | `lib/db/queries/analyses.ts` | Add `getLatestAnalysis` + `getLatestSuccessfulAnalyses` |
| Create | `app/(app)/sites/[siteId]/layout.tsx` | Site shell with tab nav |
| Create | `app/(app)/sites/[siteId]/page.tsx` | Redirect → /overview |
| Create | `components/features/overview/overview-polling.tsx` | Client polling component |
| Create | `app/(app)/sites/[siteId]/overview/page.tsx` | Server component overview page |

---

## Task 1: `lib/analysis/compare.ts` — pure delta function

**Files:**
- Create: `lib/analysis/compare.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/analysis/compare.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeDeltas } from '@/lib/analysis/compare'

describe('computeDeltas', () => {
  it('returns positive deltas when current scores are higher', () => {
    const current  = { globalScore: 60, authorityScore: 70, technicalScore: 55, contentScore: 65 }
    const previous = { globalScore: 50, authorityScore: 60, technicalScore: 45, contentScore: 55 }
    expect(computeDeltas(current, previous)).toEqual({
      globalDelta:    10,
      authorityDelta: 10,
      technicalDelta: 10,
      contentDelta:   10,
    })
  })

  it('returns negative deltas when current scores are lower', () => {
    const current  = { globalScore: 40, authorityScore: 30, technicalScore: 50, contentScore: 45 }
    const previous = { globalScore: 55, authorityScore: 60, technicalScore: 70, contentScore: 65 }
    expect(computeDeltas(current, previous)).toEqual({
      globalDelta:    -15,
      authorityDelta: -30,
      technicalDelta: -20,
      contentDelta:   -20,
    })
  })

  it('returns zeros when both analyses have identical scores', () => {
    const scores = { globalScore: 72, authorityScore: 80, technicalScore: 70, contentScore: 66 }
    expect(computeDeltas(scores, scores)).toEqual({
      globalDelta:    0,
      authorityDelta: 0,
      technicalDelta: 0,
      contentDelta:   0,
    })
  })

  it('is deterministic — same inputs always produce the same output', () => {
    const current  = { globalScore: 58, authorityScore: 45, technicalScore: 75, contentScore: 54 }
    const previous = { globalScore: 50, authorityScore: 40, technicalScore: 70, contentScore: 40 }
    expect(computeDeltas(current, previous)).toEqual(computeDeltas(current, previous))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/analysis/compare.test.ts
```

Expected: FAIL with `Cannot find module '@/lib/analysis/compare'`

- [ ] **Step 3: Implement `compare.ts`**

Create `lib/analysis/compare.ts`:

```typescript
export interface AnalysisScoreSnapshot {
  globalScore: number
  authorityScore: number
  technicalScore: number
  contentScore: number
}

export interface ScoreDeltas {
  globalDelta: number
  authorityDelta: number
  technicalDelta: number
  contentDelta: number
}

// Returns point-difference between current and previous analysis scores.
// All inputs must be non-null (only call with status='success' analyses).
export function computeDeltas(
  current: AnalysisScoreSnapshot,
  previous: AnalysisScoreSnapshot
): ScoreDeltas {
  return {
    globalDelta:    current.globalScore    - previous.globalScore,
    authorityDelta: current.authorityScore - previous.authorityScore,
    technicalDelta: current.technicalScore - previous.technicalScore,
    contentDelta:   current.contentScore   - previous.contentScore,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/analysis/compare.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/analysis/compare.ts tests/unit/analysis/compare.test.ts
git commit -m "feat(analysis): add computeDeltas pure function (TKT-017)"
```

---

## Task 2: Add DB queries for overview page

**Files:**
- Modify: `lib/db/queries/analyses.ts`

These two queries are needed by the overview page to find the current analysis and the two most recent successful analyses for delta computation.

- [ ] **Step 1: Add `getLatestAnalysis` and `getLatestSuccessfulAnalyses`**

Append to `lib/db/queries/analyses.ts` (after the existing `countAnalysesThisMonth` function):

```typescript
// Returns the most recent analysis for a site regardless of status.
// Used to detect whether an analysis is in progress.
export async function getLatestAnalysis(siteId: string) {
  const [row] = await db
    .select()
    .from(analyses)
    .where(eq(analyses.siteId, siteId))
    .orderBy(desc(analyses.createdAt))
    .limit(1)
  return row ?? null
}

// Returns the N most recent analyses with status='success' for a site.
// Pass limit=2 to get current + previous for delta computation.
export async function getLatestSuccessfulAnalyses(siteId: string, limit: number) {
  return db
    .select()
    .from(analyses)
    .where(and(eq(analyses.siteId, siteId), eq(analyses.status, 'success')))
    .orderBy(desc(analyses.createdAt))
    .limit(limit)
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/db/queries/analyses.ts
git commit -m "feat(db): add getLatestAnalysis + getLatestSuccessfulAnalyses queries (TKT-017)"
```

---

## Task 3: Site shell layout + redirect

**Files:**
- Create: `app/(app)/sites/[siteId]/layout.tsx`
- Create: `app/(app)/sites/[siteId]/page.tsx`

The layout introduces the per-site tab navigation bar. It applies to all child routes under `[siteId]/` (overview, authority, technical, content, discovery). The root `page.tsx` redirects to overview.

- [ ] **Step 1: Create `app/(app)/sites/[siteId]/layout.tsx`**

```typescript
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'

type Props = {
  children: React.ReactNode
  params: Promise<{ siteId: string }>
}

const TABS = [
  { label: 'Vue d\'ensemble', href: (id: string) => `/sites/${id}/overview` },
  { label: 'Autorité',        href: (id: string) => `/sites/${id}/authority` },
  { label: 'Technique',       href: (id: string) => `/sites/${id}/technical` },
  { label: 'Contenu',         href: (id: string) => `/sites/${id}/content` },
  { label: 'Découverte',      href: (id: string) => `/sites/${id}/discovery` },
]

export default async function SiteLayout({ children, params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  return (
    <div className="flex flex-col">
      {/* Site header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Site
        </p>
        <h1 className="mt-0.5 text-lg font-semibold">{site.name}</h1>
        <p className="text-sm text-muted-foreground">{site.url}</p>
      </div>

      {/* Tab navigation */}
      <nav
        aria-label="Onglets du site"
        className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href(siteId)}
            className="whitespace-nowrap px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-b-2 aria-[current=page]:border-[--brand-blue-500] aria-[current=page]:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/sites/[siteId]/page.tsx`**

```typescript
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function SiteRootPage({ params }: Props) {
  const { siteId } = await params
  redirect(`/sites/${siteId}/overview`)
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/sites/[siteId]/layout.tsx" "app/(app)/sites/[siteId]/page.tsx"
git commit -m "feat(sites): add site shell layout with tab nav (TKT-017)"
```

---

## Task 4: `OverviewPolling` client component

**Files:**
- Create: `components/features/overview/overview-polling.tsx`

This renders nothing visible. Its only job is to trigger `router.refresh()` every 5s when the analysis status is `pending` or `running`, then stop when the status changes.

- [ ] **Step 1: Create `components/features/overview/overview-polling.tsx`**

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type AnalysisStatus = 'pending' | 'running' | 'success' | 'error'

interface OverviewPollingProps {
  status: AnalysisStatus
}

export function OverviewPolling({ status }: OverviewPollingProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status !== 'pending' && status !== 'running') {
      if (timerRef.current !== null) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => router.refresh(), 5000)
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    }
  }, [status, router])

  return null
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/features/overview/overview-polling.tsx
git commit -m "feat(overview): add OverviewPolling client component (TKT-017)"
```

---

## Task 5: Overview page — server component

**Files:**
- Create: `app/(app)/sites/[siteId]/overview/page.tsx`

This is the main page. It's a Server Component that reads the DB, computes deltas, and passes everything to render. The `OverviewPolling` component is mounted unconditionally; it self-disables when status is `success | error`.

- [ ] **Step 1: Create `app/(app)/sites/[siteId]/overview/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis, getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { computeDeltas } from '@/lib/analysis/compare'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { ScoreCard } from '@/components/features/analysis/score-card'
import { Skeleton } from '@/components/ui/skeleton'
import { OverviewPolling } from '@/components/features/overview/overview-polling'

export const metadata: Metadata = {
  title: 'Vue d\'ensemble — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function OverviewPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const latest = await getLatestAnalysis(siteId)

  // No analysis launched yet — direct user to discovery
  if (!latest) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">
          Aucune analyse lancée pour ce site.{' '}
          <Link
            href={`/sites/${siteId}/discovery`}
            className="font-medium text-[--brand-blue-500] underline-offset-4 hover:underline"
          >
            Lancer la découverte
          </Link>
        </p>
      </div>
    )
  }

  const isInProgress = latest.status === 'pending' || latest.status === 'running'
  const isError = latest.status === 'error'

  // Fetch previous successful analysis for delta (only relevant when current is success)
  const successfulPair =
    latest.status === 'success'
      ? await getLatestSuccessfulAnalyses(siteId, 2)
      : []

  const currentAnalysis = successfulPair[0] ?? null
  const previousAnalysis = successfulPair[1] ?? null

  const deltas =
    currentAnalysis &&
    currentAnalysis.globalScore !== null &&
    currentAnalysis.authorityScore !== null &&
    currentAnalysis.technicalScore !== null &&
    currentAnalysis.contentScore !== null &&
    previousAnalysis &&
    previousAnalysis.globalScore !== null &&
    previousAnalysis.authorityScore !== null &&
    previousAnalysis.technicalScore !== null &&
    previousAnalysis.contentScore !== null
      ? computeDeltas(
          {
            globalScore:    currentAnalysis.globalScore,
            authorityScore: currentAnalysis.authorityScore,
            technicalScore: currentAnalysis.technicalScore,
            contentScore:   currentAnalysis.contentScore,
          },
          {
            globalScore:    previousAnalysis.globalScore,
            authorityScore: previousAnalysis.authorityScore,
            technicalScore: previousAnalysis.technicalScore,
            contentScore:   previousAnalysis.contentScore,
          }
        )
      : null

  const globalScore = currentAnalysis?.globalScore ?? null

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Polling — renders nothing, auto-stops when status is success|error */}
      <OverviewPolling status={latest.status} />

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
        </div>
      )}

      {/* Score global */}
      <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score GEO Global
        </p>

        {isInProgress ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <p className="text-sm text-muted-foreground">Analyse en cours…</p>
          </div>
        ) : globalScore !== null ? (
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={globalScore} size="lg" />
            {deltas !== null && (
              <span
                className={
                  deltas.globalDelta > 0
                    ? 'text-sm font-semibold text-[--score-good-600]'
                    : deltas.globalDelta < 0
                      ? 'text-sm font-semibold text-[--score-bad-600]'
                      : 'text-sm font-medium text-muted-foreground'
                }
              >
                {deltas.globalDelta > 0 ? '+' : ''}
                {deltas.globalDelta} pts vs analyse précédente
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Score non disponible</p>
        )}
      </section>

      {/* 3 sub-score cards */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Détail par pilier
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isInProgress ? (
            <>
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </>
          ) : currentAnalysis ? (
            <>
              <Link href={`/sites/${siteId}/authority`} className="contents">
                <ScoreCard
                  pillar="authority"
                  score={currentAnalysis.authorityScore ?? 0}
                  delta={deltas?.authorityDelta}
                  trend={
                    deltas === null
                      ? undefined
                      : deltas.authorityDelta > 0
                        ? 'up'
                        : deltas.authorityDelta < 0
                          ? 'down'
                          : 'stable'
                  }
                  onClick={undefined}
                />
              </Link>
              <Link href={`/sites/${siteId}/technical`} className="contents">
                <ScoreCard
                  pillar="technical"
                  score={currentAnalysis.technicalScore ?? 0}
                  delta={deltas?.technicalDelta}
                  trend={
                    deltas === null
                      ? undefined
                      : deltas.technicalDelta > 0
                        ? 'up'
                        : deltas.technicalDelta < 0
                          ? 'down'
                          : 'stable'
                  }
                  onClick={undefined}
                />
              </Link>
              <Link href={`/sites/${siteId}/content`} className="contents">
                <ScoreCard
                  pillar="content"
                  score={currentAnalysis.contentScore ?? 0}
                  delta={deltas?.contentDelta}
                  trend={
                    deltas === null
                      ? undefined
                      : deltas.contentDelta > 0
                        ? 'up'
                        : deltas.contentDelta < 0
                          ? 'down'
                          : 'stable'
                  }
                  onClick={undefined}
                />
              </Link>
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. If `Skeleton` is not installed, run:
```bash
pnpm dlx shadcn@latest add skeleton
```
then re-run typecheck.

- [ ] **Step 3: Lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
pnpm test
```

Expected: all tests pass (including the 4 new compare tests).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/sites/[siteId]/overview/page.tsx"
git commit -m "feat(overview): build Vue d'ensemble page with scores, delta, and polling (TKT-017)"
```

---

## Self-Review

### Spec coverage

| Criterion | Covered by |
|-----------|-----------|
| Note globale en grand avec couleur (rouge < 30, orange 30-59, vert ≥ 60) | `ScoreGauge` already implements color logic; Task 5 uses `size="lg"` |
| 3 sous-notes en cards cliquables (lien vers l'onglet) | Task 5 — `<Link>` wrapping each `ScoreCard` |
| Delta vs analyse précédente affiché | Tasks 1 + 5 — `computeDeltas` + rendered delta text and `ScoreCard.delta` prop |
| Analyse en cours → skeleton + polling toutes les 5s | Tasks 4 + 5 — `OverviewPolling` + `<Skeleton>` blocks |

### Placeholder scan

No TBDs, no "similar to above", no "implement later". All code blocks are complete.

### Type consistency

- `computeDeltas` accepts `AnalysisScoreSnapshot` (Task 1) — matches the object shape passed in Task 5.
- `getLatestSuccessfulAnalyses` returns `typeof analyses.$inferSelect[]` — Task 5 accesses `.globalScore`, `.authorityScore`, `.technicalScore`, `.contentScore` which all exist on that type (nullable integers).
- `OverviewPolling` receives `status: AnalysisStatus` — Task 5 passes `latest.status` which is the Drizzle enum value matching that union.
- `ScoreCard.delta` is `number | undefined` — Task 5 passes `deltas?.authorityDelta` which is `number | undefined`. ✓
- `ScoreCard.trend` is `Trend | undefined` — Task 5 passes a ternary that produces `'up' | 'down' | 'stable' | undefined`. ✓

### Edge cases handled

- No analysis yet → CTA link to discovery (not a crash)
- Analysis in error state → error banner + no skeletons
- No previous analysis → `deltas` is `null`, delta UI is hidden
- Scores are null on a 'success' row (shouldn't happen, but guarded) → fallback to `?? 0`
