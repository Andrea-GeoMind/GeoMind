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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Utilisation</h1>
      <p className="mb-8 text-sm text-gray-500">
        Quota consommé ce mois-ci — plan{' '}
        <span className="font-medium text-gray-700">{PLAN_LABELS[stats.plan]}</span>
      </p>

      <div className="space-y-6">
        <UsageCard
          label="Sites enregistrés"
          used={stats.sites.used}
          limit={stats.sites.limit}
          unit="site"
        />
        <UsageCard
          label="Analyses ce mois-ci"
          used={stats.analyses.used}
          limit={stats.analyses.limit}
          unit="analyse"
        />
      </div>

      {upgradeUrl && (
        <p className="mt-8 text-sm text-gray-500">
          Vous atteignez vos limites ?{' '}
          <Link href={upgradeUrl} className="font-medium text-indigo-600 hover:text-indigo-700">
            Passer à un plan supérieur →
          </Link>
        </p>
      )}
    </div>
  )
}

function UsageCard({
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

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-500">
          <span className={`font-semibold ${isFull ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-900'}`}>
            {used}
          </span>
          {' / '}
          {limit} {limit > 1 ? `${unit}s` : unit}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${
            isFull ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isFull && (
        <p className="mt-2 text-xs text-red-600">Limite atteinte pour ce mois-ci.</p>
      )}
    </div>
  )
}
