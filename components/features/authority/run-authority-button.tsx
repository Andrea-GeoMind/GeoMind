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
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle size={16} className="shrink-0" />
        Analyse Autorité relancée — la page se mettra à jour automatiquement.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant="outline"
        className="gap-2"
      >
        <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
        {isPending ? 'Lancement en cours…' : 'Relancer analyse Autorité'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
