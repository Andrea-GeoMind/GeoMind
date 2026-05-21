import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
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

  const totalPenalty = issues.reduce((sum, i) => sum + i.penalty, 0)

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <OverviewPolling status={latest.status} />

      {/* Error banner */}
      {isError && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
          <RetryAnalysisButton siteId={siteId} />
        </div>
      )}

      {/* Running banner */}
      {isInProgress && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-3 text-sm font-medium text-primary">
          <RefreshCw size={15} className="shrink-0 animate-spin" />
          Analyse en cours — la page se met à jour automatiquement…
        </div>
      )}

      {/* Score + KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Score hero */}
        <section className="col-span-1 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Score Contenu
          </p>
          {isInProgress ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-36 w-36 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          ) : latest.contentScore !== null ? (
            <ScoreGauge score={latest.contentScore} size="lg" />
          ) : (
            <p className="text-sm text-muted-foreground">Score non disponible</p>
          )}
        </section>

        {/* Issues count KPI */}
        <section className="flex flex-col justify-center gap-1 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {isInProgress ? (
            <>
              <Skeleton className="h-10 w-16 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded-full mt-1" />
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Points faibles
              </p>
              <p className="mt-1 text-5xl font-extrabold numeric text-foreground">{issues.length}</p>
              <p className="text-xs text-muted-foreground">
                {totalPenalty > 0 ? `−${totalPenalty} pts de pénalité` : 'Aucune pénalité'}
              </p>
            </>
          )}
        </section>
      </div>

      {/* Issues list */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Points faibles détectés
        </h2>
        {isInProgress ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : latest.status === 'success' ? (
          <ContentIssuesList issues={issues} isPro={isPro} isBusiness={isBusiness} />
        ) : null}
      </section>
    </div>
  )
}
