import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestAnalysis } from '@/lib/db/queries/analyses'
import { getAuthorityResultsByAnalysisId } from '@/lib/db/queries/authority-results'
import { buildEngineStats, buildCrossTable } from '@/lib/analysis/authority-table'
import type { AuthorityResultRow } from '@/lib/analysis/authority-table'
import { ScoreGauge } from '@/components/charts/score-gauge'
import { Skeleton } from '@/components/ui/skeleton'
import { CitationsBarChart } from '@/components/features/authority/citations-bar-chart'
import { CitationsTable } from '@/components/features/authority/citations-table'
import { RunAuthorityButton } from '@/components/features/authority/run-authority-button'
import { OverviewPolling } from '@/components/features/overview/overview-polling'
import { RetryAnalysisButton } from '@/components/features/overview/retry-analysis-button'
import { NoAnalysisState } from '@/components/features/analysis/no-analysis-state'

export const metadata: Metadata = {
  title: 'Autorité — GEOMIND',
}

type Props = {
  params: Promise<{ siteId: string }>
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function AuthorityPage({ params }: Props) {
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

  const rawResults =
    latest.status === 'success'
      ? await getAuthorityResultsByAnalysisId(latest.id)
      : []

  const mappedResults: AuthorityResultRow[] = rawResults.map((r) => ({
    id: r.id,
    engine: r.engine,
    answer: r.answer,
    promptIsNeutral: r.promptIsNeutral,
    partialResponse: r.partialResponse,
    sources: r.sources.map((s) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      domain: s.domain,
      isClientDomain: s.isClientDomain,
    })),
    prompt: {
      id: r.prompt.id,
      text: r.prompt.text,
      isNeutral: r.prompt.isNeutral,
    },
  }))

  const engineStats = buildEngineStats(mappedResults)
  const crossTableRows = buildCrossTable(mappedResults)
  const clientDomain = extractDomain(site.url)

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <OverviewPolling status={latest.status} />

      {/* Page header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Autorité</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fréquence à laquelle les moteurs IA citent {site.name} dans leurs réponses
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
            ) : latest.authorityScore !== null ? (
              <ScoreGauge score={latest.authorityScore} size="lg" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border border-border bg-muted/30">
                <p className="text-center text-xs text-muted-foreground">Score non disponible</p>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <h2 className="text-base font-semibold text-foreground">Score Autorité</h2>
            <p className="text-xs text-muted-foreground">
              Taux de citation de votre site dans les réponses des 4 moteurs IA testés
            </p>
            {latest.authorityScore !== null && !isInProgress && (
              <p className="mt-1 text-3xl font-extrabold text-foreground">
                {latest.authorityScore}
                <span className="ml-1 text-base font-medium text-muted-foreground">/100</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Citations bar chart */}
      {isInProgress ? (
        <Skeleton className="h-52 rounded-xl" />
      ) : latest.status === 'success' ? (
        <CitationsBarChart stats={engineStats} />
      ) : null}

      {/* Cross-table */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Réponses par prompt et par IA
        </h2>
        {isInProgress ? (
          <div className="space-y-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        ) : latest.status === 'success' ? (
          <CitationsTable rows={crossTableRows} clientDomain={clientDomain} />
        ) : null}
      </section>

      {/* Relaunch section */}
      <section className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Relancer l&apos;analyse Autorité</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Relance uniquement la phase Autorité (prompts × moteurs IA).
          </p>
        </div>
        <RunAuthorityButton siteId={siteId} />
      </section>
    </div>
  )
}
