import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, LifeBuoy, Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import { listChantierSummaries } from '@/lib/db/queries/chantiers'
import { chantierDisplayState, formatChantierDate } from '@/lib/chantiers/status'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import LinkIssuer from '@/components/features/chantiers/link-issuer'

export const metadata: Metadata = {
  title: 'Chantiers',
  robots: { index: false, follow: false },
}

const STATE_STYLES = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
  submitted: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200',
  expired: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
  revoked: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
  closed: 'bg-muted text-muted-foreground',
} as const

export default async function ChantiersPage() {
  const admin = await requireAdmin()
  const summaries = await listChantierSummaries(admin.id)
  const now = new Date()

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Chantiers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Espaces clients : accès, informations, fichiers et décisions.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chantiers/nouveau">
            <Plus />
            Nouveau chantier
          </Link>
        </Button>
      </div>

      {summaries.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed p-12 text-center text-sm text-muted-foreground">
          Aucun chantier pour l’instant.
        </p>
      ) : (
        <ul className="space-y-4">
          {summaries.map(({ chantier, establishments, completeness, lastActivityAt }) => {
            const state = chantierDisplayState(chantier, now)
            return (
              <li key={chantier.id} className="space-y-3 rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold">
                      <Link href={`/dashboard/chantiers/${chantier.id}`} className="hover:underline">
                        {chantier.clientName}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {establishments.map((e) => e.name).join(' · ')}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATE_STYLES[state.kind])}>
                    {state.label}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${completeness.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completeness.percent} % rempli · {completeness.filledRequiredCount}/
                    {completeness.requiredCount} champs obligatoires · dernière activité le{' '}
                    {formatChantierDate(lastActivityAt)}
                  </p>
                </div>

                {(completeness.blocking.length > 0 || completeness.alerts.length > 0) && (
                  <div className="flex flex-wrap gap-4 text-xs">
                    {completeness.blocking.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {completeness.blocking.length} élément
                        {completeness.blocking.length > 1 ? 's' : ''} bloquant
                        {completeness.blocking.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {completeness.alerts.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                        <LifeBuoy className="h-3.5 w-3.5" />
                        {completeness.alerts.length} demande
                        {completeness.alerts.length > 1 ? 's' : ''} d’aide
                      </span>
                    )}
                  </div>
                )}

                {state.kind !== 'closed' && (
                  <LinkIssuer chantierId={chantier.id} regenerate={state.kind !== 'draft'} />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
