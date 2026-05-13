import { inngest } from '@/lib/inngest/client'
import { runAuthorityAnalysis } from '@/lib/analysis/authority'
import { updateAnalysisStatus } from '@/lib/db/queries/analyses'

export const runAuthorityAnalysisFunction = inngest.createFunction(
  { id: 'run-authority-analysis', triggers: [{ event: 'site.analysis.requested' }] },
  async ({ event, step }) => {
    const { analysisId } = event.data as { analysisId: string }

    await step.run('mark-running', () => updateAnalysisStatus(analysisId, 'running'))

    try {
      const result = await step.run('run-authority', () => runAuthorityAnalysis(analysisId))

      await step.run('mark-success', () => updateAnalysisStatus(analysisId, 'success'))

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await step.run('mark-error', () =>
        updateAnalysisStatus(analysisId, 'error', message)
      )
      throw err
    }
  }
)
