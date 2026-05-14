import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
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
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">
          Aucune analyse lancée pour ce site.{' '}
          <Link
            href={`/sites/${siteId}/discovery`}
            className="font-medium text-[--brand-blue-500] underline-offset-4 hover:underline"
          >
            Lancer la découverte
          </Link>
        </p>
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

      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
        </div>
      )}

      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Publishers recommandés</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sites éditoriaux où obtenir de la visibilité pour être cité dans les moteurs IA.
            Organisés par catégorie avec un angle d&apos;approche concret.
          </p>
        </div>

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
