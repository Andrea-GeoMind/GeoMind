import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { PLAN_FEATURES } from '@/lib/plans'
import { subscriptions } from '@/lib/db/schema'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getTechnicalIssuesByAnalysisId } from '@/lib/db/queries/technical-issues'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { Skeleton } from '@/components/ui/skeleton'
import { IssuesList } from '@/components/features/technical/issues-list'
import { OverviewPolling } from '@/components/features/overview/overview-polling'
import { RetryAnalysisButton } from '@/components/features/overview/retry-analysis-button'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'
import type { TechnicalIssueRow } from '@/components/features/technical/issue-card'

export const metadata: Metadata = {
  title: 'Technique — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function TechnicalPage({ params }: Props) {
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

  // Feature gates §17.2 : fiches complètes dès Solo, version IA complète dès Pro
  const features = PLAN_FEATURES[sub?.plan ?? 'free']
  const isPro = features.recommendationSheets
  const isBusiness = features.fullRecommendations

  if (!latest) {
    return <NoAnalysisState siteId={siteId} />
  }

  const isInProgress = latest.status === 'pending' || latest.status === 'running'
  const isError = latest.status === 'error'

  const rawIssues =
    latest.status === 'success'
      ? await getTechnicalIssuesByAnalysisId(latest.id)
      : []

  const issues: TechnicalIssueRow[] = rawIssues.map((r) => ({
    id: r.id,
    ruleKey: r.ruleKey,
    category: r.category,
    title: r.title,
    description: r.description,
    sampleUrls: r.sampleUrls as string[],
    penalty: r.penalty,
    severity: r.severity,
    effort: r.effort,
    impact: r.impact,
    pageUrl: r.pageUrl,
  }))

  const totalPenalty = issues.reduce((sum, i) => sum + i.penalty, 0)

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <OverviewPolling status={latest.status} />

      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Technique</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Qualité technique de {site.name} pour être lu et compris par les moteurs IA
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
            ) : latest.technicalScore !== null ? (
              <ScoreGauge score={latest.technicalScore} size="lg" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-border bg-muted/30">
                <p className="text-center text-xs text-muted-foreground">Score non disponible</p>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Score Technique</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Évaluation des critères techniques GEO (accessibilité, structure, schema.org, performance)
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
          <IssuesList issues={issues} isPro={isPro} isBusiness={isBusiness} />
        ) : null}
      </section>
    </div>
  )
}
