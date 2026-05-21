import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
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

  const isFree = !sub || sub.plan === 'free'

  if (!latest) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <OverviewPolling status={latest.status} />

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
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Publishers recommandés
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Sites éditoriaux où obtenir de la visibilité pour être cité dans les moteurs IA.
            Organisés par catégorie avec un angle d&apos;approche concret.
          </p>
        </div>

        {isInProgress ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : latest.status === 'success' ? (
          <PublishersList publishers={publishers} isFree={isFree} />
        ) : null}
      </section>
    </div>
  )
}
