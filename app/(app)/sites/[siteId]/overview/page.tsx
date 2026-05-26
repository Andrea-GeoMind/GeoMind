import type { Route } from 'next'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight, Lightbulb } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis, getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { computeDeltas, } from '@/lib/analysis/compare'
import { getScoreMaturity, getPriorityAction } from '@/lib/analysis/scoring'
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

  const priorityAction =
    currentAnalysis?.authorityScore !== null &&
    currentAnalysis?.technicalScore !== null &&
    currentAnalysis?.contentScore !== null &&
    currentAnalysis !== null
      ? getPriorityAction(
          currentAnalysis.authorityScore ?? 0,
          currentAnalysis.technicalScore ?? 0,
          currentAnalysis.contentScore ?? 0,
        )
      : null

  const globalMaturity = globalScore !== null ? getScoreMaturity(globalScore) : null

  function deltaTrend(delta: number): 'up' | 'down' | 'stable' {
    if (delta > 0) return 'up'
    if (delta < 0) return 'down'
    return 'stable'
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <OverviewPolling status={latest.status} />

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

      {/* Score global hero card */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Score GEO Global
        </p>

        {isInProgress ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
        ) : globalScore !== null ? (
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={globalScore} size="lg" />

            {/* Niveau de maturité global */}
            {globalMaturity && (
              <p className="text-sm text-muted-foreground">
                Niveau :{' '}
                <span className="font-semibold text-foreground">{globalMaturity.label}</span>
              </p>
            )}

            {deltas !== null && (
              <div
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
                  deltas.globalDelta > 0
                    ? 'bg-[--score-good-50] text-[--score-good-600]'
                    : deltas.globalDelta < 0
                      ? 'bg-[--score-bad-50] text-[--score-bad-600]'
                      : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {deltas.globalDelta > 0 ? (
                  <TrendingUp size={13} aria-hidden />
                ) : deltas.globalDelta < 0 ? (
                  <TrendingDown size={13} aria-hidden />
                ) : (
                  <Minus size={13} aria-hidden />
                )}
                {deltas.globalDelta > 0 ? '+' : ''}
                {deltas.globalDelta} pts vs analyse précédente
              </div>
            )}

            {/* Explication du calcul */}
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              Moyenne de vos scores Autorité, Technique et Contenu.
              Un score &gt; 70 est considéré comme avancé.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Score non disponible</p>
        )}
      </section>

      {/* 3 pillar score cards */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Détail par pilier
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isInProgress ? (
            <>
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
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

      {/* Bannière action prioritaire */}
      {priorityAction && !isInProgress && (
        <Link
          href={priorityAction.href(siteId) as Route}
          className="group flex items-start gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-5 transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb size={15} className="text-primary" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Action prioritaire
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {priorityAction.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {priorityAction.description}
            </p>
          </div>
          <ArrowRight
            size={16}
            className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  )
}
