import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { PLAN_FEATURES } from '@/lib/plans'
import { subscriptions } from '@/lib/db/schema'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getPublishersByAnalysisId } from '@/lib/db/queries/publishers'
import { Skeleton } from '@/components/ui/skeleton'
import { PublishersList } from '@/components/features/publishers/PublishersList'
import { OverviewPolling } from '@/components/features/overview/overview-polling'

export const metadata: Metadata = {
  title: 'Publishers — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function PublishersPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const [latest, sub] = await Promise.all([
    getLatestAnalysis(siteId),
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
      columns: { plan: true },
    }),
  ])

  // Feature gate §17.2 : les 15 publishers visibles dès le plan Solo
  const isFree = !PLAN_FEATURES[sub?.plan ?? 'free'].publishersFull

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-extrabold tracking-tight text-foreground">
          Aucune analyse disponible
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Lancez une analyse pour obtenir la liste des publishers recommandés pour votre secteur.
        </p>
        <Link
          href={`/sites/${siteId}/discovery`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Lancer la découverte
        </Link>
      </div>
    )
  }

  const isInProgress = latest.status === 'pending' || latest.status === 'running'
  const isError = latest.status === 'error'

  const publishers =
    latest.status === 'success' ? await getPublishersByAnalysisId(latest.id) : []

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <OverviewPolling status={latest.status} />

      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Publishers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sites éditoriaux recommandés pour gagner en visibilité dans les moteurs IA
        </p>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
        </div>
      )}

      {/* Running banner */}
      {isInProgress && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-3 text-sm font-medium text-primary">
          <RefreshCw size={15} className="shrink-0 animate-spin" />
          Analyse en cours — la page se met à jour automatiquement…
        </div>
      )}

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recommandés pour {site.name}
        </h2>

        {isInProgress ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : latest.status === 'success' ? (
          <PublishersList publishers={publishers} isFree={isFree} />
        ) : null}
      </section>
    </div>
  )
}
