'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAnalysisAction } from '@/app/(app)/sites/[siteId]/analysis-actions'

interface RunAuthorityButtonProps {
  siteId: string
}

export function RunAuthorityButton({ siteId }: RunAuthorityButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await runAnalysisAction(siteId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setLaunched(true)
      router.refresh()
    })
  }

  if (launched) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[--score-good-500]/30 bg-[--score-good-500]/10 px-4 py-2.5 text-sm font-medium text-[--score-good-700]">
        <CheckCircle size={15} className="shrink-0 text-[--score-good-500]" />
        Analyse relancée — mise à jour automatique.
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
      >
        <RefreshCw size={13} className={isPending ? 'animate-spin' : ''} />
        {isPending ? 'Lancement…' : 'Relancer'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
