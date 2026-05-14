'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAnalysisAction } from '@/app/(app)/sites/[siteId]/analysis-actions'

type Props = {
  siteId: string
}

export function RunAnalysisButton({ siteId }: Props) {
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
      setTimeout(() => router.push(`/sites/${siteId}/overview`), 2000)
    })
  }

  if (launched) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[--score-good-500]/30 bg-[--score-good-500]/10 px-4 py-3 text-sm text-[--score-good-500]">
        <CheckCircle size={16} className="shrink-0" />
        Analyse lancée — résultats disponibles dans 2 à 5 minutes.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="lg"
        className="relative w-full gap-2 overflow-hidden bg-[--brand-blue-500] text-white hover:bg-[--brand-blue-600]"
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
