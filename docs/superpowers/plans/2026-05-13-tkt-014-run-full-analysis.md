# TKT-014 — Full Analysis Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `lib/inngest/functions/run-full-analysis.ts`, an Inngest orchestrator that drives an analysis through crawl → discovery (skip if done) → authority → technical + content (parallel) → recommendations → scoring → publishers, updating status and scores in DB at each step, without consuming quota on failure.

**Architecture:** A single Inngest function triggered by `analysis.full.requested` wraps each phase in its own `step.run()` so Inngest checkpoints between steps and safely replays on crash. Technical and content run in parallel via `Promise.all([step.run(…), step.run(…)])`. Scoring is a pure function in `lib/analysis/scoring.ts` (no DB access, testable in isolation). Technical, content, publishers, and recommendations are stubs returning fixed values; they will be fleshed out in later tickets.

**Tech Stack:** Inngest SDK v3, Drizzle ORM, Vitest, TypeScript strict.

---

## File map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `lib/db/queries/analyses.ts` | Add `updateAnalysisScores`; fix quota count to exclude `error` rows |
| Create | `lib/analysis/scoring.ts` | Pure function: AuthorityData + technicalScore + contentScore → 4 scores |
| Create | `tests/unit/analysis/scoring.test.ts` | Unit tests for scoring (pure, no mocks needed) |
| Create | `lib/analysis/technical/index.ts` | Stub: returns `{ score: 80, issueCount: 0 }` |
| Create | `lib/analysis/content/index.ts` | Stub: returns `{ score: 80, issueCount: 0 }` |
| Create | `lib/analysis/publishers.ts` | Stub: no-op async function |
| Create | `lib/analysis/recommendations.ts` | Stub: no-op async function |
| Create | `lib/ai/prompts/recommendations.ts` | Prompt template (used by future recommendations runner) |
| Create | `lib/inngest/functions/run-full-analysis.ts` | Main orchestrator |
| Modify | `app/api/inngest/route.ts` | Register `runFullAnalysisFunction` |

---

## Task 1 — Fix quota counting + add `updateAnalysisScores`

**Files:**
- Modify: `lib/db/queries/analyses.ts`

The current `countAnalysesThisMonth` counts ALL analyses including `error` ones, meaning a failed analysis permanently consumes quota. We must exclude `error` rows. We also need `updateAnalysisScores` to persist all 4 scores in one shot and atomically mark `success`.

- [ ] **Step 1: Read the current file**

```bash
# Confirm current content before editing
head -70 lib/db/queries/analyses.ts
```

- [ ] **Step 2: Apply changes to `lib/db/queries/analyses.ts`**

Replace the entire file with the version below. Changes: (a) add `ne` to drizzle imports; (b) filter out `error` rows in `countAnalysesThisMonth`; (c) add `updateAnalysisScores`.

```typescript
import { and, count, desc, eq, gte, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { analyses } from '@/lib/db/schema'

export type AnalysisInsert = {
  siteId: string
  userId: string
}

export type AnalysisStatus = 'pending' | 'running' | 'success' | 'error'

export async function createAnalysis(data: AnalysisInsert) {
  const [row] = await db.insert(analyses).values(data).returning()
  return row
}

export async function getAnalysisById(id: string) {
  return db.query.analyses.findFirst({ where: eq(analyses.id, id) })
}

export async function getAnalysesBySiteId(siteId: string) {
  return db.select().from(analyses).where(eq(analyses.siteId, siteId)).orderBy(desc(analyses.createdAt))
}

export async function updateAnalysisStatus(
  id: string,
  status: AnalysisStatus,
  errorMessage?: string
) {
  const [row] = await db
    .update(analyses)
    .set({
      status,
      errorMessage: errorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

export async function updateAnalysisAuthorityScore(id: string, authorityScore: number) {
  const [row] = await db
    .update(analyses)
    .set({ authorityScore, updatedAt: new Date() })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

export interface AnalysisScores {
  globalScore: number
  authorityScore: number
  technicalScore: number
  contentScore: number
}

// Persists all 4 scores and atomically marks the analysis as success.
export async function updateAnalysisScores(id: string, scores: AnalysisScores) {
  const [row] = await db
    .update(analyses)
    .set({
      ...scores,
      status: 'success',
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(analyses.id, id))
    .returning()
  return row
}

// Excludes `error` rows: a failed analysis must not count against the monthly quota.
export async function countAnalysesThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [result] = await db
    .select({ value: count() })
    .from(analyses)
    .where(
      and(
        eq(analyses.userId, userId),
        gte(analyses.createdAt, startOfMonth),
        ne(analyses.status, 'error')
      )
    )

  return result?.value ?? 0
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/db/queries/analyses.ts
git commit -m "feat(db): add updateAnalysisScores, exclude error rows from quota count"
```

---

## Task 2 — Pure scoring function + unit tests

**Files:**
- Create: `lib/analysis/scoring.ts`
- Create: `tests/unit/analysis/scoring.test.ts`

Scoring must be pure (no DB, no network), testable, and idempotent. Same inputs always produce the same outputs.

- [ ] **Step 1: Write the failing test first**

Create `tests/unit/analysis/scoring.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeScores } from '@/lib/analysis/scoring'

describe('computeScores', () => {
  it('returns 0 global score when no authority calls were made', () => {
    const result = computeScores(
      { successfulCalls: 0, clientCitationsFound: 0 },
      80,
      80
    )
    expect(result.globalScore).toBe(0)
    expect(result.authorityScore).toBe(0)
  })

  it('returns 100 authority score when every IA response cites the client', () => {
    const result = computeScores(
      { successfulCalls: 10, clientCitationsFound: 10 },
      80,
      80
    )
    expect(result.authorityScore).toBe(100)
  })

  it('returns 50 authority score when half of IA responses cite the client', () => {
    const result = computeScores(
      { successfulCalls: 10, clientCitationsFound: 5 },
      80,
      80
    )
    expect(result.authorityScore).toBe(50)
  })

  it('global score is the mean of the 3 pillar scores', () => {
    // authority = 50, technical = 80, content = 80 → mean = 70
    const result = computeScores(
      { successfulCalls: 10, clientCitationsFound: 5 },
      80,
      80
    )
    expect(result.globalScore).toBe(Math.round((50 + 80 + 80) / 3))
  })

  it('clamps scores to [0, 100]', () => {
    const result = computeScores(
      { successfulCalls: 1, clientCitationsFound: 0 },
      -10,   // technically impossible but guard against it
      110
    )
    expect(result.technicalScore).toBe(0)
    expect(result.contentScore).toBe(100)
    expect(result.globalScore).toBeGreaterThanOrEqual(0)
    expect(result.globalScore).toBeLessThanOrEqual(100)
  })

  it('passes technical and content scores through unchanged (within bounds)', () => {
    const result = computeScores(
      { successfulCalls: 4, clientCitationsFound: 2 },
      65,
      72
    )
    expect(result.technicalScore).toBe(65)
    expect(result.contentScore).toBe(72)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test tests/unit/analysis/scoring.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/analysis/scoring'".

- [ ] **Step 3: Implement `lib/analysis/scoring.ts`**

```typescript
export interface AuthorityData {
  successfulCalls: number
  clientCitationsFound: number
}

export interface Scores {
  globalScore: number
  authorityScore: number
  technicalScore: number
  contentScore: number
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Pure function — same inputs always produce the same outputs.
// authorityData comes from runAuthorityAnalysis return value.
// technicalScore and contentScore come from their respective analysis runners.
export function computeScores(
  authorityData: AuthorityData,
  technicalScore: number,
  contentScore: number
): Scores {
  const authorityScore =
    authorityData.successfulCalls > 0
      ? (authorityData.clientCitationsFound / authorityData.successfulCalls) * 100
      : 0

  const globalScore = (authorityScore + technicalScore + contentScore) / 3

  return {
    globalScore: clamp(globalScore),
    authorityScore: clamp(authorityScore),
    technicalScore: clamp(technicalScore),
    contentScore: clamp(contentScore),
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test tests/unit/analysis/scoring.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git add lib/analysis/scoring.ts tests/unit/analysis/scoring.test.ts
git commit -m "feat(analysis): pure scoring function + unit tests"
```

---

## Task 3 — Analysis stubs (technical, content, publishers, recommendations)

**Files:**
- Create: `lib/analysis/technical/index.ts`
- Create: `lib/analysis/content/index.ts`
- Create: `lib/analysis/publishers.ts`
- Create: `lib/analysis/recommendations.ts`
- Create: `lib/ai/prompts/recommendations.ts`

These stubs define the interface the orchestrator calls. Future tickets will replace the bodies with real logic without changing the signatures.

- [ ] **Step 1: Create `lib/analysis/technical/index.ts`**

```typescript
// Stub — real GEO technical rules implemented in TKT-015.
export interface TechnicalAnalysisResult {
  score: number
  issueCount: number
}

export async function runTechnicalAnalysis(
  _siteId: string
): Promise<TechnicalAnalysisResult> {
  return { score: 80, issueCount: 0 }
}
```

- [ ] **Step 2: Create `lib/analysis/content/index.ts`**

```typescript
// Stub — real GEO content rules implemented in TKT-016.
export interface ContentAnalysisResult {
  score: number
  issueCount: number
}

export async function runContentAnalysis(
  _siteId: string
): Promise<ContentAnalysisResult> {
  return { score: 80, issueCount: 0 }
}
```

- [ ] **Step 3: Create `lib/ai/prompts/recommendations.ts`**

```typescript
// Prompt template used by the recommendations runner to generate
// actionable GEO improvement suggestions based on pillar scores.
export function buildRecommendationsSystemPrompt(): string {
  return `Tu es un expert en GEO (Generative Engine Optimization). 
À partir des scores d'une analyse GEO, génère des recommandations actionnables 
en français pour améliorer la visibilité du site dans les moteurs de réponses IA.
Classe les recommandations par ordre de priorité décroissante.`
}

export function buildRecommendationsUserMessage(scores: {
  authorityScore: number
  technicalScore: number
  contentScore: number
}): string {
  return `Scores GEO :
- Autorité : ${scores.authorityScore}/100
- Technique : ${scores.technicalScore}/100
- Contenu : ${scores.contentScore}/100

Génère 5 recommandations prioritaires pour améliorer ces scores.`
}
```

- [ ] **Step 4: Create `lib/analysis/recommendations.ts`**

```typescript
// Stub — real recommendations generation implemented in TKT-017.
export async function generateRecommendations(
  _siteId: string,
  _analysisId: string
): Promise<void> {
  // No-op until TKT-017
}
```

- [ ] **Step 5: Create `lib/analysis/publishers.ts`**

```typescript
// Stub — real publisher detection implemented in TKT-018.
export async function detectPublishers(
  _siteId: string,
  _analysisId: string
): Promise<void> {
  // No-op until TKT-018
}
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add lib/analysis/technical/index.ts lib/analysis/content/index.ts \
        lib/analysis/publishers.ts lib/analysis/recommendations.ts \
        lib/ai/prompts/recommendations.ts
git commit -m "feat(analysis): stubs for technical, content, publishers, recommendations"
```

---

## Task 4 — Main orchestrator `run-full-analysis.ts`

**Files:**
- Create: `lib/inngest/functions/run-full-analysis.ts`

This is the core of the ticket. One Inngest function, triggered by `analysis.full.requested`, orchestrates every phase via `step.run()`. Inngest checkpoints after each step; if the process crashes mid-way, it replays from the last successful checkpoint without re-running earlier steps.

Key invariants to preserve:
- Status is set to `running` as the very first step.
- Any thrown error in the try block is caught: status → `error` + message stored, then re-thrown (so Inngest marks the run as failed and can alert).
- `updateAnalysisScores` writes all 4 scores AND sets status → `success` in one DB call (atomic).
- Discovery is skipped if `site_metadata` already exists for the site (idempotent re-runs).
- Technical + content use `Promise.all` to run in parallel within the same Inngest step checkpoint cycle.

- [ ] **Step 1: Create the file**

```typescript
import { inngest } from '@/lib/inngest/client'
import { crawlSite } from '@/lib/crawl/firecrawl'
import { runDiscovery } from '@/lib/analysis/discovery'
import { runAuthorityAnalysis } from '@/lib/analysis/authority'
import { runTechnicalAnalysis } from '@/lib/analysis/technical'
import { runContentAnalysis } from '@/lib/analysis/content'
import { generateRecommendations } from '@/lib/analysis/recommendations'
import { detectPublishers } from '@/lib/analysis/publishers'
import { computeScores } from '@/lib/analysis/scoring'
import { updateAnalysisStatus, updateAnalysisScores } from '@/lib/db/queries/analyses'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'

const DEFAULT_MAX_PAGES = 20

export const runFullAnalysisFunction = inngest.createFunction(
  { id: 'run-full-analysis', triggers: [{ event: 'analysis.full.requested' }] },
  async ({ event, step }) => {
    const { analysisId, siteId } = event.data as {
      analysisId: string
      siteId: string
    }

    await step.run('mark-running', () => updateAnalysisStatus(analysisId, 'running'))

    try {
      // 1. Crawl (always refreshed on each analysis)
      await step.run('crawl', () => crawlSite({ siteId, maxPages: DEFAULT_MAX_PAGES }))

      // 2. Discovery — skip if site_metadata already exists
      const existingMetadata = await step.run('check-discovery', () =>
        getSiteMetadataBySiteId(siteId)
      )
      if (!existingMetadata) {
        await step.run('run-discovery', () => runDiscovery(siteId))
      }

      // 3. Authority analysis
      const authorityResult = await step.run('run-authority', () =>
        runAuthorityAnalysis(analysisId)
      )

      // 4. Technical + Content in parallel
      const [technicalResult, contentResult] = await Promise.all([
        step.run('run-technical', () => runTechnicalAnalysis(siteId)),
        step.run('run-content', () => runContentAnalysis(siteId)),
      ])

      // 5. Recommendations (stub for now)
      await step.run('run-recommendations', () =>
        generateRecommendations(siteId, analysisId)
      )

      // 6. Scoring (pure function — no DB access)
      const scores = computeScores(
        {
          successfulCalls: authorityResult.successfulCalls,
          clientCitationsFound: authorityResult.clientCitationsFound,
        },
        technicalResult.score,
        contentResult.score
      )

      // 7. Publishers (stub for now)
      await step.run('run-publishers', () => detectPublishers(siteId, analysisId))

      // 8. Persist scores + mark success atomically
      await step.run('mark-success', () => updateAnalysisScores(analysisId, scores))

      return scores
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await step.run('mark-error', () =>
        updateAnalysisStatus(analysisId, 'error', message)
      )
      throw err
    }
  }
)
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. If TypeScript complains about `Promise.all` with `step.run`, it is a known Inngest v3 pattern and the types are correct.

- [ ] **Step 3: Commit**

```bash
git add lib/inngest/functions/run-full-analysis.ts
git commit -m "feat(inngest): run-full-analysis orchestrator — TKT-014"
```

---

## Task 5 — Register function in Inngest route

**Files:**
- Modify: `app/api/inngest/route.ts`

- [ ] **Step 1: Update the route**

```typescript
import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { crawlSiteFunction } from '@/lib/inngest/functions/crawl-site'
import { runDiscoveryFunction } from '@/lib/inngest/functions/run-discovery'
import { runAuthorityAnalysisFunction } from '@/lib/inngest/functions/run-authority-analysis'
import { runFullAnalysisFunction } from '@/lib/inngest/functions/run-full-analysis'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    crawlSiteFunction,
    runDiscoveryFunction,
    runAuthorityAnalysisFunction,
    runFullAnalysisFunction,
  ],
})
```

- [ ] **Step 2: Typecheck + lint + test**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: all green. If ESLint complains about unused imports or ordering, fix per project conventions (external → `@/` → relative).

- [ ] **Step 3: Commit**

```bash
git add app/api/inngest/route.ts
git commit -m "feat(inngest): register runFullAnalysisFunction in route"
```

---

## Task 6 — Final verification

- [ ] **Step 1: Full check**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected output:
- `typecheck`: exit 0, zero errors
- `lint`: exit 0, zero warnings
- `test`: all suites pass including the new `scoring.test.ts`

- [ ] **Step 2: Verify event name is consistent**

The orchestrator listens on `analysis.full.requested`. Confirm no other file in the codebase sends this event yet (it will be sent by the Server Action that launches an analysis, wired in a later ticket).

```bash
grep -r "analysis.full.requested" . --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next
```

Expected: only `lib/inngest/functions/run-full-analysis.ts` appears.

- [ ] **Step 3: Verify stubs compile and are importable**

```bash
node -e "require('./lib/analysis/technical/index.ts')" 2>&1 || \
  pnpm exec tsx -e "import './lib/analysis/technical/index'"
```

If tsx isn't available, the typecheck step above already confirmed compilation. Skip this step if typecheck passed.

- [ ] **Step 4: Final commit if any fixups remain**

```bash
git status
# If clean, nothing to do.
```

---

## Self-review: spec coverage checklist

| Requirement | Task |
|---|---|
| Crawl → discovery → authority → technical → content → recommendations → scoring → publishers | Task 4 (orchestrator step order) |
| Discovery skipped if already done | Task 4 (`check-discovery` step + `getSiteMetadataBySiteId`) |
| Status updated at each step (`running` then `success` or `error`) | Task 4 (`mark-running`, `mark-error`, `mark-success`) |
| Error sets `error` status with message in DB | Task 4 (catch block → `updateAnalysisStatus(id, 'error', message)`) |
| Quota not decremented on error | Task 1 (`ne(analyses.status, 'error')` in `countAnalysesThisMonth`) |
| Scores persisted | Tasks 1+4 (`updateAnalysisScores` + orchestrator step 8) |
| Scoring is pure and tested | Task 2 |
