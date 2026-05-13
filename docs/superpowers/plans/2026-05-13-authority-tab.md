# Authority Tab (TKT-018) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Authority tab — score header, citations bar chart per IA engine, scrollable prompts × engines cross-table, and a response detail dialog with client-domain highlighting.

**Architecture:** A Server Component page fetches authority results and transforms them into two serializable data structures (engine stats for the bar chart, cross-table rows for the table) before passing them as props to two `'use client'` components. A third client component handles the "Relancer analyse Autorité" button, reusing the existing `runAnalysisAction`. The dialog lives inside the table component as a local state.

**Tech Stack:** Next.js 15 App Router (Server Components), shadcn/ui (Dialog, Card, Button, Skeleton), Tailwind CSS, lucide-react, Vitest for unit tests, Drizzle query types.

---

## File Map

| Status | File | Responsibility |
|--------|------|----------------|
| Create | `lib/analysis/authority-table.ts` | Pure data-transform helpers (`buildEngineStats`, `buildCrossTable`) |
| Create | `tests/unit/analysis/authority-table.test.ts` | Vitest unit tests for the helpers |
| Create | `components/features/authority/citations-bar-chart.tsx` | Pure SVG bar chart, no state |
| Create | `components/features/authority/response-detail-dialog.tsx` | Dialog with highlighted answer |
| Create | `components/features/authority/citations-table.tsx` | Client component — table + dialog trigger |
| Create | `components/features/authority/run-authority-button.tsx` | Client component — "Relancer" button |
| Create | `app/(app)/sites/[siteId]/authority/page.tsx` | Server Component page |

---

## Task 1: Data-transform helpers

**Files:**
- Create: `lib/analysis/authority-table.ts`

- [ ] **Step 1: Write the file**

```typescript
// lib/analysis/authority-table.ts

import type { IAEngineName } from '@/lib/ai/connectors/base'

export const IA_ENGINES: IAEngineName[] = ['chatgpt', 'claude', 'gemini', 'perplexity']

export const ENGINE_LABELS: Record<IAEngineName, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
}

export type AuthoritySource = {
  id: string
  url: string
  title: string | null
  domain: string
  isClientDomain: boolean
}

export type AuthorityResultRow = {
  id: string
  engine: IAEngineName
  answer: string
  promptIsNeutral: boolean
  partialResponse: boolean
  sources: AuthoritySource[]
  prompt: { id: string; text: string; isNeutral: boolean }
}

export type EngineStats = {
  engine: IAEngineName
  label: string
  total: number
  cited: number
  percentage: number
}

export type CellData = {
  resultId: string
  engine: IAEngineName
  answer: string
  sources: AuthoritySource[]
  cited: boolean
  partial: boolean
}

export type CrossTableRow = {
  promptId: string
  promptText: string
  cells: Partial<Record<IAEngineName, CellData>>
}

export function buildEngineStats(results: AuthorityResultRow[]): EngineStats[] {
  return IA_ENGINES.map((engine) => {
    const engineResults = results.filter((r) => r.engine === engine && r.promptIsNeutral)
    const total = engineResults.length
    const cited = engineResults.filter((r) =>
      r.sources.some((s) => s.isClientDomain)
    ).length
    return {
      engine,
      label: ENGINE_LABELS[engine],
      total,
      cited,
      percentage: total === 0 ? 0 : Math.round((cited / total) * 100),
    }
  })
}

export function buildCrossTable(results: AuthorityResultRow[]): CrossTableRow[] {
  const promptMap = new Map<string, CrossTableRow>()

  for (const result of results) {
    const promptId = result.prompt.id
    if (!promptMap.has(promptId)) {
      promptMap.set(promptId, {
        promptId,
        promptText: result.prompt.text,
        cells: {},
      })
    }
    const row = promptMap.get(promptId)!
    row.cells[result.engine] = {
      resultId: result.id,
      engine: result.engine,
      answer: result.answer,
      sources: result.sources,
      cited: result.sources.some((s) => s.isClientDomain),
      partial: result.partialResponse,
    }
  }

  return Array.from(promptMap.values())
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/analysis/authority-table.ts
git commit -m "feat(authority): add authority-table data-transform helpers"
```

---

## Task 2: Unit tests for the helpers

**Files:**
- Create: `tests/unit/analysis/authority-table.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/analysis/authority-table.test.ts

import { describe, it, expect } from 'vitest'
import {
  buildEngineStats,
  buildCrossTable,
  type AuthorityResultRow,
} from '@/lib/analysis/authority-table'

function makeResult(
  overrides: Partial<AuthorityResultRow> & Pick<AuthorityResultRow, 'engine'>
): AuthorityResultRow {
  return {
    id: overrides.id ?? 'r1',
    engine: overrides.engine,
    answer: overrides.answer ?? 'some answer',
    promptIsNeutral: overrides.promptIsNeutral ?? true,
    partialResponse: overrides.partialResponse ?? false,
    sources: overrides.sources ?? [],
    prompt: overrides.prompt ?? { id: 'p1', text: 'What is X?', isNeutral: true },
  }
}

describe('buildEngineStats', () => {
  it('returns 0% when no results', () => {
    const stats = buildEngineStats([])
    expect(stats).toHaveLength(4)
    expect(stats.every((s) => s.total === 0 && s.cited === 0 && s.percentage === 0)).toBe(true)
  })

  it('counts cited correctly when client domain found', () => {
    const results: AuthorityResultRow[] = [
      makeResult({ engine: 'chatgpt', sources: [{ id: 's1', url: 'https://client.fr', title: null, domain: 'client.fr', isClientDomain: true }] }),
      makeResult({ id: 'r2', engine: 'chatgpt', sources: [{ id: 's2', url: 'https://other.com', title: null, domain: 'other.com', isClientDomain: false }] }),
    ]
    const stats = buildEngineStats(results)
    const chatgpt = stats.find((s) => s.engine === 'chatgpt')!
    expect(chatgpt.total).toBe(2)
    expect(chatgpt.cited).toBe(1)
    expect(chatgpt.percentage).toBe(50)
  })

  it('ignores non-neutral prompts', () => {
    const results: AuthorityResultRow[] = [
      makeResult({ engine: 'claude', promptIsNeutral: false, sources: [{ id: 's1', url: 'https://client.fr', title: null, domain: 'client.fr', isClientDomain: true }] }),
    ]
    const stats = buildEngineStats(results)
    const claude = stats.find((s) => s.engine === 'claude')!
    expect(claude.total).toBe(0)
    expect(claude.cited).toBe(0)
  })
})

describe('buildCrossTable', () => {
  it('returns empty array when no results', () => {
    expect(buildCrossTable([])).toEqual([])
  })

  it('groups results by promptId into rows', () => {
    const results: AuthorityResultRow[] = [
      makeResult({ engine: 'chatgpt', prompt: { id: 'p1', text: 'What is X?', isNeutral: true } }),
      makeResult({ id: 'r2', engine: 'gemini', prompt: { id: 'p1', text: 'What is X?', isNeutral: true } }),
      makeResult({ id: 'r3', engine: 'chatgpt', prompt: { id: 'p2', text: 'Another?', isNeutral: true } }),
    ]
    const table = buildCrossTable(results)
    expect(table).toHaveLength(2)
    const row1 = table.find((r) => r.promptId === 'p1')!
    expect(row1.cells['chatgpt']).toBeDefined()
    expect(row1.cells['gemini']).toBeDefined()
    expect(row1.cells['perplexity']).toBeUndefined()
  })

  it('sets cited=true when any source isClientDomain', () => {
    const results: AuthorityResultRow[] = [
      makeResult({
        engine: 'chatgpt',
        sources: [{ id: 's1', url: 'https://client.fr', title: null, domain: 'client.fr', isClientDomain: true }],
      }),
    ]
    const table = buildCrossTable(results)
    expect(table[0].cells['chatgpt']?.cited).toBe(true)
  })
})
```

- [ ] **Step 2: Run and verify they fail**

```bash
pnpm test tests/unit/analysis/authority-table.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/analysis/authority-table'"

- [ ] **Step 3: Run again after Task 1 is done — verify they pass**

```bash
pnpm test tests/unit/analysis/authority-table.test.ts
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/analysis/authority-table.test.ts
git commit -m "test(authority): unit tests for authority-table helpers"
```

---

## Task 3: CitationsBarChart component

**Files:**
- Create: `components/features/authority/citations-bar-chart.tsx`

- [ ] **Step 1: Write the component**

This is a pure server component (no `'use client'`). Each bar is a CSS flex column — no SVG needed.

```tsx
// components/features/authority/citations-bar-chart.tsx

import { cn } from '@/lib/utils'
import type { EngineStats } from '@/lib/analysis/authority-table'

interface CitationsBarChartProps {
  stats: EngineStats[]
}

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: 'bg-emerald-500',
  claude: 'bg-violet-500',
  gemini: 'bg-blue-500',
  perplexity: 'bg-amber-500',
}

export function CitationsBarChart({ stats }: CitationsBarChartProps) {
  const maxPct = Math.max(...stats.map((s) => s.percentage), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Citations par moteur IA
      </h2>

      <div className="flex items-end justify-around gap-4">
        {stats.map((s) => (
          <div key={s.engine} className="flex flex-1 flex-col items-center gap-2">
            {/* Bar */}
            <div className="relative flex w-full flex-col items-center justify-end" style={{ height: 120 }}>
              <span className="mb-1 text-xs font-semibold tabular-nums text-foreground">
                {s.percentage}%
              </span>
              <div
                className={cn('w-full rounded-t-md transition-all', ENGINE_COLORS[s.engine] ?? 'bg-muted')}
                style={{ height: `${Math.round((s.percentage / maxPct) * 80)}px`, minHeight: s.percentage > 0 ? 4 : 0 }}
                aria-label={`${s.label} : ${s.cited}/${s.total} citations`}
              />
            </div>

            {/* Label */}
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {s.cited}/{s.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/features/authority/citations-bar-chart.tsx
git commit -m "feat(authority): add CitationsBarChart component"
```

---

## Task 4: ResponseDetailDialog component

**Files:**
- Create: `components/features/authority/response-detail-dialog.tsx`

- [ ] **Step 1: Write the component**

The dialog receives an open prop, the cell data, and the site URL. It highlights every occurrence of the client domain in the answer text.

```tsx
// components/features/authority/response-detail-dialog.tsx

'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ENGINE_LABELS } from '@/lib/analysis/authority-table'
import type { CellData } from '@/lib/analysis/authority-table'
import type { IAEngineName } from '@/lib/ai/connectors/base'

interface ResponseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cell: CellData | null
  promptText: string
  clientDomain: string
}

function highlightDomain(text: string, domain: string): React.ReactNode[] {
  if (!domain) return [text]
  const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? (
          <mark
            key={i}
            className="rounded bg-green-100 px-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          >
            {part}
          </mark>
        )
      : part
  )
}

const ENGINE_BADGE_COLORS: Record<IAEngineName, string> = {
  chatgpt: 'bg-emerald-100 text-emerald-800',
  claude: 'bg-violet-100 text-violet-800',
  gemini: 'bg-blue-100 text-blue-800',
  perplexity: 'bg-amber-100 text-amber-800',
}

export function ResponseDetailDialog({
  open,
  onOpenChange,
  cell,
  promptText,
  clientDomain,
}: ResponseDetailDialogProps) {
  if (!cell) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ENGINE_BADGE_COLORS[cell.engine]}`}
            >
              {ENGINE_LABELS[cell.engine]}
            </span>
            Réponse détaillée
          </DialogTitle>
        </DialogHeader>

        {/* Prompt */}
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider">Prompt</span>
          {promptText}
        </div>

        {/* Answer */}
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Réponse
          </span>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
            {highlightDomain(cell.answer, clientDomain)}
          </p>
        </div>

        {/* Sources */}
        {cell.sources.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sources citées ({cell.sources.length})
            </span>
            <ul className="space-y-1.5">
              {cell.sources.map((source) => (
                <li
                  key={source.id}
                  className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
                    source.isClientDomain
                      ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800/30 dark:bg-green-900/10 dark:text-green-300'
                      : 'border-border bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">{source.isClientDomain ? '✅' : '•'}</span>
                  <span className="min-w-0 break-all">{source.title ?? source.url}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/features/authority/response-detail-dialog.tsx
git commit -m "feat(authority): add ResponseDetailDialog with domain highlighting"
```

---

## Task 5: CitationsTable component

**Files:**
- Create: `components/features/authority/citations-table.tsx`

- [ ] **Step 1: Write the component**

Client component. Manages selected cell state and passes it to the dialog.

```tsx
// components/features/authority/citations-table.tsx

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { IA_ENGINES, ENGINE_LABELS } from '@/lib/analysis/authority-table'
import { ResponseDetailDialog } from '@/components/features/authority/response-detail-dialog'
import type { CrossTableRow, CellData } from '@/lib/analysis/authority-table'

interface CitationsTableProps {
  rows: CrossTableRow[]
  clientDomain: string
}

export function CitationsTable({ rows, clientDomain }: CitationsTableProps) {
  const [selected, setSelected] = useState<{ cell: CellData; promptText: string } | null>(null)

  if (rows.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Aucune réponse enregistrée pour cette analyse.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prompt
              </th>
              {IA_ENGINES.map((engine) => (
                <th
                  key={engine}
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {ENGINE_LABELS[engine]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row.promptId}
                className={cn(
                  'border-b border-border last:border-0',
                  rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                <td className="max-w-xs px-4 py-3 text-xs text-foreground">
                  <span className="line-clamp-2">{row.promptText}</span>
                </td>
                {IA_ENGINES.map((engine) => {
                  const cell = row.cells[engine]
                  return (
                    <td key={engine} className="px-4 py-3 text-center">
                      {cell ? (
                        <button
                          type="button"
                          onClick={() => setSelected({ cell, promptText: row.promptText })}
                          className={cn(
                            'inline-flex items-center justify-center rounded-md px-2 py-1 text-base transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          )}
                          title="Voir la réponse complète"
                          aria-label={`Voir réponse ${ENGINE_LABELS[engine]} pour : ${row.promptText}`}
                        >
                          {cell.partial ? '⚠️' : cell.cited ? '✅' : '❌'}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ResponseDetailDialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
        cell={selected?.cell ?? null}
        promptText={selected?.promptText ?? ''}
        clientDomain={clientDomain}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/features/authority/citations-table.tsx
git commit -m "feat(authority): add CitationsTable with dialog integration"
```

---

## Task 6: RunAuthorityButton component

**Files:**
- Create: `components/features/authority/run-authority-button.tsx`

- [ ] **Step 1: Write the component**

Reuses `runAnalysisAction` from `analysis-actions.ts`. On success, refreshes the current route (no redirect — the user is already on the authority page).

```tsx
// components/features/authority/run-authority-button.tsx

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAnalysisAction } from '@/app/(app)/sites/[siteId]/analysis-actions'

interface RunAuthorityButtonProps {
  siteId: string
}

export function RunAuthorityButton({ siteId }: RunAuthorityButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await runAnalysisAction(siteId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setLaunched(true)
      router.refresh()
    })
  }

  if (launched) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle size={16} className="shrink-0" />
        Analyse Autorité relancée — la page se mettra à jour automatiquement.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
        {isPending ? 'Lancement en cours…' : 'Relancer analyse Autorité'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/features/authority/run-authority-button.tsx
git commit -m "feat(authority): add RunAuthorityButton component"
```

---

## Task 7: Authority page

**Files:**
- Create: `app/(app)/sites/[siteId]/authority/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// app/(app)/sites/[siteId]/authority/page.tsx

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getAuthorityResultsByAnalysisId } from '@/lib/db/queries/authority-results'
import { buildEngineStats, buildCrossTable } from '@/lib/analysis/authority-table'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { Skeleton } from '@/components/ui/skeleton'
import { CitationsBarChart } from '@/components/features/authority/citations-bar-chart'
import { CitationsTable } from '@/components/features/authority/citations-table'
import { RunAuthorityButton } from '@/components/features/authority/run-authority-button'
import { OverviewPolling } from '@/components/features/overview/overview-polling'

export const metadata: Metadata = {
  title: 'Autorité — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function AuthorityPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const latest = await getLatestAnalysis(siteId)

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

  const rawResults =
    latest.status === 'success'
      ? await getAuthorityResultsByAnalysisId(latest.id)
      : []

  const engineStats = buildEngineStats(rawResults)
  const crossTableRows = buildCrossTable(rawResults)
  const clientDomain = extractDomain(site.url)

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <OverviewPolling status={latest.status} />

      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
        </div>
      )}

      {/* Score Autorité */}
      <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score Autorité
        </p>
        {isInProgress ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-32 w-32 rounded-full" />
            <p className="text-sm text-muted-foreground">Analyse en cours…</p>
          </div>
        ) : latest.authorityScore !== null ? (
          <ScoreGauge score={latest.authorityScore} size="lg" />
        ) : (
          <p className="text-sm text-muted-foreground">Score non disponible</p>
        )}
      </section>

      {/* Bar chart */}
      {isInProgress ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : latest.status === 'success' ? (
        <CitationsBarChart stats={engineStats} />
      ) : null}

      {/* Cross-table */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Réponses par prompt et par IA
        </h2>
        {isInProgress ? (
          <div className="space-y-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ) : latest.status === 'success' ? (
          <CitationsTable rows={crossTableRows} clientDomain={clientDomain} />
        ) : null}
      </section>

      {/* Relancer */}
      <section className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4 shadow-sm">
        <div>
          <p className="text-sm font-medium text-foreground">Nouvelle analyse</p>
          <p className="text-xs text-muted-foreground">
            Relance uniquement la phase Autorité (prompts × moteurs IA).
          </p>
        </div>
        <RunAuthorityButton siteId={siteId} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors. Fix any type errors before moving on.

- [ ] **Step 3: Start dev server and verify the page loads**

```bash
pnpm dev
```

Visit `http://localhost:3000/sites/<any-siteId>/authority`. Verify:
- No analysis: link to discovery appears
- Analysis in-progress: skeletons render, polling component active
- Analysis success: score gauge, bar chart, and table all render
- Clicking a table cell opens the dialog
- Client domain mentions appear in green
- "Relancer" button triggers the action without navigating away

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/sites/\[siteId\]/authority/page.tsx
git commit -m "feat(authority): build authority tab page (TKT-018)"
```

---

## Task 8: Final checks

- [ ] **Run full QA suite**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: all three pass with 0 errors. Fix any issues before continuing.

- [ ] **Commit any lint/format fixes**

```bash
git add -A
git commit -m "chore: fix lint/format issues in authority tab"
```

---

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Client domain cited in this response |
| ❌ | Client domain not cited |
| ⚠️ | Partial response (sources may be incomplete) |
| — | No result recorded for this engine × prompt pair |
