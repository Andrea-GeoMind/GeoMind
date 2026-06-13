import { inngest } from '@/lib/inngest/client'
import { runReputationCheck } from '@/lib/analysis/reputation-runner'
import { updateReputationRunStatus } from '@/lib/db/queries/reputation'
import { CREDIT_COSTS, refundCredits } from '@/lib/credits'

/**
 * Analyse de réputation (PLAN item 31) — déclenchée par site.reputation.requested.
 * Les crédits sont décomptés au lancement (server action) ; remboursés ici si
 * l'analyse échoue techniquement (comme run-full-analysis).
 */
export const runReputationCheckFunction = inngest.createFunction(
  { id: 'run-reputation-check', triggers: [{ event: 'site.reputation.requested' }] },
  async ({ event, step }) => {
    const { runId, siteId, userId } = event.data as {
      runId: string
      siteId: string
      userId?: string
    }

    await step.run('mark-running', () => updateReputationRunStatus(runId, 'running'))

    try {
      const result = await step.run('run-reputation', () => runReputationCheck(runId, siteId))
      await step.run('mark-success', () => updateReputationRunStatus(runId, 'success'))
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[run-reputation-check] ${runId}:`, message)
      await step.run('mark-error', () =>
        updateReputationRunStatus(
          runId,
          'error',
          'L’analyse de réputation a rencontré un incident technique. Vos crédits ont été remboursés.'
        )
      )
      if (userId) {
        await step.run('refund', () =>
          refundCredits(userId, CREDIT_COSTS.reputationCheck, { siteId, runId })
        )
      }
      throw err
    }
  }
)
