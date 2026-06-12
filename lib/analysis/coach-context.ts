/**
 * Construit le contexte injecté dans le system prompt de GEO (§16.4).
 * Budget tokens discipliné : top 5 issues, 8 mots-clés, 5 concurrents,
 * diff N vs N-1 compact, mémoire ≤ 800 caractères.
 */
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { getCompetitorsBySiteId } from '@/lib/db/queries/competitors'
import { getCoachMemory } from '@/lib/db/queries/coach'
import { getPriorityAction } from '@/lib/analysis/scoring'
import { canUseCoachMemory } from '@/lib/quotas'
import type { CoachContext, CoachComparison, CoachIssueSummary } from '@/lib/ai/prompts/coach'

const SEVERITY_ORDER: Record<string, number> = { major: 0, moderate: 1, minor: 2, opportunity: 3 }

interface BuildOptions {
  userId: string
  focusedIssue?: { title: string; description: string } | null
}

export async function buildCoachContext(
  siteId: string,
  options: BuildOptions
): Promise<CoachContext> {
  const [site, analyses, metadata, competitors, memoryAllowed] = await Promise.all([
    getSiteById(siteId),
    getLatestSuccessfulAnalyses(siteId, 2),
    getSiteMetadataBySiteId(siteId),
    getCompetitorsBySiteId(siteId),
    canUseCoachMemory(options.userId),
  ])

  if (!site) throw new Error(`Site not found: ${siteId}`)

  const latest = analyses[0] ?? null
  const previous = analyses[1] ?? null

  const memory = memoryAllowed ? await getCoachMemory(options.userId, siteId) : null

  const base = {
    siteName: site.name,
    siteUrl: site.url,
    siteDescription: metadata?.description ?? null,
    language: site.language,
    keywords: metadata?.keywords ?? [],
    competitors: competitors.map((c) => c.name ?? c.url),
    memorySummary: memory?.memorySummary ?? null,
    focusedIssue: options.focusedIssue ?? null,
  }

  if (!latest) {
    return {
      ...base,
      globalScore: null,
      authorityScore: null,
      technicalScore: null,
      contentScore: null,
      topIssues: [],
      priorityPillar: null,
      lastAnalysisAt: null,
      comparison: null,
    }
  }

  const [technicalIssues, contentIssues] = await Promise.all([
    getTechnicalIssuesByAnalysisId(latest.id),
    getContentIssuesByAnalysisId(latest.id),
  ])

  const realIssues = [...technicalIssues, ...contentIssues].filter(
    (i) => i.severity !== 'opportunity'
  )
  const topIssues: CoachIssueSummary[] = realIssues
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) ||
        b.penalty - a.penalty
    )
    .slice(0, 5)
    .map((i) => ({ title: i.title, severity: i.severity, category: i.category }))

  const authorityScore = latest.authorityScore ?? 0
  const technicalScore = latest.technicalScore ?? 0
  const contentScore = latest.contentScore ?? 0
  const priority = getPriorityAction(authorityScore, technicalScore, contentScore)

  // Diff N vs N-1 (§16.5.E) — GEO célèbre les progrès concrets
  let comparison: CoachComparison | null = null
  if (previous) {
    const [prevTechnical, prevContent] = await Promise.all([
      getTechnicalIssuesByAnalysisId(previous.id),
      getContentIssuesByAnalysisId(previous.id),
    ])
    const prevReal = [...prevTechnical, ...prevContent].filter(
      (i) => i.severity !== 'opportunity'
    )
    const prevKeys = new Set(prevReal.map((i) => i.ruleKey))
    const currentKeys = new Set(realIssues.map((i) => i.ruleKey))
    const prevTitlesByKey = new Map(prevReal.map((i) => [i.ruleKey, i.title]))

    comparison = {
      resolvedIssueTitles: [...prevKeys]
        .filter((k) => !currentKeys.has(k))
        .map((k) => prevTitlesByKey.get(k) ?? k),
      newIssueTitles: realIssues.filter((i) => !prevKeys.has(i.ruleKey)).map((i) => i.title),
      globalDelta: (latest.globalScore ?? 0) - (previous.globalScore ?? 0),
      technicalDelta: technicalScore - (previous.technicalScore ?? 0),
      contentDelta: contentScore - (previous.contentScore ?? 0),
      authorityDelta: authorityScore - (previous.authorityScore ?? 0),
      methodologyChanged: latest.rulesVersion !== previous.rulesVersion,
    }
  }

  return {
    ...base,
    globalScore: latest.globalScore ?? null,
    authorityScore: latest.authorityScore ?? null,
    technicalScore: latest.technicalScore ?? null,
    contentScore: latest.contentScore ?? null,
    topIssues,
    priorityPillar: priority.pillar,
    lastAnalysisAt: latest.createdAt,
    comparison,
  }
}
