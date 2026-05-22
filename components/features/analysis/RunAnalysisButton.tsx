'use client'

import { useState, useTransition } from 'react'
import { Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAnalysisAction } from '@/app/(app)/sites/[siteId]/analysis-actions'
import { useAnalysisLock } from './analysis-lock-context'

type Props = {
  siteId: string
  siteName: string
}

export function RunAnalysisButton({ siteId, siteName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { lockAnalysis } = useAnalysisLock()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await runAnalysisAction(siteId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      lockAnalysis(result.analysisId, siteId, siteName)
    })
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="lg"
        className="relative w-full gap-2 overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span className="absolute inset-0 animate-pulse bg-white/10" />
            Lancement en cours…
          </>
        ) : (
          <>
            <Zap size={16} />
            Lancer l&apos;analyse complète
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
