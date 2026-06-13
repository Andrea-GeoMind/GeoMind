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
import { notifyAnalysisComplete } from '@/lib/analysis/alerts'
import { humanizeAnalysisError } from '@/lib/analysis/errors'
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { reconcileActionStates } from '@/lib/db/queries/action-states'
import { getLastCrawledAt } from '@/lib/db/queries/firecrawl-pages'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { CREDIT_COSTS, refundCredits } from '@/lib/credits'

const DEFAULT_MAX_PAGES = 20
// Mode test : les comptes admin (= nous, en QA) déclenchent une analyse volontairement
// minimale pour ne pas brûler de crédit API. Jamais appliqué aux vrais plans clients.
const LITE_MAX_PAGES = 3

export const runFullAnalysisFunction = inngest.createFunction(
  { id: 'run-full-analysis', triggers: [{ event: 'analysis.full.requested' }] },
  async ({ event, step }) => {
    const { analysisId, siteId, userId } = event.data as {
      analysisId: string
      siteId: string
      userId?: string
    }

    await step.run('mark-running', () => updateAnalysisStatus(analysisId, 'running'))

    // Mode test : compte admin → analyse minimale (1 moteur, 2 prompts, crawl court).
    // Gate sur le plan, pas sur une variable d'env : impossible de dégrader un vrai client.
    const isLite = await step.run('check-test-mode', async () =>
      userId ? (await getSubscriptionByUserId(userId))?.plan === 'admin' : false
    )
    if (isLite) console.log(`[run-full-analysis] ${analysisId}: mode test (analyse minimale)`)

    try {
      // 1. Crawl — sauté si les pages ont moins de 2 heures (cas typique : juste après la découverte).
      //    Lors d'une ré-analyse manuelle > 2h, on re-crawle pour avoir des données fraîches.
      const CRAWL_FRESHNESS_MS = 2 * 60 * 60 * 1000 // 2 heures
      const lastCrawledAt = await step.run('check-crawl-freshness', () => getLastCrawledAt(siteId))
      const crawlIsStale =
        !lastCrawledAt || Date.now() - new Date(lastCrawledAt).getTime() > CRAWL_FRESHNESS_MS

      if (crawlIsStale) {
        const maxPages = isLite ? LITE_MAX_PAGES : DEFAULT_MAX_PAGES
        await step.run('crawl', () => crawlSite({ siteId, maxPages }))
      }

      // 2. Discovery — skip if site_metadata already exists
      const existingMetadata = await step.run('check-discovery', () =>
        getSiteMetadataBySiteId(siteId)
      )
      if (!existingMetadata) {
        await step.run('run-discovery', () => runDiscovery(siteId))
      }

      // 3. Authority analysis — persisted immediately so the UI can show partial progress
      const authorityResult = await step.run('run-authority', () =>
        runAuthorityAnalysis(analysisId, { lite: isLite })
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

      // 7bis. Vérification automatique du Plan d'action (PLAN item 16) :
      // les actions déclarées corrigées dont la règle a disparu passent à « vérifié »
      await step.run('reconcile-action-plan', async () => {
        const [tech, cont] = await Promise.all([
          getTechnicalIssuesByAnalysisId(analysisId),
          getContentIssuesByAnalysisId(analysisId),
        ])
        const keys = new Set(
          [...tech, ...cont].map((i) => `${i.ruleKey}::${i.pageUrl ?? ''}`)
        )
        return reconcileActionStates(siteId, keys)
      })

      // 8. Email "analyse terminée" (PLAN item 13) — best-effort, jamais bloquant
      await step.run('notify-complete', () =>
        notifyAnalysisComplete({ siteId, globalScore: scores.globalScore ?? null })
      )

      return scores
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Message humanisé pour l'UI (PLAN item 17) — le brut part dans les logs
      console.error(`[run-full-analysis] ${analysisId}:`, message)
      await step.run('mark-error', () =>
        updateAnalysisStatus(analysisId, 'error', humanizeAnalysisError(message))
      )
      // Échec technique → remboursement automatique des crédits décomptés au lancement (§17.4)
      if (userId) {
        await step.run('refund-credits', () =>
          refundCredits(userId, CREDIT_COSTS.fullAnalysis, { siteId, analysisId })
        )
      }
      throw err
    }
  }
)
