import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { formatCreditsAmount } from '@/lib/credits-shared'

type Props = {
  monthlyRemaining: number
  allowance: number
}

/**
 * Bannière in-app "crédits bientôt épuisés" (§17.6) — affichée par le layout
 * authentifié quand le solde mensuel passe sous 20 % de l'allocation du plan.
 */
export function LowCreditsBanner({ monthlyRemaining, allowance }: Props) {
  const pct = Math.round((monthlyRemaining / allowance) * 100)
  return (
    <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-6 py-2.5">
      <p className="flex items-center gap-2 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Plus que <strong>{formatCreditsAmount(monthlyRemaining)} crédits</strong> sur votre
          allocation mensuelle ({pct}&nbsp;%).
        </span>
      </p>
      <Link
        href="/settings/billing"
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        Recharger
      </Link>
    </div>
  )
}
