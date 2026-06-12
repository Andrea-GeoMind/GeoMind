import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/quotas'
import { getCreditTransactions, type CreditTransactionReason } from '@/lib/credits'
import { formatCreditsAmount, formatCreditsAsUsage } from '@/lib/credits-shared'
import { PLAN_LABELS, PLAN_UPGRADE_URLS } from '@/lib/plans'
import Link from 'next/link'
import { SettingsTabNav } from '@/components/features/settings/settings-tab-nav'

export const metadata: Metadata = {
  title: 'Utilisation — GEOMIND',
}

const REASON_LABELS: Record<CreditTransactionReason, string> = {
  welcome_bonus: 'Bonus de bienvenue',
  monthly_reset: 'Allocation mensuelle',
  pack_purchase: 'Achat de pack',
  analysis: 'Analyse complète',
  coach_message: 'Message coach IA',
  recommendation: 'Recommandation complète',
  refund_failed_analysis: 'Remboursement (analyse échouée)',
  admin_adjustment: 'Ajustement',
}

export default async function UsagePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [stats, transactions] = await Promise.all([
    getUsageStats(user.id),
    getCreditTransactions(user.id, 15),
  ])
  const upgradeUrl = PLAN_UPGRADE_URLS[stats.plan]
  const isUnlimited = !Number.isFinite(stats.creditsPerMonth)

  const planBadgeClass =
    stats.plan === 'business' || stats.plan === 'pro'
      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6 sm:p-8">
      {/* Page header */}
      <h1 className="text-2xl font-extrabold tracking-tight mb-6">Paramètres</h1>
      <SettingsTabNav />

      {/* Plan badge subtitle */}
      <p className="text-sm text-muted-foreground -mt-4">
        Crédits et utilisation — plan{' '}
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass}`}>
          {PLAN_LABELS[stats.plan]}
        </span>
      </p>

      {/* Crédits */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-base font-semibold">Crédits disponibles</p>
          <p className="text-sm text-muted-foreground">{formatCreditsAsUsage(stats.credits.total)}</p>
        </div>

        {isUnlimited ? (
          <p className="text-3xl font-extrabold tracking-tight">∞ illimités</p>
        ) : (
          <div className="space-y-6">
            <CreditGauge
              label="Allocation mensuelle (se renouvelle à chaque cycle)"
              remaining={stats.credits.monthly}
              allowance={stats.creditsPerMonth}
            />
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Crédits achetés (n&apos;expirent jamais)</p>
              <p className="text-sm font-semibold">{formatCreditsAmount(stats.credits.purchased)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sites */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <p className="text-base font-semibold mb-4">Sites enregistrés</p>
        <UsageRow
          label="Sites"
          used={stats.sites.used}
          limit={stats.sites.limit}
          unit="site"
        />
      </div>

      {/* Historique */}
      {transactions.length > 0 && (
        <div className="rounded-xl border border-border bg-white shadow-sm p-6">
          <p className="text-base font-semibold mb-4">Derniers mouvements</p>
          <ul className="divide-y divide-border">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {REASON_LABELS[tx.reason as CreditTransactionReason] ?? tx.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.createdAt.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold ${
                    tx.amount >= 0 ? 'text-emerald-600' : 'text-foreground'
                  }`}
                >
                  {tx.amount >= 0 ? '+' : ''}
                  {formatCreditsAmount(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upgrade CTA */}
      {upgradeUrl && (
        <div className="rounded-xl border border-border bg-white shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Besoin de plus de crédits ?</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Passez à un plan supérieur ou achetez un pack depuis la page Abonnement.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Recharger →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function CreditGauge({
  label,
  remaining,
  allowance,
}: {
  label: string
  remaining: number
  allowance: number
}) {
  const pct = allowance > 0 ? Math.min(100, Math.round((remaining / allowance) * 100)) : 0
  const isLow = pct < 20
  const barClass = isLow
    ? 'bg-destructive'
    : pct < 50
      ? 'bg-amber-400'
      : 'bg-gradient-to-r from-indigo-500 to-violet-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          <span className={`font-semibold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
            {formatCreditsAmount(remaining)}
          </span>
          {' / '}
          {formatCreditsAmount(allowance)}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="mt-1.5 text-xs text-destructive font-medium">
          Crédits mensuels bientôt épuisés — pensez à recharger.
        </p>
      )}
    </div>
  )
}

function UsageRow({
  label,
  used,
  limit,
  unit,
}: {
  label: string
  used: number
  limit: number
  unit: string
}) {
  if (!Number.isFinite(limit)) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{used}</span> / ∞
        </p>
      </div>
    )
  }

  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const isWarning = pct >= 80
  const isFull = pct >= 100

  const barInnerClass = isFull
    ? 'bg-destructive'
    : isWarning
      ? 'bg-amber-400'
      : 'bg-gradient-to-r from-indigo-500 to-violet-500'

  const valueClass = isFull
    ? 'text-destructive'
    : isWarning
      ? 'text-amber-600'
      : 'text-foreground'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          <span className={`font-semibold ${valueClass}`}>{used}</span>
          {' / '}
          {limit} {limit > 1 ? `${unit}s` : unit}
          <span className="ml-2 text-xs font-medium">({pct}%)</span>
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barInnerClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isFull && (
        <p className="mt-1.5 text-xs text-destructive font-medium">
          Limite atteinte.
        </p>
      )}
    </div>
  )
}
