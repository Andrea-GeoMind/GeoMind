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

  const isPro = sub?.plan === 'pro' || sub?.plan === 'business' || sub?.plan === 'admin'
  const isBusiness = sub?.plan === 'business' || sub?.plan === 'admin'

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
    <div className="space-y-6 p-6 sm:p-8">
      <OverviewPolling status={latest.status} />

      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Contenu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pertinence et structure du contenu de {site.name} pour les réponses IA
        </p>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">
            L&apos;analyse a échoué.{' '}
            {latest.errorMessage ?? 'Une erreur inattendue est survenue.'}
          </span>
          <RetryAnalysisButton siteId={siteId} siteName={site.name} />
        </div>
      )}

      {/* Running banner */}
      {isInProgress && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-4 py-3 text-sm font-medium text-primary">
          <RefreshCw size={15} className="shrink-0 animate-spin" />
          Analyse en cours — la page se met à jour automatiquement…
        </div>
      )}

      {/* Score hero — flex row */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center justify-center">
            {isInProgress ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : latest.contentScore !== null ? (
              <ScoreGauge score={latest.contentScore} size="lg" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-border bg-muted/30">
                <p className="text-center text-xs text-muted-foreground">Score non disponible</p>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Score Contenu</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Évaluation des critères GEO contenu (lisibilité, métadonnées, structure, couverture)
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              {isInProgress ? (
                <>
                  <Skeleton className="h-10 w-16 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-full" />
                </>
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-foreground">{issues.length}</span>
                  <span className="text-sm text-muted-foreground">
                    {issues.length === 0
                      ? 'aucun point faible'
                      : `point${issues.length > 1 ? 's' : ''} faible${issues.length > 1 ? 's' : ''}${totalPenalty > 0 ? ` · −${totalPenalty} pts` : ''}`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Issues list */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
