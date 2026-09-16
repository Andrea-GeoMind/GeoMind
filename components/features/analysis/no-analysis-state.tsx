'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { runAnalysisAction } from '@/app/(app)/sites/[siteId]/analysis-actions'
import { useAnalysisLock } from '@/components/features/analysis/analysis-lock-context'
import { EXPRESS_UNKNOWNS } from '@/lib/analysis/express-audit'
import { CREDIT_COSTS } from '@/lib/credits-shared'

/**
 * État « aucune analyse » de la vue d'ensemble.
 *
 * Reprend mot pour mot les trois questions laissées ouvertes par l'audit
 * express : l'utilisateur arrive en général d'ici, et il a donné son email
 * précisément pour obtenir ces réponses. L'écran précédent lui demandait de
 * « lancer la découverte » — un terme produit qui ne lui dit rien et qui ne
 * promet pas ce qu'il est venu chercher.
 *
 * Le lancement reste explicite ici, avec son coût affiché : cet écran ne
 * s'affiche que lorsque le déclenchement automatique n'a pas eu lieu (crédits
 * insuffisants, site ajouté à la main, ou échec technique).
 */
interface NoAnalysisStateProps {
  siteId: string
  siteName: string
  /** Solde de crédits — null quand il est illimité (admin). */
  creditBalance: number | null
}

export function NoAnalysisState({ siteId, siteName, creditBalance }: NoAnalysisStateProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { lockAnalysis } = useAnalysisLock()

  const cost = CREDIT_COSTS.fullAnalysis
  const enoughCredits = creditBalance === null || creditBalance >= cost

  function launch() {
    setError(null)
    startTransition(async () => {
      const result = await runAnalysisAction(siteId)
      if ('error' in result) {
        setError(result.error)
        router.refresh()
        return
      }
      lockAnalysis(result.analysisId, siteId, siteName)
    })
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
        Trois questions sans réponse pour l’instant
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        C’est ce que l’analyse va mesurer sur {siteName}.
      </p>

      <dl className="mt-8 space-y-4">
        {EXPRESS_UNKNOWNS.map(({ key, question, detail }) => (
          <div key={key} className="flex items-start gap-3 rounded-xl border border-border p-4">
            <HelpCircle size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-sm font-semibold leading-snug text-foreground">{question}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <Button size="lg" onClick={launch} disabled={isPending || !enoughCredits} className="gap-2">
          {isPending && <Loader2 size={15} className="animate-spin" />}
          {isPending
            ? 'Lancement…'
            : creditBalance === null
              ? 'Lancer l’analyse'
              : `Lancer l’analyse — ${cost} crédits sur vos ${creditBalance}`}
        </Button>

        {!enoughCredits && (
          <p className="mt-3 text-sm text-muted-foreground">
            Il vous faut {cost} crédits pour une analyse complète, votre solde est de{' '}
            {creditBalance}.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Comptez deux à cinq minutes. Vous pouvez fermer la page, nous vous prévenons par email
          quand c’est prêt.
        </p>
      </div>
    </div>
  )
}
