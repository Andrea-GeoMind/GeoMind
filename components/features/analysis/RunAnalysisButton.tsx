'use client'

import { useState, useTransition } from 'react'
import { Loader2, Zap, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  runAnalysisAction,
  getAnalysisCostPreviewAction,
} from '@/app/(app)/sites/[siteId]/analysis-actions'
import { formatCreditsAmount } from '@/lib/credits-shared'
import { useAnalysisLock } from './analysis-lock-context'

type Props = {
  siteId: string
  siteName: string
}

type CostPreview = {
  cost: number
  balance: number | null
  balanceAfter: number | null
}

export function RunAnalysisButton({ siteId, siteName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<CostPreview | null>(null)
  const { lockAnalysis } = useAnalysisLock()

  // 1er clic : aperçu du coût (§17.6 — confirmation avant dépense ≥ 100 crédits)
  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await getAnalysisCostPreviewAction()
      if ('error' in result) {
        setError(result.error)
        return
      }
      // Solde illimité (admin) : pas de confirmation nécessaire
      if (result.balance === null) {
        await launch()
        return
      }
      setPreview(result)
    })
  }

  async function launch() {
    const result = await runAnalysisAction(siteId)
    if ('error' in result) {
      setError(result.error)
      setPreview(null)
      return
    }
    lockAnalysis(result.analysisId, siteId, siteName)
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      await launch()
    })
  }

  if (preview) {
    const insufficient = preview.balanceAfter !== null && preview.balanceAfter < 0
    return (
      <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Coins size={15} className="shrink-0 text-amber-500" />
          Cette analyse utilisera {preview.cost} crédits
          {preview.balanceAfter !== null && !insufficient && (
            <span className="text-muted-foreground">
              — il vous en restera {formatCreditsAmount(preview.balanceAfter)}
            </span>
          )}
        </p>
        {insufficient && (
          <p className="text-sm text-destructive">
            Solde insuffisant ({formatCreditsAmount(preview.balance ?? 0)} crédits). Rechargez
            depuis la page Abonnement.
          </p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleConfirm}
            disabled={isPending || insufficient}
            size="sm"
            className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Confirmer le lancement
          </Button>
          <Button
            onClick={() => setPreview(null)}
            disabled={isPending}
            size="sm"
            variant="ghost"
          >
            Annuler
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
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
