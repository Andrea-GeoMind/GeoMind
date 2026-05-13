import { inngest } from '@/lib/inngest/client'
import { crawlSite } from '@/lib/crawl/firecrawl'
import { runDiscovery } from '@/lib/analysis/discovery'
import { runAuthorityAnalysis } from '@/lib/analysis/authority'
import { runTechnicalAnalysis } from '@/lib/analysis/technical'
import { runContentAnalysis } from '@/lib/analysis/content'
import { generateRecommendations } from '@/lib/analysis/recommendations'
import { detectPublishers } from '@/lib/analysis/publishers'
import { computeAuthorityScore, computeScores } from '@/lib/analysis/scoring'
import {
  updateAnalysisStatus,
  updateAnalysisScores,
  updateAnalysisAuthorityScore,
  updateAnalysisTechnicalScore,
  updateAnalysisContentScore,
} from '@/lib/db/queries/analyses'
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

      // 3. Authority analysis — persisted immediately so the UI can show partial progress
      const authorityResult = await step.run('run-authority', () =>
        runAuthorityAnalysis(analysisId)
      )
      const authorityScore = computeAuthorityScore(
        authorityResult.successfulCalls,
        authorityResult.clientCitationsFound
      )
      await step.run('save-authority-score', () =>
        updateAnalysisAuthorityScore(analysisId, authorityScore)
      )

      // 4. Technical + Content in parallel — each score persisted as soon as available
      const [technicalResult, contentResult] = await Promise.all([
        step.run('run-technical', () => runTechnicalAnalysis({ siteId, analysisId })),
        step.run('run-content', () => runContentAnalysis({ siteId, analysisId })),
      ])
      await step.run('save-technical-score', () =>
        updateAnalysisTechnicalScore(analysisId, technicalResult.score)
      )
      await step.run('save-content-score', () =>
        updateAnalysisContentScore(analysisId, contentResult.score)
      )

      // 5. Recommendations (stub for now)
      await step.run('run-recommendations', () => generateRecommendations(siteId, analysisId))

      // 6. Publishers (stub for now)
      await step.run('run-publishers', () => detectPublishers(siteId, analysisId))

      // 7. Compute global score + persist all 4 scores atomically, mark success
      const scores = computeScores(
        {
          successfulCalls: authorityResult.successfulCalls,
          clientCitationsFound: authorityResult.clientCitationsFound,
        },
        technicalResult.score,
        contentResult.score
      )
      await step.run('mark-success', () => updateAnalysisScores(analysisId, scores))

      return scores
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await step.run('mark-error', () => updateAnalysisStatus(analysisId, 'error', message))
      throw err
    }
  }
)
