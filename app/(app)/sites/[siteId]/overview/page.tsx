import type { Route } from 'next'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight, Lightbulb, Info, Radar, Radio } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis, getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { getRollingCitationRate } from '@/lib/db/queries/citation-checks'
import { getPixelEvents } from '@/lib/db/queries/pixel'
import { summarizePixelEvents } from '@/lib/analysis/pixel'
import { computeDeltas, } from '@/lib/analysis/compare'
import { getScoreMaturity, getPriorityAction } from '@/lib/analysis/scoring'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { ScoreCard } from '@/components/features/analysis/score-card'
import { Skeleton } from '@/components/ui/skeleton'
import { OverviewPolling } from '@/components/features/overview/overview-polling'
import { RetryAnalysisButton } from '@/components/features/overview/retry-analysis-button'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'
import { CoachAutoOpen } from '@/components/features/coach/coach-auto-open'

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

  // Résumés remontés des onglets Suivi & Pixel : l'info clé sans changer d'onglet.
  const [rolling, pixelEvents] = await Promise.all([
    getRollingCitationRate(siteId, 30),
    site.pixelKey ? getPixelEvents(siteId, 30) : Promise.resolve([]),
  ])
  const pixelSummary = summarizePixelEvents(pixelEvents)
  const showTrendSummary = rolling.rate !== null
  const showPixelSummary = Boolean(site.pixelKey) && pixelSummary.aiVisitors > 0

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

      {/* Auto-ouverture unique de GEO après la première analyse (§16.5.D) */}
      <CoachAutoOpen
        siteId={siteId}
        introSeen={site.coachIntroSeen}
        analysisSuccess={latest.status === 'success'}
      />

      {/* Méthodologie enrichie (§18.3) */}
      {methodologyChanged && deltas !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <Info size={15} className="shrink-0 text-primary" />
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
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          <RefreshCw size={15} className="shrink-0 animate-spin" />
          Analyse en cours — la page se met à jour automatiquement…
        </div>
      )}

      {/* Score global hero card — surface navy premium */}
      <section className="relative overflow-hidden rounded-2xl bg-[#16304B] p-6 shadow-sm sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-64 w-80 rounded-full bg-primary/30 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Gauge — encart blanc */}
          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white p-4">
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
              <h2 className="text-lg font-semibold text-white">Score GEO Global</h2>
              <p className="mt-0.5 text-xs text-[#B2C8DE]">
                Moyenne de vos scores Autorité, Technique et Contenu
              </p>
            </div>

            {isInProgress ? (
              <Skeleton className="h-3 w-28 rounded-full" />
            ) : globalMaturity ? (
              <p className="text-sm text-[#B2C8DE]">
                Niveau :{' '}
                <span className="font-semibold text-white">{globalMaturity.label}</span>
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
                      : 'bg-white/10 text-[#B2C8DE]',
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

      {/* Résumés Suivi & Pixel — l'essentiel sans changer d'onglet */}
      {(showTrendSummary || showPixelSummary) && !isInProgress && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showTrendSummary && (
            <Link
              href={`/sites/${siteId}/trends` as Route}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Radar size={20} className="text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Visibilité IA · 30 j
                </p>
                <p className="mt-0.5 text-2xl font-extrabold leading-none text-foreground">
                  {rolling.rate}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  taux de citation moyen ({rolling.cited}/{rolling.total} mesures)
                </p>
              </div>
              <ArrowRight
                size={15}
                className="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          )}
          {showPixelSummary && (
            <Link
              href={`/sites/${siteId}/pixel` as Route}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Radio size={20} className="text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Trafic venu des IA · 30 j
                </p>
                <p className="mt-0.5 text-2xl font-extrabold leading-none text-foreground">
                  {pixelSummary.aiVisitors}
                  <span className="ml-1 text-sm font-semibold text-muted-foreground">
                    visiteur{pixelSummary.aiVisitors > 1 ? 's' : ''}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pixelSummary.aiActions} action{pixelSummary.aiActions > 1 ? 's' : ''} (appels,
                  devis…)
                </p>
              </div>
              <ArrowRight
                size={15}
                className="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          )}
        </section>
      )}

      {/* Action prioritaire */}
      {priorityAction && !isInProgress && (
        <Link
          href={priorityAction.href(siteId) as Route}
          className="group flex items-start gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb size={16} className="text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
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
            className="mt-1 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </Link>
      )}
    </div>
  )
}
