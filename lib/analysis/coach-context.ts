import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { getSiteMetadataBySiteId } from '@/lib/db/queries/site-metadata'
import { getPriorityAction } from '@/lib/analysis/scoring'
import type { CoachContext } from '@/lib/ai/prompts/coach'

export async function buildCoachContext(siteId: string): Promise<CoachContext> {
  const [site, successfulAnalyses, metadata] = await Promise.all([
    getSiteById(siteId),
    getLatestSuccessfulAnalyses(siteId, 1),
    getSiteMetadataBySiteId(siteId),
  ])

  if (!site) throw new Error(`Site not found: ${siteId}`)

  const latestAnalysis = successfulAnalyses[0] ?? null

  if (!latestAnalysis) {
    return {
      siteName: site.name,
      siteUrl: site.url,
      siteDescription: metadata?.description ?? null,
      globalScore: null,
      authorityScore: null,
      technicalScore: null,
      contentScore: null,
      topTechnicalIssues: [],
      topContentIssues: [],
      priorityPillar: null,
    }
  }

  const [technicalIssues, contentIssues] = await Promise.all([
    getTechnicalIssuesByAnalysisId(latestAnalysis.id),
    getContentIssuesByAnalysisId(latestAnalysis.id),
  ])

  const authorityScore = latestAnalysis.authorityScore ?? 0
  const technicalScore = latestAnalysis.technicalScore ?? 0
  const contentScore = latestAnalysis.contentScore ?? 0
  const priority = getPriorityAction(authorityScore, technicalScore, contentScore)

  return {
    siteName: site.name,
    siteUrl: site.url,
    siteDescription: metadata?.description ?? null,
    globalScore: latestAnalysis.globalScore ?? null,
    authorityScore: latestAnalysis.authorityScore ?? null,
    technicalScore: latestAnalysis.technicalScore ?? null,
    contentScore: latestAnalysis.contentScore ?? null,
    topTechnicalIssues: technicalIssues
      .slice(0, 3)
      .map((i) => ({ title: i.title, penalty: i.penalty })),
    topContentIssues: contentIssues
      .slice(0, 3)
      .map((i) => ({ title: i.title, penalty: i.penalty })),
    priorityPillar: priority.pillar,
  }
}
