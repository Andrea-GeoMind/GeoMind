'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Zap } from 'lucide-react'
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
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle size={16} className="shrink-0" />
        Analyse lancée, vous serez notifié à la fin.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="lg"
        className="w-full gap-2 bg-[--brand-blue-500] text-white hover:bg-[--brand-blue-600]"
      >
        <Zap size={16} />
        {isPending ? 'Lancement en cours…' : "Lancer l'analyse complète"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
