import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/quotas'
import { PLAN_LABELS, PLAN_UPGRADE_URLS } from '@/lib/plans'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Utilisation — GEOMIND',
}

export default async function UsagePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await getUsageStats(user.id)
  const upgradeUrl = PLAN_UPGRADE_URLS[stats.plan]

  const planBadgeClass =
    stats.plan === 'business'
      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
      : stats.plan === 'pro'
        ? 'bg-primary/10 text-primary'
        : 'bg-muted text-muted-foreground'

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Utilisation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quota consommé ce mois-ci — plan{' '}
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass}`}>
            {PLAN_LABELS[stats.plan]}
          </span>
        </p>
      </div>

      {/* Usage cards */}
      <div className="rounded-xl border bg-card shadow-sm p-6 mb-4">
        <p className="text-base font-semibold mb-4">Quotas du mois en cours</p>
        <div className="space-y-6">
          <UsageRow
            label="Sites enregistrés"
            used={stats.sites.used}
            limit={stats.sites.limit}
            unit="site"
          />
          <div className="border-t" />
          <UsageRow
            label="Analyses ce mois-ci"
            used={stats.analyses.used}
            limit={stats.analyses.limit}
            unit="analyse"
          />
        </div>
      </div>

      {/* Upgrade CTA */}
      {upgradeUrl && (
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Vous atteignez vos limites ?</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Passez à un plan supérieur pour plus de sites et d&apos;analyses.
              </p>
            </div>
            <Link
              href={upgradeUrl}
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Mettre à niveau →
            </Link>
          </div>
        </div>
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
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const isWarning = pct >= 80
  const isFull = pct >= 100

  const barClass = isFull
    ? 'bg-destructive'
    : isWarning
      ? 'bg-amber-400'
      : 'bg-primary'

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
          className={`h-2 rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isFull && (
        <p className="mt-1.5 text-xs text-destructive font-medium">
          Limite atteinte pour ce mois-ci.
        </p>
      )}
    </div>
  )
}
