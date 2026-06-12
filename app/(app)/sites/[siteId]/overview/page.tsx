import type { Route } from 'next'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight, Lightbulb, Info } from 'lucide-react'
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

  // Badge §18.3 : la comparaison traverse un changement de méthodologie d'audit —
  // les deltas reflètent en partie l'enrichissement des règles, pas une régression réelle.
  const methodologyChanged =
    previousAnalysis !== null &&
    currentAnalysis !== null &&
    previousAnalysis.rulesVersion !== currentAnalysis.rulesVersion

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <OverviewPolling status={latest.status} />

      {/* Méthodologie enrichie (§18.3) */}
      {methodologyChanged && deltas !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-800">
          <Info size={15} className="shrink-0" />
          <span>
            <strong>Méthodologie enrichie</strong> — notre audit analyse désormais plus de
            critères qu&apos;avant. Une variation de score peut refléter ce changement plutôt
            qu&apos;une évolution réelle de votre site.
          </span>
        </div>
      )}

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
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Gauge — left */}
          <div className="flex shrink-0 items-center justify-center">
            {isInProgress ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : globalScore !== null ? (
              <ScoreGauge score={globalScore} size="lg" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-border bg-muted/30">
                <p className="text-center text-xs text-muted-foreground">Score non disponible</p>
              </div>
            )}
          </div>

          {/* Info — right */}
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Score GEO Global</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Moyenne de vos scores Autorité, Technique et Contenu
              </p>
            </div>

            {isInProgress ? (
              <Skeleton className="h-3 w-28 rounded-full" />
            ) : globalMaturity ? (
              <p className="text-sm text-muted-foreground">
                Niveau :{' '}
                <span className="font-semibold text-foreground">{globalMaturity.label}</span>
              </p>
            ) : null}

            {deltas !== null && !isInProgress && (
              <div
                className={[
                  'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                  deltas.globalDelta > 0
                    ? 'bg-[--score-good-50] text-[--score-good-600]'
                    : deltas.globalDelta < 0
                      ? 'bg-[--score-bad-50] text-[--score-bad-600]'
                      : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {deltas.globalDelta > 0 ? (
                  <TrendingUp size={11} aria-hidden />
                ) : deltas.globalDelta < 0 ? (
                  <TrendingDown size={11} aria-hidden />
                ) : (
                  <Minus size={11} aria-hidden />
                )}
                {deltas.globalDelta > 0 ? '+' : ''}
                {deltas.globalDelta} pts vs analyse précédente
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 pillar score cards */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Détail par pilier
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {isInProgress ? (
            <>
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </>
          ) : currentAnalysis !== null ? (
            <>
              <Link href={`/sites/${siteId}/authority`} className="contents">
                <ScoreCard
                  pillar="authority"
                  score={currentAnalysis.authorityScore ?? 0}
                  delta={deltas?.authorityDelta}
                  trend={deltas !== null ? deltaTrend(deltas.authorityDelta) : undefined}
                  clickable
                />
              </Link>
              <Link href={`/sites/${siteId}/technical`} className="contents">
                <ScoreCard
                  pillar="technical"
                  score={currentAnalysis.technicalScore ?? 0}
                  delta={deltas?.technicalDelta}
                  trend={deltas !== null ? deltaTrend(deltas.technicalDelta) : undefined}
                  clickable
                />
              </Link>
              <Link href={`/sites/${siteId}/content` as Route} className="contents">
                <ScoreCard
                  pillar="content"
                  score={currentAnalysis.contentScore ?? 0}
                  delta={deltas?.contentDelta}
                  trend={deltas !== null ? deltaTrend(deltas.contentDelta) : undefined}
                  clickable
                />
              </Link>
            </>
          ) : null}
        </div>
      </section>

      {/* Action prioritaire */}
      {priorityAction && !isInProgress && (
        <Link
          href={priorityAction.href(siteId) as Route}
          className="group flex items-start gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:border-indigo-200 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
            <Lightbulb size={16} className="text-indigo-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Action prioritaire
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
              {priorityAction.label}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {priorityAction.description}
            </p>
          </div>
          <ArrowRight
            size={15}
            className="mt-1 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600"
            aria-hidden
          />
        </Link>
      )}
    </div>
  )
}
