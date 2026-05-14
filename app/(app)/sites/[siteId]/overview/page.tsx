import type { Route } from 'next'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis, getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { computeDeltas } from '@/lib/analysis/compare'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { ScoreCard } from '@/components/features/analysis/score-card'
import { Skeleton } from '@/components/ui/skeleton'
import { OverviewPolling } from '@/components/features/overview/overview-polling'
import { RetryAnalysisButton } from '@/components/features/overview/retry-analysis-button'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'

export const metadata: Metadata = {
  title: "Vue d'ensemble — GEOMIND",
}

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function OverviewPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const latest = await getLatestAnalysis(siteId)

  if (!latest) {
    return <NoAnalysisState siteId={siteId} />
  }

  const isInProgress = latest.status === 'pending' || latest.status === 'running'
  const isError = latest.status === 'error'

  const successfulPair =
    latest.status === 'success' ? await getLatestSuccessfulAnalyses(siteId, 2) : []

  const currentAnalysis = successfulPair[0] ?? null
  const previousAnalysis = successfulPair[1] ?? null

  const deltas =
    currentAnalysis?.globalScore !== null &&
    currentAnalysis?.authorityScore !== null &&
    currentAnalysis?.technicalScore !== null &&
    currentAnalysis?.contentScore !== null &&
    previousAnalysis?.globalScore !== null &&
    previousAnalysis?.authorityScore !== null &&
    previousAnalysis?.technicalScore !== null &&
    previousAnalysis?.contentScore !== null &&
    currentAnalysis !== null &&
    previousAnalysis !== null
      ? computeDeltas(
          {
            globalScore:    currentAnalysis.globalScore!,
            authorityScore: currentAnalysis.authorityScore!,
            technicalScore: currentAnalysis.technicalScore!,
            contentScore:   currentAnalysis.contentScore!,
          },
          {
            globalScore:    previousAnalysis.globalScore!,
            authorityScore: previousAnalysis.authorityScore!,
            technicalScore: previousAnalysis.technicalScore!,
            contentScore:   previousAnalysis.contentScore!,
          }
        )
      : null

  const globalScore = currentAnalysis?.globalScore ?? null

  function deltaTrend(delta: number): 'up' | 'down' | 'stable' {
    if (delta > 0) return 'up'
    if (delta < 0) return 'down'
    return 'stable'
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
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

      {/* Score global */}
      <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score GEO Global
        </p>

        {isInProgress ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <p className="text-sm text-muted-foreground">Analyse en cours…</p>
          </div>
        ) : globalScore !== null ? (
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={globalScore} size="lg" />
            {deltas !== null && (
              <span
                className={
                  deltas.globalDelta > 0
                    ? 'text-sm font-semibold text-[--score-good-600]'
                    : deltas.globalDelta < 0
                      ? 'text-sm font-semibold text-[--score-bad-600]'
                      : 'text-sm font-medium text-muted-foreground'
                }
              >
                {deltas.globalDelta > 0 ? '+' : ''}
                {deltas.globalDelta} pts vs analyse précédente
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Score non disponible</p>
        )}
      </section>

      {/* 3 sous-notes */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Détail par pilier
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isInProgress ? (
            <>
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </>
          ) : currentAnalysis !== null ? (
            <>
              <Link href={`/sites/${siteId}/authority`} className="contents">
                <ScoreCard
                  pillar="authority"
                  score={currentAnalysis.authorityScore ?? 0}
                  delta={deltas?.authorityDelta}
                  trend={deltas !== null ? deltaTrend(deltas.authorityDelta) : undefined}
                />
              </Link>
              <Link href={`/sites/${siteId}/technical`} className="contents">
                <ScoreCard
                  pillar="technical"
                  score={currentAnalysis.technicalScore ?? 0}
                  delta={deltas?.technicalDelta}
                  trend={deltas !== null ? deltaTrend(deltas.technicalDelta) : undefined}
                />
              </Link>
              <Link href={`/sites/${siteId}/content` as Route} className="contents">
                <ScoreCard
                  pillar="content"
                  score={currentAnalysis.contentScore ?? 0}
                  delta={deltas?.contentDelta}
                  trend={deltas !== null ? deltaTrend(deltas.contentDelta) : undefined}
                />
              </Link>
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
