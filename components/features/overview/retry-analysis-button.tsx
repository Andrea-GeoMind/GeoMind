'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAnalysisAction } from '@/app/(app)/sites/[siteId]/analysis-actions'
import { useAnalysisLock } from '@/components/features/analysis/analysis-lock-context'

interface RetryAnalysisButtonProps {
  siteId: string
  siteName: string
}

export function RetryAnalysisButton({ siteId, siteName }: RetryAnalysisButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { lockAnalysis } = useAnalysisLock()

  function handleRetry() {
    startTransition(async () => {
      const result = await runAnalysisAction(siteId)
      if ('error' in result) {
        router.refresh()
        return
      }
      lockAnalysis(result.analysisId, siteId, siteName)
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRetry} disabled={isPending} className="shrink-0 gap-1.5">
      <RefreshCw size={13} className={isPending ? 'animate-spin' : ''} />
      Recommencer
    </Button>
  )
}
