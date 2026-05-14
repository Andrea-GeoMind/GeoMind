# TKT-023 — Recommandations statiques Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pour chaque issue (technique + contenu) d'une analyse, générer via Claude Haiku une fiche recommandation Markdown et la persister en DB avec `variant = 'simplified'`.

**Architecture:** Table `recommendations` polymorphe (discriminant `issue_type` + `issue_id` UUID sans FK, contrainte `unique(issue_id, variant)`). `generateRecommendations(siteId, analysisId)` lit toutes les issues, appelle Haiku via `callStructured` avec un pool ≤ 5 parallèles, stocke en DB. Le stub Inngest existant est remplacé par la vraie implémentation.

**Tech Stack:** Drizzle ORM, Zod, `callStructured` (lib/ai/structured.ts), Claude Haiku via OpenRouter, Inngest

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `lib/db/schema.ts` | Ajouter enum `recommendationIssueTypeEnum`, table `recommendations`, relation |
| `drizzle/` | Migration générée par `pnpm db:generate` |
| `lib/ai/prompts/recommendations.ts` | Réécrire — prompt par issue (remplace l'ancien prompt par scores) |
| `lib/ai/schemas.ts` | Ajouter `RecommendationOutputSchema` |
| `lib/analysis/recommendations.ts` | Remplacer le stub — vraie génération + insertion DB |
| `lib/db/queries/recommendations.ts` | Créer — `insertRecommendations`, `getRecommendationByIssueId` |
| `tests/unit/analysis/recommendations.test.ts` | Créer — tests unitaires |

> `lib/inngest/functions/run-full-analysis.ts` appelle déjà `generateRecommendations(siteId, analysisId)` — **aucun changement à faire** dans ce fichier.

---

## Task 1 : Schema DB — table `recommendations`

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1 : Lire le schéma existant** pour identifier l'emplacement exact où insérer

```
lib/db/schema.ts — après le bloc contentIssues (ligne ~254), avant les Relations
```

- [ ] **Step 2 : Ajouter l'enum et la table**

Dans `lib/db/schema.ts`, après la définition de `contentIssues` et avant `// ─── Relations ────`:

```typescript
// ─── recommendations ──────────────────────────────────────────────────────────
// Fiches recommandation générées par LLM pour chaque issue.
// Polymorphe : issue_type discrimine entre technical_issues et content_issues.
// variant 'simplified' = Haiku ; 'complete' = Sonnet (TKT-024).

export const recommendationIssueTypeEnum = pgEnum('recommendation_issue_type', [
  'technical',
  'content',
])

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    issueType: recommendationIssueTypeEnum('issue_type').notNull(),
    issueId: uuid('issue_id').notNull(),
    variant: text('variant').notNull().default('simplified'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    issueVariantUnique: unique().on(table.issueId, table.variant),
  }),
)
```

- [ ] **Step 3 : Ajouter la relation dans `analysesRelations`**

Dans le bloc `analysesRelations`, ajouter `recommendations: many(recommendations)` :

```typescript
export const analysesRelations = relations(analyses, ({ one, many }) => ({
  site: one(sites, { fields: [analyses.siteId], references: [sites.id] }),
  profile: one(profiles, { fields: [analyses.userId], references: [profiles.id] }),
  authorityResults: many(authorityResults),
  technicalIssues: many(technicalIssues),
  contentIssues: many(contentIssues),
  recommendations: many(recommendations),
}))
```

Et ajouter la relation inverse en fin de fichier :

```typescript
export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  analysis: one(analyses, {
    fields: [recommendations.analysisId],
    references: [analyses.id],
  }),
}))
```

- [ ] **Step 4 : Générer la migration**

```bash
cd <repo-root> && pnpm db:generate
```

Vérifier qu'un fichier `drizzle/0003_recommendations.sql` (ou numéro suivant) est créé avec `CREATE TABLE recommendations` et `CREATE UNIQUE INDEX`.

- [ ] **Step 5 : Appliquer en dev**

```bash
pnpm db:push
```

Expected : `All changes applied`.

- [ ] **Step 6 : Typecheck**

```bash
pnpm typecheck
```

Expected : zéro erreur.

- [ ] **Step 7 : Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(db): add recommendations table with polymorphic issue_type"
```

---

## Task 2 : Schema Zod + Prompt per-issue

**Files:**
- Modify: `lib/ai/schemas.ts`
- Rewrite: `lib/ai/prompts/recommendations.ts`

- [ ] **Step 1 : Ajouter `RecommendationOutputSchema` dans `lib/ai/schemas.ts`**

Lire le fichier existant pour connaître son contenu, puis ajouter à la fin :

```typescript
// Schéma de sortie LLM pour une fiche recommandation par issue (TKT-023)
export const RecommendationOutputSchema = z.object({
  content: z.string().min(20),
})
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>
```

- [ ] **Step 2 : Réécrire `lib/ai/prompts/recommendations.ts`**

```typescript
// Prompts LLM pour la génération de fiches recommandation par issue GEO.
// Règle CLAUDE.md §5 : tous les prompts sont ici, versionnés.

export function buildRecommendationSystemPrompt(): string {
  return `Tu es un expert en GEO (Generative Engine Optimization) et en référencement.
Tu génères des fiches recommandation courtes, actionnables et compréhensibles par un non-technicien.
Ton ton est direct, positif et pédagogique. Tu réponds en français.
Format de sortie : JSON avec une seule clé "content" contenant le Markdown.`
}

export function buildRecommendationUserMessage(issue: {
  title: string
  description: string
  ruleKey: string
}): string {
  return `Point faible détecté : ${issue.title}
Règle : ${issue.ruleKey}
Détail : ${issue.description}

Génère une fiche recommandation en Markdown avec ces 3 sections :
## Comment corriger
(2-4 étapes concrètes)

## Impact attendu
(1-2 phrases sur ce que ça améliore pour la visibilité IA)

## Effort estimé
(une ligne : Rapide / Quelques heures / Effort important)

Retourne UNIQUEMENT le JSON : {"content": "...markdown..."}`
}
```

- [ ] **Step 3 : Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 4 : Commit**

```bash
git add lib/ai/schemas.ts lib/ai/prompts/recommendations.ts
git commit -m "feat(ai): prompt + schema Zod pour recommandations par issue"
```

---

## Task 3 : Query DB — `lib/db/queries/recommendations.ts`

**Files:**
- Create: `lib/db/queries/recommendations.ts`

- [ ] **Step 1 : Écrire les tests**

Créer `tests/unit/analysis/recommendations.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import {
  buildInsertPayloads,
  type RecommendationInsert,
} from '@/lib/analysis/recommendations'

describe('buildInsertPayloads', () => {
  it('retourne un payload par issue technique', () => {
    const payloads = buildInsertPayloads('analysis-1', [
      { id: 'tech-1', type: 'technical', content: '## How\nFix it.' },
    ])
    expect(payloads).toHaveLength(1)
    expect(payloads[0]).toMatchObject({
      analysisId: 'analysis-1',
      issueType: 'technical',
      issueId: 'tech-1',
      variant: 'simplified',
      content: '## How\nFix it.',
    })
  })

  it('retourne un payload par issue contenu', () => {
    const payloads = buildInsertPayloads('analysis-1', [
      { id: 'cont-1', type: 'content', content: '## How\nFix content.' },
    ])
    expect(payloads[0]).toMatchObject({
      issueType: 'content',
      issueId: 'cont-1',
    })
  })

  it('retourne [] si aucune issue', () => {
    expect(buildInsertPayloads('analysis-1', [])).toHaveLength(0)
  })
})
```

- [ ] **Step 2 : Lancer le test — s'assurer qu'il échoue**

```bash
pnpm test tests/unit/analysis/recommendations.test.ts
```

Expected : FAIL — `buildInsertPayloads` n'est pas encore défini.

- [ ] **Step 3 : Créer `lib/db/queries/recommendations.ts`**

```typescript
import { db } from '@/lib/db/client'
import { recommendations } from '@/lib/db/schema'
import type { InferInsertModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'

export type RecommendationInsertRow = InferInsertModel<typeof recommendations>

export async function insertRecommendations(rows: RecommendationInsertRow[]) {
  if (rows.length === 0) return []
  return db
    .insert(recommendations)
    .values(rows)
    .onConflictDoNothing()
    .returning()
}

export async function getRecommendationByIssueId(
  issueId: string,
  variant = 'simplified',
) {
  return db.query.recommendations.findFirst({
    where: (r, { and, eq: eq_ }) =>
      and(eq_(r.issueId, issueId), eq_(r.variant, variant)),
  })
}
```

- [ ] **Step 4 : Re-lancer les tests — ils doivent passer**

```bash
pnpm test tests/unit/analysis/recommendations.test.ts
```

Expected : PASS — mais les tests testent `buildInsertPayloads` depuis `lib/analysis/recommendations.ts`, pas encore créé. Continuer à Task 4.

---

## Task 4 : `lib/analysis/recommendations.ts` — vraie implémentation

**Files:**
- Rewrite: `lib/analysis/recommendations.ts`

- [ ] **Step 1 : Écrire l'implémentation**

```typescript
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { insertRecommendations } from '@/lib/db/queries/recommendations'
import { callStructured } from '@/lib/ai/structured'
import { RecommendationOutputSchema } from '@/lib/ai/schemas'
import {
  buildRecommendationSystemPrompt,
  buildRecommendationUserMessage,
} from '@/lib/ai/prompts/recommendations'
import { logEstimatedBatchCost } from '@/lib/ai/cost'

const RECOMMENDATION_MODEL = 'anthropic/claude-haiku-4-5'
const CONCURRENCY_LIMIT = 5
// Estimation conservative : 200 tokens input, 400 tokens output par issue
const EST_INPUT_TOKENS = 200
const EST_OUTPUT_TOKENS = 400

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IssueForRecommendation {
  id: string
  type: 'technical' | 'content'
  content: string
}

export interface RecommendationInsert {
  analysisId: string
  issueType: 'technical' | 'content'
  issueId: string
  variant: string
  content: string
}

// ─── Pure helpers (testables) ────────────────────────────────────────────────

export function buildInsertPayloads(
  analysisId: string,
  results: IssueForRecommendation[],
): RecommendationInsert[] {
  return results.map((r) => ({
    analysisId,
    issueType: r.type,
    issueId: r.id,
    variant: 'simplified',
    content: r.content,
  }))
}

// ─── Pool helper ─────────────────────────────────────────────────────────────

async function runWithPool<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = []
  let i = 0

  async function worker(): Promise<void> {
    while (i < tasks.length) {
      const index = i++
      results[index] = await tasks[index]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generateRecommendations(
  _siteId: string,
  analysisId: string,
): Promise<void> {
  const [technicalIssues, contentIssues] = await Promise.all([
    getTechnicalIssuesByAnalysisId(analysisId),
    getContentIssuesByAnalysisId(analysisId),
  ])

  const allIssues = [
    ...technicalIssues.map((i) => ({ ...i, issueType: 'technical' as const })),
    ...contentIssues.map((i) => ({ ...i, issueType: 'content' as const })),
  ]

  if (allIssues.length === 0) return

  logEstimatedBatchCost(
    allIssues.map(() => ({
      model: RECOMMENDATION_MODEL,
      estimatedInputTokens: EST_INPUT_TOKENS,
      estimatedOutputTokens: EST_OUTPUT_TOKENS,
    })),
  )

  const systemPrompt = buildRecommendationSystemPrompt()

  const tasks = allIssues.map((issue) => async (): Promise<IssueForRecommendation> => {
    const { data } = await callStructured({
      systemPrompt,
      userContent: buildRecommendationUserMessage({
        title: issue.title,
        description: issue.description,
        ruleKey: issue.ruleKey,
      }),
      schema: RecommendationOutputSchema,
      model: RECOMMENDATION_MODEL,
    })
    return { id: issue.id, type: issue.issueType, content: data.content }
  })

  const results = await runWithPool(tasks, CONCURRENCY_LIMIT)

  const payloads = buildInsertPayloads(analysisId, results)
  await insertRecommendations(payloads)
}
```

- [ ] **Step 2 : Lancer les tests unitaires**

```bash
pnpm test tests/unit/analysis/recommendations.test.ts
```

Expected : PASS (3 tests).

- [ ] **Step 3 : Typecheck complet**

```bash
pnpm typecheck
```

Expected : zéro erreur.

- [ ] **Step 4 : Lancer tous les tests**

```bash
pnpm test
```

Expected : tous les tests précédents toujours verts + 3 nouveaux.

- [ ] **Step 5 : Commit**

```bash
git add lib/analysis/recommendations.ts lib/db/queries/recommendations.ts tests/unit/analysis/recommendations.test.ts
git commit -m "feat(analysis): generateRecommendations — Haiku par issue, pool ≤5, insert DB"
```

---

## Task 5 : Vérification finale

- [ ] **Step 1 : Lint**

```bash
pnpm lint
```

Expected : aucune erreur.

- [ ] **Step 2 : Tests complets**

```bash
pnpm test
```

Expected : tous verts, ≥ 292 tests (289 + 3 nouveaux).

- [ ] **Step 3 : Typecheck**

```bash
pnpm typecheck
```

Expected : 0 erreur.

- [ ] **Step 4 : Vérifier la migration SQL**

```bash
cat drizzle/0003_*.sql  # ou le numéro suivant
```

Expected : contient `CREATE TABLE recommendations`, `recommendation_issue_type` enum, `CREATE UNIQUE INDEX` sur `(issue_id, variant)`.

---

## Checklist spec-coverage

| Critère | Tâche |
|---|---|
| Table `recommendations` en DB | Task 1 |
| Toutes les issues ont une reco `simplified` après analyse | Task 4 — `generateRecommendations` lit technical + content issues, génère pour chacune |
| Contenu Markdown, lisible, langage simple | Task 2 — prompt impose format Markdown avec 3 sections |
| Appel via Haiku | Task 4 — `RECOMMENDATION_MODEL = 'anthropic/claude-haiku-4-5'` |
| Step Inngest `run-recommendations` | Déjà câblé dans `run-full-analysis.ts` — appelle `generateRecommendations` |
| Log coût avant batch | Task 4 — `logEstimatedBatchCost` |
| Pas de Promise.all non plafonné | Task 4 — `runWithPool(tasks, 5)` |
| Idempotence (retry safe) | Task 3 — `onConflictDoNothing()` |
| Sorties LLM validées Zod | Task 2 + 4 — `RecommendationOutputSchema` |
