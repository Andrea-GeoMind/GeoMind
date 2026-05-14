import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { subscriptions } from '@/lib/db/schema'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getContentIssuesByAnalysisId } from '@/lib/db/queries/content-issues'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { Skeleton } from '@/components/ui/skeleton'
import { ContentIssuesList } from '@/components/features/content/content-issues-list'
import { OverviewPolling } from '@/components/features/overview/overview-polling'
import { RetryAnalysisButton } from '@/components/features/overview/retry-analysis-button'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'
import type { ContentIssueRow } from '@/components/features/content/content-issue-card'

export const metadata: Metadata = {
  title: 'Contenu — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function ContentPage({ params }: Props) {
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

  const isPro = sub?.plan === 'pro' || sub?.plan === 'business'
  const isBusiness = sub?.plan === 'business'

  if (!latest) {
    return <NoAnalysisState siteId={siteId} />
  }

  const isInProgress = latest.status === 'pending' || latest.status === 'running'
  const isError = latest.status === 'error'

  const rawIssues =
    latest.status === 'success'
      ? await getContentIssuesByAnalysisId(latest.id)
      : []

  const issues: ContentIssueRow[] = rawIssues.map((r) => ({
    id: r.id,
    ruleKey: r.ruleKey,
    category: r.category,
    title: r.title,
    description: r.description,
    sampleUrls: r.sampleUrls as string[],
    penalty: r.penalty,
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <OverviewPolling status={latest.status} />

      {isError && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
          <RetryAnalysisButton siteId={siteId} />
        </div>
      )}

      {/* Score Contenu */}
      <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score Contenu
        </p>
        {isInProgress ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-32 w-32 rounded-full" />
            <p className="text-sm text-muted-foreground">Analyse en cours…</p>
          </div>
        ) : latest.contentScore !== null ? (
          <ScoreGauge score={latest.contentScore} size="lg" />
        ) : (
          <p className="text-sm text-muted-foreground">Score non disponible</p>
        )}
      </section>

      {/* Issues list */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Points faibles détectés
        </h2>
        {isInProgress ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : latest.status === 'success' ? (
          <ContentIssuesList issues={issues} isPro={isPro} isBusiness={isBusiness} />
        ) : null}
      </section>
    </div>
  )
}
