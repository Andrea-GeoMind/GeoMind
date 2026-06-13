'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ScanSearch } from 'lucide-react'
import { runReputationAction } from '@/app/(app)/sites/[siteId]/reputation/actions'
import { CREDIT_COSTS } from '@/lib/credits-shared'

/**
 * Lance une analyse de réputation et poll le rafraîchissement de la page
 * pendant qu'elle tourne (le statut du run est lu côté serveur).
 */
export function RunReputationButton({
  siteId,
  running,
  label = 'Analyser ma réputation',
}: {
  siteId: string
  running: boolean
  label?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)

  // Rafraîchit la page toutes les 5 s tant qu'un run est en cours
  useEffect(() => {
    if (!running && !launched) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [running, launched, router])

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const res = await runReputationAction(siteId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setLaunched(true)
      router.refresh()
    })
  }

  if (running || launched) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-2.5 text-sm font-medium text-primary">
        <Loader2 size={15} className="animate-spin" />
        Analyse en cours — les IA sont interrogées (1 à 2 min)…
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <ScanSearch size={15} />}
        {label} ({CREDIT_COSTS.reputationCheck} crédits)
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
